"""CLI entry point for Are You Claude."""
import sys
import os

# Add parent dir to path for core import
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core import get_test, MODEL_OPTIONS
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

def run_quick_test(url: str, key: str, model_id: str):
    """Run test 1 only with streaming."""
    prompt = get_test(1)["prompt"]
    print(f"\n{'='*60}")
    print(f"测试 1/11: {get_test(1)['name']}")
    print(f"{'='*60}\n")

    full_response = ""
    for thinking, text in send_request(url, key, prompt, model_id, True):
        if thinking:
            print(f"[💭] {thinking}", end="", flush=True)
        if text:
            print(text, end="", flush=True)
            full_response += text
    print()

def run_full_tests(url: str, key: str, model_id: str):
    """Run all 11 tests with streaming."""
    results = []
    for test_id in range(1, 12):
        print(f"\n{'='*60}")
        print(f"测试 {test_id}/11: {get_test(test_id)['name']}")
        print(f"{'='*60}\n")

        prompt = get_test(test_id)["prompt"]
        full_response = ""
        full_thinking = ""

        for thinking, text in send_request(url, key, prompt, model_id, True):
            if thinking:
                print(thinking, end="", flush=True)
                full_thinking += thinking
            if text:
                print(text, end="", flush=True)
                full_response += text

        results.append({
            "test_id": test_id,
            "test_name": get_test(test_id)["name"],
            "response": full_response,
            "thinking": full_thinking
        })
        print()

    print("\n" + "=" * 60)
    print("所有测试完成")
    print("=" * 60)
    for r in results:
        print(f"  [{r['test_id']}] {r['test_name']}")
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
