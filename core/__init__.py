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