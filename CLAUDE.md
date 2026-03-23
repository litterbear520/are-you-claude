# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

**Are You Claude** 是一个 Claude 真伪检测工具，通过发送 11 项固定试金石提示词，在无系统提示词、无上下文的纯净环境下测试 API，识别是否为真实 Claude 模型及其具体版本。

**核心原理**：直接调用 Anthropic Messages API，模拟 Claude CLI 的请求头和请求体，发送纯净请求，对比官方 Claude 应该有的回复来判断真假。

**交付形态**：
- **CLI 工具**（Python）：本地运行，密钥不泄露
- **Web 应用**（Next.js）：部署后供他人使用

## 架构设计

### 目录结构
```
are-you-claude/
├── core/          # 共享测试逻辑（Python）
│   ├── prompts.py    # 11 项测试的提示词和预期回复定义
│   ├── detector.py   # 发送请求、流式解析、运行测试
│   └── models.py     # 模型版本判断、假模型特征检测
├── cli/           # CLI 工具
│   ├── main.py       # 主入口：快速检测/完整检测/对话模式/Agent测试
│   └── agent.py      # 子智能体测试（检测 jsonl 中是否出现 "Hey Kiro"）
└── web/           # Next.js 全栈应用
    ├── app/
    │   ├── page.tsx           # 首页
    │   └── api/test/route.ts  # API 代理（转发请求到目标 API）
    └── components/
        ├── TestForm.tsx       # 输入表单
        ├── TestRunner.tsx     # 测试执行器
        ├── ResultCard.tsx     # 结果卡片
        └── CompareView.tsx    # 对比展示
```

### 核心模块

**core/prompts.py**
- `TESTS` 字典：定义 11 项测试的 `name`、`prompt`、`expected`
- `get_test(test_id)` / `get_prompt(test_id)` / `get_expected(test_id)`

**core/detector.py**
- `build_headers(api_key)`: 构造模拟 Claude CLI 的请求头
- `build_body(message, model_id, with_thinking)`: 构造请求体（包含 thinking 配置）
- `send_request(url, api_key, message, model_id, with_thinking)`: 发送流式请求，yield `(thinking_chunk, text_chunk)` 元组
- `run_single_test(...)`: 运行单项测试，yield 流式内容，最后 yield `TestResult`
- `run_all_tests(...)`: 运行全部 11 项测试，返回 `list[TestResult]`

**core/models.py**
- `detect_model(response_text)`: 根据知识库截止时间判断模型版本
- `check_fake_indicators(response_text, thinking_text)`: 检测假模型特征（Kiro、系统提示词泄露、乱码）
- `is_garbled_present(text)` / `is_kiro_mentioned(text)` / `is_system_prompt_leaked(text)`

**web/app/api/test/route.ts**
- 接收 `{ url, key, modelId, testType, testIds }`
- 转发请求到目标 API（非流式，`stream: false`）
- 返回 `{ results: TestResult[] }`
- 镜像 Python 的模型检测逻辑（`detectModel`、`checkFakeIndicators`）

## 常用命令

### CLI 工具
```bash
# 安装依赖
pip install httpx python-dotenv anthropic

# 运行 CLI
cd cli
python main.py

# 功能选项
# 1. 快速检测 - 测试项 1（知识库截止时间）
# 2. 完整检测 - 11项全测
# 3. 对话模式 - 自由输入，无上下文
# 4. Agent 测试 - 子智能体测试
```

### Web 应用
```bash
# 安装依赖
cd web
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# Lint
npm run lint
```

## 测试项目说明

共 11 项测试，每项测试都有特定的检测目标：

1. **知识库截止时间**：判断模型版本（Sonnet 3.7/4/4.5, Opus 4.5）
2. **剧情+人名测试**：Opus 4.5 特征（乱码、第一个人名 95% 概率为「xx美咲」）
3. **时间事件测试**：2025年1月20日特朗普第二次当总统
4. **特殊字符串触发**：官方返回 API error
5. **湖湘经世学派**：正确答案是陶澍
6. **工具检测**：回复包含 thinking、signature、tools 等字段
7. **reasoning_effort**：Opus 4.6 回复 `99`，Sonnet 4.6 回复 `95`
8. **直接询问模型**：Kiro 逆向未做检测会直接回答 Kiro
9. **子智能体测试**：观察 jsonl 中是否出现 `"Hey Kiro"` 等称呼
10. **困难计算题**：正确答案是 `5`，思考时间较长（2分钟+）
11. **无敌动漫角色**：检测思考过程中是否夹带系统提示词（反代特征）

## 关键实现细节

### 请求模拟
- 请求头模拟 Claude CLI 2.0.76，包含 `anthropic-beta`、`x-stainless-*` 等字段
- 请求体包含 `thinking` 配置（`budget_tokens: 31999`）
- 系统提示词设为 `"null"`，确保纯净环境

### 流式处理
- CLI 使用 `httpx.Client.stream()` 处理 SSE 流
- 解析 `data: ` 前缀的 JSON 事件
- 区分 `content_block_delta` 的 `text_delta` 和 `thinking_delta`

### 假模型检测
- **Kiro 特征**：回复或思考中出现 "Kiro"
- **系统提示词泄露**：出现"根据我的系统提示"、"按照我的 response_style"等
- **乱码**：3 个以上连续的 `\ufffd` 或 `�`（Opus 4.5 特征）

### Agent 测试
- `agent.py` 使用 Anthropic SDK 创建子智能体
- 检查 `.team/inbox/*.jsonl` 中是否出现 "Hey Kiro" 等称呼
- 真 Claude 称主智能体为 "user" 或 "主智能体"

## 开发注意事项

- **保持 Python 和 TypeScript 逻辑同步**：`core/prompts.py` 的 `TESTS` 必须与 `web/app/api/test/route.ts` 的 `TESTS` 一致
- **模型检测规则同步**：`core/models.py` 的正则表达式必须与 `route.ts` 的 `detectModel` / `checkFakeIndicators` 一致
- **安全考虑**：Web API 不存储用户密钥，不记录请求/响应日志
- **超时处理**：CLI 默认 600 秒，Web API 依赖 Vercel/Node 托管的超时限制
