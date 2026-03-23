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