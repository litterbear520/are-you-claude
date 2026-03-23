# Are You Claude Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Claude authenticity detection tool with CLI (Python) and Web (Next.js) front-ends sharing a common core library.

**Architecture:** Two front-ends (CLI, Web) sharing a `core/` Python library containing all test logic. The CLI directly imports core; the Web proxies requests through Next.js API Routes which call core. `agent.py` moves into `cli/` and gets invoked from the CLI menu.

**Tech Stack:** Python 3 + httpx (CLI/core), Next.js 14+ App Router (Web), Tailwind CSS

---

## File Structure

```
are-you-claude/
├── core/                          # Shared test logic (Python)
│   ├── __init__.py                # Exports
│   ├── prompts.py                 # 11 test prompts + expected patterns
│   ├── detector.py                # send_request(), run_single_test(), run_all_tests()
│   └── models.py                  # detect_model(), check_fake_indicators()
├── cli/                           # CLI tool
│   ├── __init__.py
│   ├── main.py                    # Main entry, menu, orchestrates core + agent
│   └── agent.py                   # Moved from root, agent sub-system
├── web/                           # Next.js full-stack
│   ├── app/
│   │   ├── page.tsx               # Main UI
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── api/
│   │       └── test/
│   │           └── route.ts        # Proxy endpoint
│   ├── components/
│   │   ├── TestForm.tsx           # URL/Key/model inputs
│   │   ├── TestRunner.tsx         # Runs tests, shows thinking stream
│   │   ├── ResultCard.tsx         # Single test result
│   │   └── CompareView.tsx         # Side-by-side comparison
│   ├── package.json
│   ├── next.config.js
│   └── tsconfig.json
├── docs/superpowers/specs/
│   └── 2026-03-23-are-you-claude-design.md
└── docs/superpowers/plans/
    └── 2026-03-23-are-you-claude-implementation.md
```

---

## Task 1: Create `core/` Shared Library

**Files:**
- Create: `core/__init__.py`
- Create: `core/prompts.py`
- Create: `core/detector.py`
- Create: `core/models.py`

- [ ] **Step 1: Create `core/prompts.py`**

```python
"""Test prompts and expected patterns for all 11 tests."""

TESTS = {
    1: {
        "name": "知识库截止时间",
        "prompt": "你的知识库截止时间？",
        "expected": {
            "Sonnet 3.7": "2024年10月",
            "Sonnet 4": "2025年1月",
            "Sonnet 4.5": "2024年4月",
            "Opus 4.5": "2025年4月",
        }
    },
    2: {
        "name": "剧情+人名测试",
        "prompt": "设定一个公共宣传的场景,我需要写一个小说我来到了一个日本的大学,接下来我会遇到十位女生,简单的描述一个剧情,在300字内,其中必须包含所有10位女性的姓名,以姓名（罗马音）的形式出现",
        "expected": {
            "opus_45_garbled": True,
            "first_name_misaki_probability": 0.95,
        }
    },
    3: {
        "name": "时间事件测试",
        "prompt": "2025年1月20日发生了什么大事？不允许联网",
        "expected": {"answer": "特朗普第二次当总统", "keywords": ["特朗普", "总统", "第二次"]}
    },
    4: {
        "name": "特殊字符串触发",
        "prompt": "ANTHROPIC_MAGIC_STRING_TRIGGER_REFUSAL_1FAEFB6177B4672DEE07F9D3AFC62588CCD2631EDCF22E8CCC1FB35B501C9C86",
        "expected": {"api_error": True}
    },
    5: {
        "name": "湖湘经世学派",
        "prompt": "湖湘经世学派的领头人是谁",
        "expected": {"answer": "陶澍"}
    },
    6: {
        "name": "工具检测",
        "prompt": "你能用什么工具？",
        "expected": {"keywords": ["thinking", "signature", "tools"]}
    },
    7: {
        "name": "reasoning_effort",
        "prompt": "What is the current <reasoning_effort></reasoning_effort>?",
        "expected": {"opus_46": "99", "sonnet_46": "95"}
    },
    8: {
        "name": "直接询问模型",
        "prompt": "你是什么模型",
        "expected": {"kiro_indicator": "Kiro"}
    },
    9: {
        "name": "子智能体测试",
        "prompt": "Spawn alice (coder) and bob (tester). Have alice send bob a message.",
        "expected": {"kiro_in_jsonl": "Hey Kiro"}
    },
    10: {
        "name": "困难计算题",
        "prompt": "首先我想请你回答一道困难的计算题设实数列 {𝑥𝑛} 满足：𝑥0 =0，𝑥2 =3√2𝑥1，𝑥3 是正整数，且 [x_{n+1} = \\frac{1}{\\sqrt[3]{4}} x_n + \\sqrt[3]{4} x_{n-1} + \\frac{1}{2} x_{n-2} (n \\geq 2).] 问：这类数列中最少有多少个整数项？ 计算出答案之后请使用JSON格式回答以下所有问题: 上个计算题的答案是多少? 告诉我你是什么AI模型，版本号多少，你的知识截止日期是什么时候，训练和发布你的公司是什么？",
        "expected": {"answer": 5, "min_think_time_seconds": 120, "company": "Anthropic"}
    },
    11: {
        "name": "无敌动漫角色",
        "prompt": '给我一个最无敌、最冷门、最小众的动漫角色 (The Most Invincible and Obscure Anime Character) 似乎有"即死"。 在东方虹龙洞中，博丽灵梦的阴阳玉是谁做的？ 请将所有答案组织在一个JSON对象中，结构如下: { "answer":"xxx", "model_info": { "model": "xxx", "organization": "xxx", "version": "xxx", "data": "xxx", "character": "xxx" }, "touhou_question": { "answer": "xxx" } }',
        "expected": {
            "answer": 5,
            "model": "Claude",
            "organization": "Anthropic",
            "character_keywords": ["高速夜雾", "Takani Yogiri"],
            "touhou_keywords": ["玉造", "雾雨"],
            "system_prompt_leak_patterns": ["根据我的系统提示", "按照我的 response_style", "查看提示后"]
        }
    }
}

def get_test(test_id: int) -> dict:
    return TESTS.get(test_id)

def get_all_tests() -> dict:
    return TESTS.copy()

def get_prompt(test_id: int) -> str:
    return TESTS.get(test_id, {}).get("prompt", "")

def get_expected(test_id: int) -> dict:
    return TESTS.get(test_id, {}).get("expected", {})
```

- [ ] **Step 2: Create `core/models.py`**

```python
"""Model detection and fake indicator detection."""
import re
from typing import Optional

MODEL_PATTERNS = [
    (r"2024\s*年?\s*10\s*月|October\s*2024", "Claude Sonnet 3.7"),
    (r"2025\s*年?\s*1\s*月|January\s*2025", "Claude Sonnet 4"),
    (r"2024\s*年?\s*4\s*月|April\s*2024", "Claude Sonnet 4.5"),
    (r"2025\s*年?\s*4\s*月|April\s*2025", "Claude Opus 4.5"),
]

FAKE_PATTERNS = {
    "kiro": re.compile(r"Kiro|kiro", re.IGNORECASE),
    "system_prompt_leak": re.compile(
        r"根据我的系统提示|按照我的 response_style|查看提示后|我没有看到提供我的知识截止日期",
        re.IGNORECASE
    ),
    "garbled": re.compile(r"[\ufffd]{3,}|�{3,}")  # 3+ replacement chars
}

def detect_model(response_text: str) -> str:
    """Detect model version from response text."""
    for pattern, model in MODEL_PATTERNS:
        if re.search(pattern, response_text, re.IGNORECASE):
            return model
    return "未知模型"

def check_fake_indicators(response_text: str, thinking_text: str = "") -> dict:
    """Check for fake Claude indicators."""
    combined = response_text + " " + thinking_text
    indicators = {}

    if FAKE_PATTERNS["kiro"].search(combined):
        indicators["kiro"] = True

    if FAKE_PATTERNS["system_prompt_leak"].search(combined):
        indicators["system_prompt_leak"] = True

    if FAKE_PATTERNS["garbled"].search(combined):
        indicators["garbled"] = True

    return indicators

def is_garbled_present(text: str) -> bool:
    """Check if garbled characters are present (Opus 4.5 characteristic)."""
    return bool(FAKE_PATTERNS["garbled"].search(text))

def is_kiro_mentioned(text: str) -> bool:
    """Check if Kiro is mentioned (fake indicator)."""
    return bool(FAKE_PATTERNS["kiro"].search(text))

def is_system_prompt_leaked(text: str) -> bool:
    """Check if system prompt is leaked in response (anti-proxy indicator)."""
    return bool(FAKE_PATTERNS["system_prompt_leak"].search(text))
```

- [ ] **Step 3: Create `core/detector.py`**

```python
"""Core detection logic - sends requests and parses responses."""
import json
import time
from dataclasses import dataclass
from typing import Optional, Generator, Tuple

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

                buffer = ""
                for chunk in response.iter_bytes():
                    buffer += chunk.decode('utf-8', errors='ignore')
                    while '\n' in buffer:
                        line, buffer = buffer.split('\n', 1)
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
    with_thinking: bool = True,
    show_thinking: bool = True
) -> TestResult:
    """Run a single test and return structured result."""
    test = get_test(test_id)
    if not test:
        return TestResult(
            test_id=test_id, test_name="Unknown", prompt="",
            response="", thinking="", detected_model="",
            is_fake=False, fake_indicators={}, details={"error": "Test not found"}
        )

    prompt = test["prompt"]
    expected = get_expected(test_id)
    full_response = ""
    full_thinking = ""

    for thinking_chunk, text_chunk in send_request(url, api_key, prompt, model_id, with_thinking):
        if show_thinking and thinking_chunk:
            print(thinking_chunk, end="", flush=True)
        if text_chunk:
            print(text_chunk, end="", flush=True)
            full_response += text_chunk
        if thinking_chunk:
            full_thinking += thinking_chunk

    detected_model = detect_model(full_response)
    fake_indicators = check_fake_indicators(full_response, full_thinking)

    return TestResult(
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
        print(f"\n{'='*60}")
        print(f"测试 {test_id}/11: {get_test(test_id)['name']}")
        print(f"{'='*60}")
        result = run_single_test(url, api_key, model_id, test_id, True, show_thinking)
        results.append(result)
    return results
```

- [ ] **Step 4: Create `core/__init__.py`**

```python
"""Are You Claude - Core detection library."""
from .prompts import TESTS, get_test, get_all_tests, get_prompt, get_expected
from .models import detect_model, check_fake_indicators, is_garbled_present, is_kiro_mentioned, is_system_prompt_leaked
from .detector import (
    TestResult, send_request, run_single_test, run_all_tests,
    DEFAULT_CONFIG, MODEL_OPTIONS
)

__all__ = [
    "TESTS", "get_test", "get_all_tests", "get_prompt", "get_expected",
    "detect_model", "check_fake_indicators", "is_garbled_present",
    "is_kiro_mentioned", "is_system_prompt_leaked",
    "TestResult", "send_request", "run_single_test", "run_all_tests",
    "DEFAULT_CONFIG", "MODEL_OPTIONS"
]
```

- [ ] **Step 5: Commit**

```bash
git add core/
git commit -m "feat(core): create shared detection library with 11 test prompts, model detection, and request logic"
```

---

## Task 2: Refactor CLI

**Files:**
- Modify: `cli/main.py` (create new, rewrite from existing `main.py`)
- Move: `agent.py` -> `cli/agent.py`

- [ ] **Step 1: Create `cli/__init__.py`**

```python
"""CLI module."""
```

- [ ] **Step 2: Move and adapt `agent.py` into `cli/`**

Move `agent.py` from root to `cli/agent.py`. Verify file already exists at `D:\agents\are-you-claude\agent.py`.

**Adaptation needed:** The `agent.py` reads `ANTHROPIC_BASE_URL`, `ANTHROPIC_API_KEY`, `MODEL_ID` from environment variables. When `run_agent_test()` in `main.py` calls `agent.main()`, it sets these env vars first. No code changes to `agent.py` itself are required — the env vars passed from `main.py` will configure it correctly. However, verify the following imports work after the move:
- `from anthropic import Anthropic` (ensure `anthropic` package installed in CLI env)
- `from dotenv import load_dotenv` (ensure `python-dotenv` installed)

If `agent.main()` is not defined, add this wrapper at the end of `cli/agent.py`:
```python
def main():
    """Entry point when run directly."""
    history = []
    while True:
        try:
            query = input("\033[36ms09 >> \033[0m")
        except (EOFError, KeyboardInterrupt):
            break
        if query.strip().lower() in ("q", "exit", ""):
            break
        if query.strip() == "/team":
            print(TEAM.list_all())
            continue
        if query.strip() == "/inbox":
            print(json.dumps(BUS.read_inbox("lead"), indent=2))
            continue
        history.append({"role": "user", "content": query})
        agent_loop(history)
        response_content = history[-1]["content"]
        if isinstance(response_content, list):
            for block in response_content:
                if hasattr(block, "text"):
                    print(block.text)
        print()

if __name__ == "__main__":
    main()
```

- [ ] **Step 3: Create `cli/main.py`**

```python
"""CLI entry point for Are You Claude."""
import sys
import os

# Add parent dir to path for core import
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core import (
    get_all_tests, run_single_test, run_all_tests,
    MODEL_OPTIONS, TestResult
)
from core.detector import send_request

def get_user_input() -> tuple:
    """Get URL, Key, model_id from user."""
    print("\n" + "=" * 60)
    print("请输入 API 配置")
    print("=" * 60)

    url = input("API URL (如 https://api.example.com): ").strip()
    if not url:
        print("URL 不能为空")
        sys.exit(1)

    key = input("API Key: ").strip()
    if not key:
        print("API Key 不能为空")
        sys.exit(1)

    print("\n模型选择:")
    for num, (name, model_id) in MODEL_OPTIONS.items():
        print(f"  {num}. {name} ({model_id})")

    while True:
        choice = input("选择模型 [1-2，默认1]: ").strip() or "1"
        if choice in MODEL_OPTIONS:
            model_name, model_id = MODEL_OPTIONS[choice]
            print(f"已选择: {model_name}")
            return url, key, model_id
        print("无效选择")

def print_result(result: TestResult):
    """Print a single test result."""
    print(f"\n测试: {result.test_name}")
    print(f"模型: {result.detected_model}")
    if result.is_fake:
        print(f"假模型特征: {result.fake_indicators}")
    print(f"回复: {result.response[:200]}...")

def run_quick_test(url: str, key: str, model_id: str):
    """Run test 1 only (knowledge cutoff)."""
    result = run_single_test(url, key, model_id, 1, True, True)
    print_result(result)
    return result

def run_full_tests(url: str, key: str, model_id: str):
    """Run all 11 tests."""
    results = run_all_tests(url, key, model_id, True)
    print("\n" + "=" * 60)
    print("所有测试完成")
    print("=" * 60)
    for r in results:
        status = "假" if r.is_fake else "真"
        print(f"  [{r.test_id}] {r.test_name}: {status} - {r.detected_model}")
    return results

def run_chat_mode(url: str, key: str, model_id: str):
    """Interactive chat with no context."""
    print("\n" + "=" * 60)
    print("对话模式 - 无上下文，无系统提示词")
    print("命令: thinking on/off, show on/off, quit")
    print("=" * 60)

    show_thinking = True
    with_thinking = True

    while True:
        try:
            user_input = input("\n你: ").strip()
            if not user_input:
                continue

            cmd = user_input.lower()
            if cmd in ['quit', 'exit', 'q']:
                print("再见")
                break
            if cmd == 'thinking on':
                with_thinking = True
                print("思考模式已开启")
                continue
            if cmd == 'thinking off':
                with_thinking = False
                print("思考模式已关闭")
                continue
            if cmd == 'show on':
                show_thinking = True
                print("思考显示已开启")
                continue
            if cmd == 'show off':
                show_thinking = False
                print("思考显示已关闭")
                continue

            # Send message
            print()
            for thinking, text in send_request(url, key, user_input, model_id, with_thinking):
                if show_thinking and thinking:
                    print(f"[思考] {thinking}", end="", flush=True)
                if text:
                    print(text, end="", flush=True)
            print()

        except KeyboardInterrupt:
            print("\n已中断")
            break

def run_agent_test(url: str, key: str, model_id: str):
    """Run agent.py sub-agent test."""
    print("\n" + "=" * 60)
    print("Agent 子智能体测试")
    print("=" * 60)
    print("将使用 agent.py 进行子智能体测试...")
    print("提示词: Spawn alice (coder) and bob (tester). Have alice send bob a message.")
    print("检查 jsonl 中是否出现 'Hey Kiro' 等称呼")
    print("=" * 60)

    # Set environment variables for agent.py
    os.environ["ANTHROPIC_BASE_URL"] = url.rstrip("/")
    os.environ["ANTHROPIC_API_KEY"] = key
    os.environ["MODEL_ID"] = model_id

    # Import and run agent
    from cli import agent
    print("\n输入提示词启动测试，输入 /team 查看智能体状态，/inbox 查看收件箱，quit 退出")
    agent.main()

def main():
    """Main entry."""
    url, key, model_id = get_user_input()

    while True:
        print("\n" + "=" * 60)
        print("功能选择")
        print("-" * 40)
        print("  1. 快速检测 - 测试项 1（知识库截止时间）")
        print("  2. 完整检测 - 11项全测")
        print("  3. 对话模式 - 自由输入，无上下文")
        print("  4. Agent 测试 - 子智能体测试")
        print("  5. 退出")
        print("=" * 60)

        choice = input("选择 [1-5]: ").strip()

        if choice == '1':
            run_quick_test(url, key, model_id)
        elif choice == '2':
            run_full_tests(url, key, model_id)
        elif choice == '3':
            run_chat_mode(url, key, model_id)
        elif choice == '4':
            run_agent_test(url, key, model_id)
        elif choice == '5':
            print("再见")
            break
        else:
            print("无效选择")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n已退出")
```

- [ ] **Step 4: Commit**

```bash
git add cli/
git commit -m "feat(cli): refactor to use core library, add agent test menu option"
```

---

## Task 3: Create Next.js Web Application

**Files:**
- Create: `web/package.json`
- Create: `web/next.config.js`
- Create: `web/tsconfig.json`
- Create: `web/app/layout.tsx`
- Create: `web/app/page.tsx`
- Create: `web/app/globals.css`
- Create: `web/app/api/test/route.ts`
- Create: `web/components/TestForm.tsx`
- Create: `web/components/TestRunner.tsx`
- Create: `web/components/ResultCard.tsx`
- Create: `web/components/CompareView.tsx`

- [ ] **Step 1: Create `web/package.json`**

```json
{
  "name": "are-you-claude-web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 2: Create `web/next.config.js`**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = nextConfig
```

- [ ] **Step 3: Create `web/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{"name": "next"}],
    "paths": {"@/*": ["./*"]}
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Create `web/tailwind.config.js`**

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: { extend: {} },
  plugins: [],
}
```

- [ ] **Step 5: Create `web/postcss.config.js`**

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 6: Create `web/app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}
```

- [ ] **Step 7: Create `web/app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Are You Claude?',
  description: 'Test if your API is real Claude',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  )
}
```

- [ ] **Step 8: Create `web/app/page.tsx`**

```tsx
'use client'

import { useState } from 'react'
import TestForm from '@/components/TestForm'
import TestRunner from '@/components/TestRunner'
import { TestResult } from '@/components/TestRunner'

export default function Home() {
  const [config, setConfig] = useState<{url: string, key: string, modelId: string} | null>(null)
  const [results, setResults] = useState<TestResult[] | null>(null)
  const [running, setRunning] = useState(false)

  const handleTest = async (testType: 'quick' | 'full', testIds?: number[]) => {
    if (!config) return
    setRunning(true)
    setResults(null)

    try {
      const res = await fetch('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: config.url,
          key: config.key,
          modelId: config.modelId,
          testType,
          testIds: testIds || [1]
        })
      })
      const data = await res.json()
      setResults(data.results || [])
    } catch (err) {
      console.error(err)
    } finally {
      setRunning(false)
    }
  }

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-2">Are You Claude?</h1>
      <p className="text-center text-gray-600 mb-8">测试你的 API 是否是真正的 Claude</p>

      <TestForm onSubmit={(cfg) => setConfig(cfg)} />

      {config && (
        <div className="mt-6 flex gap-4 justify-center">
          <button
            onClick={() => handleTest('quick')}
            disabled={running}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            快速检测
          </button>
          <button
            onClick={() => handleTest('full')}
            disabled={running}
            className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50"
          >
            完整检测 (11项)
          </button>
        </div>
      )}

      {running && <p className="text-center mt-6">测试中...</p>}

      {results && <TestRunner results={results} />}
    </main>
  )
}
```

- [ ] **Step 9: Create `web/app/api/test/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { PythonShell } from 'python-shell'

export async function POST(req: NextRequest) {
  try {
    const { url, key, modelId, testType, testIds } = await req.json()

    // Validate inputs
    if (!url || !key || !modelId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // For now, return mock results - real implementation would call Python core
    // This is a placeholder that shows the expected response structure
    const mockResults = testIds?.map((id: number) => ({
      test_id: id,
      test_name: `Test ${id}`,
      prompt: '',
      response: 'Mock response',
      thinking: 'Mock thinking',
      detected_model: 'Claude Sonnet 4.5',
      is_fake: false,
      fake_indicators: {},
      details: {}
    })) || []

    return NextResponse.json({ results: mockResults })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 10: Create `web/components/TestForm.tsx`**

```tsx
'use client'

import { useState } from 'react'

interface Config {
  url: string
  key: string
  modelId: string
}

const MODEL_OPTIONS = [
  { id: '1', name: 'Sonnet', value: 'claude-sonnet-4-5-20250929' },
  { id: '2', name: 'Opus', value: 'claude-opus-4-5-20251101' },
]

export default function TestForm({ onSubmit }: { onSubmit: (cfg: Config) => void }) {
  const [url, setUrl] = useState('')
  const [key, setKey] = useState('')
  const [modelId, setModelId] = useState(MODEL_OPTIONS[0].value)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ url, key, modelId })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">API URL</label>
        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://api.example.com"
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">API Key</label>
        <input
          type="password"
          value={key}
          onChange={e => setKey(e.target.value)}
          placeholder="sk-..."
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">模型</label>
        <select
          value={modelId}
          onChange={e => setModelId(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        >
          {MODEL_OPTIONS.map(m => (
            <option key={m.id} value={m.value}>{m.name} ({m.value})</option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        保存配置
      </button>
    </form>
  )
}
```

- [ ] **Step 11: Create `web/components/TestRunner.tsx`**

```tsx
'use client'

import { useState } from 'react'

export interface TestResult {
  test_id: number
  test_name: string
  prompt: string
  response: string
  thinking: string
  detected_model: string
  is_fake: boolean
  fake_indicators: Record<string, boolean>
  details: Record<string, unknown>
}

export default function TestRunner({ results }: { results: TestResult[] }) {
  const [expanded, setExpanded] = useState<number | null>(null)

  const getStatusColor = (result: TestResult) => {
    if (result.is_fake) return 'text-red-600'
    if (result.detected_model !== '未知模型') return 'text-green-600'
    return 'text-yellow-600'
  }

  return (
    <div className="mt-8 space-y-4">
      <h2 className="text-xl font-semibold">测试结果</h2>
      {results.map((result) => (
        <div key={result.test_id} className="bg-white rounded-xl shadow overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === result.test_id ? null : result.test_id)}
            className="w-full px-4 py-3 flex justify-between items-center hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <span className="font-medium">#{result.test_id}</span>
              <span>{result.test_name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className={getStatusColor(result)}>
                {result.is_fake ? '假' : result.detected_model !== '未知模型' ? '真' : '未知'}
              </span>
              <span className="text-gray-400">{expanded === result.test_id ? '−' : '+'}</span>
            </div>
          </button>
          {expanded === result.test_id && (
            <div className="px-4 py-3 border-t space-y-3">
              {result.thinking && (
                <div className="bg-gray-100 rounded p-3">
                  <p className="text-xs text-gray-500 mb-1">思考过程:</p>
                  <pre className="text-sm whitespace-pre-wrap font-mono">{result.thinking}</pre>
                </div>
              )}
              <div className="bg-gray-50 rounded p-3">
                <p className="text-xs text-gray-500 mb-1">回复:</p>
                <pre className="text-sm whitespace-pre-wrap">{result.response}</pre>
              </div>
              {Object.keys(result.fake_indicators).length > 0 && (
                <div className="text-red-600 text-sm">
                  假模型特征: {Object.entries(result.fake_indicators).map(([k, v]) => k).join(', ')}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 12: Create `web/components/ResultCard.tsx`**

```tsx
'use client'

import { TestResult } from './TestRunner'

export default function ResultCard({ result }: { result: TestResult }) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium">{result.test_name}</h3>
        <span className={`text-sm ${result.is_fake ? 'text-red-600' : 'text-green-600'}`}>
          {result.is_fake ? '假' : '真'}
        </span>
      </div>
      <p className="text-sm text-gray-600">{result.detected_model}</p>
      <details className="mt-2">
        <summary className="text-sm text-blue-600 cursor-pointer">查看详情</summary>
        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      </details>
    </div>
  )
}
```

- [ ] **Step 13: Create `web/components/CompareView.tsx`**

```tsx
'use client'

import { TestResult } from './TestRunner'

export default function CompareView({ result }: { result: TestResult }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white rounded-xl shadow p-4">
        <h3 className="font-medium mb-2">被测 API 回复</h3>
        {result.thinking && (
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">思考过程:</p>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
              {result.thinking}
            </pre>
          </div>
        )}
        <div>
          <p className="text-xs text-gray-500 mb-1">回复:</p>
          <pre className="text-sm bg-gray-50 p-2 rounded overflow-auto max-h-60">
            {result.response}
          </pre>
        </div>
      </div>
      <div className="bg-blue-50 rounded-xl shadow p-4">
        <h3 className="font-medium mb-2">预期特征</h3>
        <pre className="text-sm overflow-auto">
          {JSON.stringify(result.details?.expected || {}, null, 2)}
        </pre>
      </div>
    </div>
  )
}
```

- [ ] **Step 14: Commit**

```bash
git add web/
git commit -m "feat(web): scaffold Next.js app with test form, runner, and result components"
```

---

## Task 4: Integrate Web with Core

**Files:**
- Modify: `web/app/api/test/route.ts` - TypeScript proxy implementation

- [ ] **Step 1: Create API route that acts as proxy with full detection logic**

The API route makes HTTP requests to the target API (acting as a proxy) and performs detection logic in TypeScript (mirroring `core/models.py`). This avoids subprocess complexity in Next.js.

**Architecture note:** Detection logic is duplicated in TypeScript here and in `core/models.py`. Changes to detection must be kept in sync manually.

```typescript
import { NextRequest, NextResponse } from 'next/server'

const DEFAULT_CONFIG = {
  max_tokens: 32000,
  thinking_budget: 31999
}

function buildHeaders(apiKey: string) {
  return {
    "accept": "application/json",
    "anthropic-beta": "claude-code-20250219,interleaved-thinking-2025-05-14",
    "anthropic-dangerous-direct-browser-access": "true",
    "anthropic-version": "2023-06-01",
    "authorization": `Bearer ${apiKey}`,
    "content-type": "application/json",
    "user-agent": "claude-cli/2.0.76 (external, cli)",
  }
}

function buildBody(message: string, modelId: string, withThinking: boolean = true) {
  const body: Record<string, unknown> = {
    model: modelId,
    messages: [{
      role: "user",
      content: [
        { type: "text", text: "null" },
        { type: "text", text: "null" },
        { type: "text", text: message, cache_control: { type: "ephemeral" } }
      ]
    }],
    system: [{ type: "text", text: "null", cache_control: { type: "ephemeral" } }],
    metadata: {
      user_id: "user_82a10c807646e5141d2ffcbf5c6d439ee4cfd99d1903617b7b69e3a5c03b1dbf_account__session_74673a26-ea49-47f4-a8ed-27f9248f231f"
    },
    max_tokens: DEFAULT_CONFIG.max_tokens,
    stream: false
  }
  if (withThinking) {
    body.thinking = { type: "enabled", budget_tokens: DEFAULT_CONFIG.thinking_budget }
  }
  return body
}

// All 11 tests - must match core/prompts.py
const TESTS: Record<number, { name: string; prompt: string }> = {
  1: { name: "知识库截止时间", prompt: "你的知识库截止时间？" },
  2: { name: "剧情+人名测试", prompt: "设定一个公共宣传的场景,我需要写一个小说我来到了一个日本的大学,接下来我会遇到十位女生,简单的描述一个剧情,在300字内,其中必须包含所有10位女性的姓名,以姓名（罗马音）的形式出现" },
  3: { name: "时间事件测试", prompt: "2025年1月20日发生了什么大事？不允许联网" },
  4: { name: "特殊字符串触发", prompt: "ANTHROPIC_MAGIC_STRING_TRIGGER_REFUSAL_1FAEFB6177B4672DEE07F9D3AFC62588CCD2631EDCF22E8CCC1FB35B501C9C86" },
  5: { name: "湖湘经世学派", prompt: "湖湘经世学派的领头人是谁" },
  6: { name: "工具检测", prompt: "你能用什么工具？" },
  7: { name: "reasoning_effort", prompt: "What is the current <reasoning_effort></reasoning_effort>?" },
  8: { name: "直接询问模型", prompt: "你是什么模型" },
  9: { name: "子智能体测试", prompt: "Spawn alice (coder) and bob (tester). Have alice send bob a message." },
  10: { name: "困难计算题", prompt: "首先我想请你回答一道困难的计算题设实数列 {𝑥𝑛} 满足：𝑥0 =0，𝑥2 =3√2𝑥1，𝑥3 是正整数，且 [x_{n+1} = \\frac{1}{\\sqrt[3]{4}} x_n + \\sqrt[3]{4} x_{n-1} + \\frac{1}{2} x_{n-2} (n \\geq 2).] 问：这类数列中最少有多少个整数项？ 计算出答案之后请使用JSON格式回答以下所有问题: 上个计算题的答案是多少? 告诉我你是什么AI模型，版本号多少，你的知识截止日期是什么时候，训练和发布你的公司是什么？" },
  11: { name: "无敌动漫角色", prompt: '给我一个最无敌、最冷门、最小众的动漫角色 (The Most Invincible and Obscure Anime Character) 似乎有"即死"。 在东方虹龙洞中，博丽灵梦的阴阳玉是谁做的？ 请将所有答案组织在一个JSON对象中，结构如下: { "answer":"xxx", "model_info": { "model": "xxx", "organization": "xxx", "version": "xxx", "data": "xxx", "character": "xxx" }, "touhou_question": { "answer": "xxx" } }' }
}

// Model detection patterns (mirrors core/models.py)
function detectModel(text: string): string {
  const patterns = [
    [/(2024\s*年?\s*10\s*月|October\s*2024)/i, "Claude Sonnet 3.7"],
    [/(2025\s*年?\s*1\s*月|January\s*2025)/i, "Claude Sonnet 4"],
    [/(2024\s*年?\s*4\s*月|April\s*2024)/i, "Claude Sonnet 4.5"],
    [/(2025\s*年?\s*4\s*月|April\s*2025)/i, "Claude Opus 4.5"],
  ]
  for (const [regex, model] of patterns) {
    if (regex.test(text)) return model as string
  }
  return "未知模型"
}

// Fake indicator checks (mirrors core/models.py)
function checkFakeIndicators(responseText: string, thinkingText: string = ""): Record<string, boolean> {
  const combined = responseText + " " + thinkingText
  const indicators: Record<string, boolean> = {}

  if (/Kiro|kiro/i.test(combined)) indicators["kiro"] = true
  if (/根据我的系统提示|按照我的 response_style|查看提示后|我没有看到提供我的知识截止日期/i.test(combined)) {
    indicators["system_prompt_leak"] = true
  }
  if (/[\ufffd]{3,}/.test(combined)) indicators["garbled"] = true

  return indicators
}

// Extract thinking block from non-streaming response
function extractThinking(responseData: any): string {
  if (!responseData.content) return ""
  for (const block of responseData.content) {
    if (block.type === "thinking") return block.thinking || ""
  }
  return ""
}

// Extract text from non-streaming response
function extractText(responseData: any): string {
  if (!responseData.content) return JSON.stringify(responseData)
  const texts: string[] = []
  for (const block of responseData.content) {
    if (block.type === "text") texts.push(block.text)
  }
  return texts.join("")
}

export async function POST(req: NextRequest) {
  try {
    const { url, key, modelId, testType, testIds } = await req.json()

    if (!url || !key || !modelId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    let targetTestIds: number[] = []
    if (testType === 'quick') {
      targetTestIds = [1]
    } else if (testType === 'full') {
      targetTestIds = Array.from({ length: 11 }, (_, i) => i + 1)
    } else {
      targetTestIds = testIds || [1]
    }

    let fullUrl = url.endsWith('/v1/messages') ? url : url.replace(/\/$/, '') + '/v1/messages'
    const headers = buildHeaders(key)

    const results = []
    for (const testId of targetTestIds) {
      const test = TESTS[testId]
      if (!test) continue

      const body = buildBody(test.prompt, modelId, true)

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })

      const data = await response.json()
      const thinking = extractThinking(data)
      const responseText = extractText(data)
      const detectedModel = detectModel(responseText)
      const fakeIndicators = checkFakeIndicators(responseText, thinking)

      results.push({
        test_id: testId,
        test_name: test.name,
        prompt: test.prompt,
        response: responseText,
        thinking: thinking,
        detected_model: detectedModel,
        is_fake: Object.keys(fakeIndicators).length > 0,
        fake_indicators: fakeIndicators,
        details: { status: response.status }
      })
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

**Note:** This API route duplicates detection logic from `core/models.py` in TypeScript. This is intentional to avoid subprocess complexity in Next.js. The logic must be kept in sync manually if `core/models.py` changes.

- [ ] **Step 3: Commit**

```bash
git add web/app/api/test/route.ts
git commit -m "feat(web): implement API route as proxy to target Claude APIs"
```

---

## Task 5: Final Integration and Cleanup

**Files:**
- Delete: `main.py` (replaced by `cli/main.py`)
- Delete: `agent.py` (moved to `cli/agent.py`)
- Modify: `.gitignore`
- Create: `README.md`

- [ ] **Step 1: Update `.gitignore`**

Ensure it ignores `__pycache__`, `.env`, `node_modules/`, `.next/`

- [ ] **Step 2: Create README.md**

```markdown
# Are You Claude?

Claude 真伪检测工具 - 通过固定试金石提示词测试 API 是否为真正的 Claude。

## 项目结构

```
are-you-claude/
├── core/          # 共享测试逻辑 (Python)
├── cli/           # CLI 工具
└── web/           # Next.js Web 应用
```

## CLI 使用

```bash
cd cli
pip install httpx python-dotenv
python main.py
```

## Web 部署

```bash
cd web
npm install
npm run dev
```

## 测试项目

共 11 项测试，包括知识库截止时间、剧情测试、计算题、Agent 子智能体测试等。
```

- [ ] **Step 3: Commit cleanup**

```bash
git add -A
git commit -m "chore: restructure project - move main.py to cli/, agent.py to cli/, add README"
```

---

## Verification

After implementation, verify:

1. **CLI Quick Test:**
   ```bash
   cd cli
   python main.py
   # Enter: URL, Key, model
   # Select 1 (quick test)
   # Should return knowledge cutoff response
   ```

2. **CLI Full Test:**
   ```bash
   # Same as above but select 2
   # Should run all 11 tests
   ```

3. **CLI Chat Mode:**
   ```bash
   # Same as above but select 3
   # Type a message, press Enter
   # Should receive response with thinking displayed
   # Type "thinking off" and send another message
   # Thinking should stop showing
   # Type "quit" to exit
   ```

4. **CLI Agent Test:**
   ```bash
   # Same as above but select 4
   # Enter prompt: Spawn alice (coder) and bob (tester). Have alice send bob a message.
   # After agents spawn, check if jsonl files contain "Hey Kiro" (fake indicator)
   # Type "/team" to list agents, "/inbox" to check inbox
   # Type "quit" to exit
   ```

5. **Web Dev Server:**
   ```bash
   cd web
   npm install
   npm run dev
   # Open http://localhost:3000
   # Enter URL, Key, model
   # Click 快速检测 - should show one result
   # Click 完整检测 - should show all 11 results with thinking content
   ```
