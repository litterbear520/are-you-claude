"""Core detection logic - sends requests and parses responses."""
import io
import json
import time
from dataclasses import dataclass
from typing import Optional, Generator, Tuple, Union

import httpx

from .prompts import get_test, get_prompt, get_expected
from .models import detect_model, check_fake_indicators, is_garbled_present

DEFAULT_CONFIG = {
    "max_tokens": 32000,
    "thinking_budget": 31999
}

MODEL_OPTIONS = {
    "1": ("Sonnet", "claude-sonnet-4-5-20250929"),
    "2": ("Opus", "claude-opus-4-5-20251101"),
}

@dataclass
class TestResult:
    test_id: int
    test_name: str
    prompt: str
    response: str
    thinking: str
    detected_model: str
    is_fake: bool
    fake_indicators: dict
    details: dict

def build_headers(api_key: str) -> dict:
    """Build request headers simulating Claude CLI."""
    return {
        "accept": "application/json",
        "anthropic-beta": "claude-code-20250219,interleaved-thinking-2025-05-14",
        "anthropic-dangerous-direct-browser-access": "true",
        "anthropic-version": "2023-06-01",
        "authorization": f"Bearer {api_key}",
        "content-type": "application/json",
        "user-agent": "claude-cli/2.0.76 (external, cli)",
        "x-app": "cli",
        "x-stainless-arch": "x64",
        "x-stainless-helper-method": "stream",
        "x-stainless-lang": "js",
        "x-stainless-os": "Windows",
        "x-stainless-package-version": "0.70.0",
        "x-stainless-retry-count": "0",
        "x-stainless-runtime": "node",
        "x-stainless-runtime-version": "v25.1.0",
        "x-stainless-timeout": "600",
        "accept-encoding": "identity",
    }

def build_body(message: str, model_id: str, with_thinking: bool = True) -> dict:
    """Build request body simulating Claude Code request."""
    body = {
        "model": model_id,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "null"},
                    {"type": "text", "text": "null"},
                    {
                        "type": "text",
                        "text": message,
                        "cache_control": {"type": "ephemeral"}
                    }
                ]
            }
        ],
        "system": [
            {
                "type": "text",
                "text": "null",
                "cache_control": {"type": "ephemeral"}
            }
        ],
        "metadata": {
            "user_id": "user_82a10c807646e5141d2ffcbf5c6d439ee4cfd99d1903617b7b69e3a5c03b1dbf_account__session_74673a26-ea49-47f4-a8ed-27f9248f231f"
        },
        "max_tokens": DEFAULT_CONFIG["max_tokens"],
        "stream": True
    }
    if with_thinking:
        body["thinking"] = {
            "type": "enabled",
            "budget_tokens": DEFAULT_CONFIG["thinking_budget"]
        }
    return body

def send_request(
    url: str,
    api_key: str,
    message: str,
    model_id: str,
    with_thinking: bool = True,
) -> Generator[Tuple[str, str], None, None]:
    """
    Send a clean request and yield (thinking_chunk, text_chunk) tuples.
    For streaming display. Returns full response via generator.
    """
    if not url.endswith("/v1/messages"):
        url = url.rstrip("/") + "/v1/messages"

    headers = build_headers(api_key)
    body = build_body(message, model_id, with_thinking)

    full_response = ""
    full_thinking = ""
    in_thinking = False

    try:
        with httpx.Client(timeout=600.0) as client:
            with client.stream(
                "POST", url, headers=headers, json=body, params={"beta": "true"}
            ) as response:
                if response.status_code != 200:
                    error = response.read().decode('utf-8')
                    yield ("", f"API Error [{response.status_code}]: {error}")
                    return

                buffer = io.StringIO()
                for chunk in response.iter_bytes():
                    buffer.write(chunk.decode('utf-8', errors='ignore'))
                    while '\n' in buffer.getvalue():
                        content = buffer.getvalue()
                        line, remainder = content.split('\n', 1)
                        buffer = io.StringIO()
                        buffer.write(remainder)
                        line = line.strip()
                        if not line.startswith("data: "):
                            continue
                        data = line[6:]
                        if data == "[DONE]":
                            break
                        try:
                            event = json.loads(data)
                            event_type = event.get("type", "")

                            if event_type == "content_block_start":
                                block = event.get("content_block", {})
                                if block.get("type") == "thinking":
                                    in_thinking = True
                            elif event_type == "content_block_delta":
                                delta = event.get("delta", {})
                                if delta.get("type") == "text_delta":
                                    text = delta.get("text", "")
                                    full_response += text
                                    yield ("", text)
                                elif delta.get("type") == "thinking_delta":
                                    thinking_chunk = delta.get("thinking", "")
                                    full_thinking += thinking_chunk
                                    yield (thinking_chunk, "")
                        except json.JSONDecodeError:
                            pass
    except httpx.ConnectError as e:
        yield ("", f"连接失败: {e}")
    except httpx.TimeoutException:
        yield ("", "请求超时")
    except Exception as e:
        yield ("", f"请求异常: {e}")

def run_single_test(
    url: str,
    api_key: str,
    model_id: str,
    test_id: int,
    with_thinking: bool = True
) -> Generator[Tuple[str, str], None, TestResult]:
    """
    Run a single test and yield (thinking_chunk, text_chunk) tuples.
    Yields TestResult at the end.
    """
    test = get_test(test_id)
    if not test:
        yield ("", "")
        return

    prompt = test["prompt"]
    expected = get_expected(test_id)
    full_response = ""
    full_thinking = ""

    for thinking_chunk, text_chunk in send_request(url, api_key, prompt, model_id, with_thinking):
        if text_chunk:
            full_response += text_chunk
        if thinking_chunk:
            full_thinking += thinking_chunk
        yield (thinking_chunk, text_chunk)

    detected_model = detect_model(full_response)
    fake_indicators = check_fake_indicators(full_response, full_thinking)

    yield TestResult(
        test_id=test_id,
        test_name=test["name"],
        prompt=prompt,
        response=full_response,
        thinking=full_thinking,
        detected_model=detected_model,
        is_fake=bool(fake_indicators),
        fake_indicators=fake_indicators,
        details={"expected": expected}
    )

def run_all_tests(
    url: str,
    api_key: str,
    model_id: str,
    show_thinking: bool = True
) -> list[TestResult]:
    """Run all 11 tests."""
    results = []
    for test_id in range(1, 12):
        result = None
        for chunk_or_result in run_single_test(url, api_key, model_id, test_id, True):
            if isinstance(chunk_or_result, TestResult):
                result = chunk_or_result
            elif show_thinking and chunk_or_result[0]:
                print(chunk_or_result[0], end="", flush=True)
            elif chunk_or_result[1]:
                print(chunk_or_result[1], end="", flush=True)
        if result:
            results.append(result)
    return results