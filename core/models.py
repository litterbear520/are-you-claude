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