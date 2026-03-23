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
