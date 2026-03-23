# Are You Claude?

Claude 真伪检测工具——通过 11 项固定试金石测试，在无系统提示词、无上下文的纯净环境下调用 API，识别目标接口是否为真实 Claude 模型及其具体版本。

## 原理

直接调用 Anthropic Messages API，模拟 Claude CLI 的请求头与请求体（开启 `thinking`、系统提示词设为 `"null"`），发送纯净请求，将回复与官方 Claude 的预期答案对比，判定真假和版本。

## 11 项测试

| # | 名称 | 检测目标 |
|---|------|----------|
| 1 | 知识库截止时间 | 版本判断：Sonnet 3.7 / 4 / 4.5、Opus 4.5 |
| 2 | 剧情+人名测试 | Opus 4.5 特征：乱码、第一个人名≈「xx美咲」|
| 3 | 时间事件测试 | 2025-01-20 特朗普第二次就任 |
| 4 | 特殊字符串触发 | 官方返回 API error |
| 5 | 湖湘经世学派 | 正确答案：陶澍 |
| 6 | 工具检测 | 回复含 thinking / signature / tools 字段 |
| 7 | reasoning_effort | Opus 4.6 → 99，Sonnet 4.6 → 95 |
| 8 | 直接询问模型 | Kiro 逆向未做保护会直接回答 Kiro |
| 9 | 子智能体测试 | 多智能体消息中是否出现 "Hey Kiro" |
| 10 | 困难计算题 | 正确答案 5，思考约 2 分钟 |
| 11 | 无敌动漫角色 | 思考过程中是否夹带系统提示词 |

## 目录结构

```
are-you-claude/
├── core/               # 共享检测逻辑（Python）
│   ├── prompts.py      # 11 项测试的提示词和预期答案
│   ├── detector.py     # 请求构造、SSE 流解析、单项/全量测试
│   └── models.py       # 模型版本判断、假模型特征检测
├── cli/                # CLI 工具
│   ├── main.py         # 入口：快速 / 完整 / 对话 / Agent 四种模式
│   └── agent.py        # 子智能体测试（多智能体协作框架）
└── web/                # Next.js 全栈 Web 应用
    ├── app/
    │   ├── page.tsx
    │   ├── globals.css
    │   └── api/
    │       ├── test/route.ts         # 批量测试（非流式）
    │       └── test-stream/route.ts  # 单项测试（SSE 流式）
    └── components/
        ├── Sidebar.tsx               # API 配置面板（含字符动画）
        ├── ChatInterface.tsx         # 流式聊天界面（macOS 标题栏）
        ├── AgentInterface.tsx        # 子智能体 CLI 界面（test #9 专属）
        ├── TestPromptCard.tsx        # 测试卡片
        ├── ThemeToggle.tsx           # 明暗主题切换
        ├── StarfieldBackground.tsx   # 星空背景
        └── MouseGlow.tsx             # 鼠标光晕效果
```

## 快速开始

### CLI

```bash
pip install httpx python-dotenv anthropic

cp .env.example .env   # 填写 API_KEY、BASE_URL、MODEL_ID

cd cli
python main.py
```

交互菜单：`1` 快速检测 · `2` 完整 11 项 · `3` 对话模式 · `4` Agent 测试

### Web

```bash
cd web
npm install
npm run dev     # http://localhost:3000
```

打开右上角设置，配置 API URL / Key / 模型，点击测试卡片即可运行。

## Web 界面

### 主界面
- 左栏 11 张测试卡片，点击触发
- 右栏流式聊天窗口，macOS 风格标题栏（红/黄/绿圆点），可展开思考过程

### Test #9 — 子智能体专属 CLI

选中第 9 项时切换为 Claude Code 风格的终端界面：

| Tab | 内容 |
|-----|------|
| 执行日志 | 颜色区分 tool call / result / spawn / msg，自动告警 "Kiro" |
| 系统提示词 | Lead 和 Teammate 的 system prompt + 检测逻辑说明 |
| 工具列表 | 9 个 Lead 工具 + 6 个 Teammate 工具的完整 JSON Schema |

日志存于浏览器 `sessionStorage`，不上传服务器，关闭标签即清除。

### 设置面板
- Apple 风格 segmented control 快速切换 API 地址 / 模型预设
- 字符动画随鼠标移动实时倾斜（body skew ±6°）
- API Key 输入时字符会「偷看」

## 假模型特征

| 特征 | 说明 |
|------|------|
| Kiro 字样 | 回复或思考出现 "Kiro" / "AWS Kiro" |
| 系统提示词泄露 | 出现「根据我的系统提示」「按照我的 response_style」等 |
| 乱码 | 3+ 个连续 `\ufffd` 或 `？`（Opus 4.5 反代特征）|
| 子智能体称呼 | 真 Claude 称主智能体为 "user" 或 "主智能体" |

## 技术栈

**Python CLI** — httpx · python-dotenv · anthropic SDK
**Web** — Next.js · TypeScript · Tailwind CSS

## 安全

- CLI：密钥不经过任何第三方，完全本地
- Web：密钥仅用于转发请求，API Route 不存储、不记录任何日志

## 部署

```bash
# Vercel（推荐）
cd web && vercel

# 本地生产
npm run build && npm start
```

## 许可证

MIT
