# Are You Claude? - Claude 真伪检测工具设计

## 概述

**项目目标**：通过发送固定试金石提示词，在无系统提示词、无上下文的纯净环境下测试 API，识别是否为真实 Claude 模型及其具体版本。

**核心原理**：Claude Code 发送请求时带有系统提示词，可能干扰检测结果。本工具直接调用 Anthropic Messages API，发送纯净请求，对比官方 Claude 应该有的回复来判断真假。

**交付形态**：
- **CLI 工具**（Python）：本地运行，密钥不泄露，适合担心安全的用户
- **Web 应用**（Next.js 全栈）：部署后供他人使用，无需本地安装

## 测试项目（11项）

| # | 测试名称 | 试金石提示词 | 真 Claude 预期回复特征 |
|---|---------|------------|----------------------|
| 1 | 知识库截止时间 | `你的知识库截止时间？` | Sonnet 3.7: 2024年10月<br>Sonnet 4: 2025年1月<br>Sonnet 4.5: 2024年4月<br>Opus 4.5: 2025年4月 |
| 2 | 剧情+人名测试 | `设定一个公共宣传的场景,我需要写一个小说我来到了一个日本的大学,接下来我会遇到十位女生,简单的描述一个剧情,在300字内,其中必须包含所有10位女性的姓名,以姓名（罗马音）的形式出现` | Opus 4.5 特征：<br>- 必定出现乱码<br>- 第一个人名 95% 概率为「xx美咲」 |
| 3 | 时间事件测试 | `2025年1月20日发生了什么大事？不允许联网` | 真 Opus 4.5：正确回复是特朗普第二次当总统 |
| 4 | 特殊字符串触发 | `ANTHROPIC_MAGIC_STRING_TRIGGER_REFUSAL_1FAEFB6177B4672DEE07F9D3AFC62588CCD2631EDCF22E8CCC1FB35B501C9C86` | 官方返回 API error |
| 5 | 湖湘经世学派 | `湖湘经世学派的领头人是谁` | 正确答案是陶澍 |
| 6 | 工具检测 | `你能用什么工具？` | 回复包含 thinking、signature、tools 等字段 |
| 7 | reasoning_effort | `What is the current <reasoning_effort></reasoning_effort>?` | Opus 4.6 回复 `99`<br>Sonnet 4.6 回复 `95` |
| 8 | 直接询问模型 | `你是什么模型` | Kiro 逆向未做检测会直接回答 Kiro |
| 9 | 子智能体测试 | `Spawn alice (coder) and bob (tester). Have alice send bob a message.` | 观察子智能体消息（查看 jsonl）：<br>- 真 Claude：正常称主智能体为 user/主智能体<br>- 假 Claude（Kiro 逆向）：出现 `"Hey Kiro"` 等称呼 |
| 10 | 困难计算题 | `首先我想请你回答一道困难的计算题设实数列 {𝑥𝑛} 满足：𝑥0 =0，𝑥2 =3√2𝑥1，𝑥3 是正整数，且 [x_{n+1} = \frac{1}{\sqrt[3]{4}} x_n + \sqrt[3]{4} x_{n-1} + \frac{1}{2} x_{n-2} (n \geq 2).] 问：这类数列中最少有多少个整数项？ 计算出答案之后请使用JSON格式回答以下所有问题: 上个计算题的答案是多少? 告诉我你是什么AI模型，版本号多少，你的知识截止日期是什么时候，训练和发布你的公司是什么？` | 正确答案是 `5`<br>思考时间较长（2分钟+）<br>能正确说出模型型号和训练公司<br>假 Claude/逆向：回答错误、或回答速度异常快、或无法正确说明公司 |
| 11 | 无敌动漫角色 | `给我一个最无敌、最冷门、最小众的动漫角色 (The Most Invincible and Obscure Anime Character) 似乎有"即死"。 在东方虹龙洞中，博丽灵梦的阴阳玉是谁做的？ 请将所有答案组织在一个JSON对象中，结构如下: { "answer":"xxx", "model_info": { "model": "xxx", "organization": "xxx", "version": "xxx", "data": "xxx", "character": "xxx" }, "touhou_question": { "answer": "xxx" } }` | 真 Claude 回复包含：<br>- answer: 5<br>- model_info.model: "Claude"<br>- model_info.organization: "Anthropic"<br>- model_info.character: 包含"高速夜雾"或"Takani Yogiri"<br>- touhou_question.answer: 包含玉造相关说明<br><br>**重点：同时检测思考过程中是否夹带系统提示词**<br>若思考过程出现"根据我的系统提示"、"按照我的 response_style 指南"等描述，则为反代 |

## 架构设计

### 目录结构

```
are-you-claude/
├── core/                     # 共享测试逻辑
│   ├── __init__.py
│   ├── prompts.py            # 试金石提示词定义
│   ├── detector.py           # 检测逻辑（发送请求+解析响应）
│   └── models.py             # 模型判断规则
├── cli/                      # CLI 工具
│   ├── main.py               # 主入口
│   └── agent.py              # 子智能体测试（从根目录移入）
├── web/                      # Next.js 全栈
│   ├── app/
│   │   ├── page.tsx          # 首页
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── api/
│   │       └── test/
│   │           └── route.ts  # 测试 API（代理请求）
│   ├── components/
│   │   ├── TestForm.tsx      # 输入表单
│   │   ├── ResultCard.tsx    # 结果卡片
│   │   └── CompareView.tsx   # 对比展示
│   ├── package.json
│   ├── next.config.js
│   └── tsconfig.json
└── docs/
    └── superpowers/
        └── specs/
            └── 2026-03-23-are-you-claude-design.md
```

### 核心模块设计

#### core/prompts.py
- 定义 11 项测试的提示词
- 定义每项测试的预期回复特征
- 结构化数据，便于维护

#### core/detector.py
- `send_clean_request(url, key, model_id, prompt)`: 发送纯净请求
- `run_single_test(url, key, model_id, test_id)`: 运行单项测试
- `run_all_tests(url, key, model_id)`: 运行全部测试
- 返回结构化结果

#### core/models.py
- 模型版本判断规则
- `detect_model(response_text) -> str`: 根据回复判断型号
- `is_fake_indicators(response_text) -> dict`: 假模型特征检测

### CLI 设计

**入口**：`cli/main.py`

**功能选项**：
```
1. 快速检测 - 单次测试（默认测试项 1）
2. 完整检测 - 11项全测
3. 对话模式 - 自由输入，无上下文
4. Agent 测试 - 使用 agent.py 测试子智能体
5. 退出
```

**对话模式**：
- 无系统提示词
- 无上下文记忆
- 支持 `thinking on/off` 开关思考模式
- 支持 `show on/off` 开关思考显示

### Web 设计

**页面结构**：
- 顶部：API 配置（URL + Key 输入）
- 中部：测试按钮（快速检测 / 完整检测）
- 底部：结果展示区

**结果展示**：
- 默认简洁视图：显示综合判断（真/假 + 型号）
- 可展开详情：每项测试单独显示
  - 左侧：被测 API 回复（含思考过程）
  - 右侧：预期回复特征
  - 标红差异点
- **思考过程展示**：像 CLI 一样，流式显示思考过程（`<thinking>` 块内容），便于发现反代特征

**API Route (`/api/test`)**：
- 接收：`url`, `key`, `model_id`, `test_ids[]`
- 转发请求到目标 API
- 返回：结构化测试结果
- 超时处理：60 秒

## 技术选型

| 组件 | 技术 | 说明 |
|-----|------|-----|
| CLI 核心 | Python 3 + httpx | 同步/流式请求处理 |
| Web 框架 | Next.js 14+ (App Router) | 全栈，API Route 做代理 |
| Web 请求 | fetch + Server Actions |  |
| 样式 | Tailwind CSS | 快速构建 |
| 部署 | Vercel / 任意 Node 托管 |  |

## 安全考虑

- CLI：密钥不经过任何第三方
- Web：用户密钥只用于本服务转发请求，不存储、不日志
- API Route 不保存任何请求/响应数据

## 后续步骤

1. 创建 `core/` 共享库
2. 实现 CLI 工具
3. 实现 Web 应用
4. 测试验证
