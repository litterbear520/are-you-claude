# Agent Chat 简化设计

## 概述

将 `AgentInterface` 组件从"子智能体测试模式"简化为"纯文本聊天模式"，移除所有多智能体相关逻辑。

## 变更原因

Vercel serverless 环境限制：
- 无法运行长进程（线程）
- 无法通过文件系统进行多智能体通信
- 子智能体测试（Test #9）无法在 Web 端真实运行

## 核心变更

### 1. `components/AgentInterface.tsx` 简化

**移除：**
- `agentMode` 状态和处理
- `spawn_teammate`、`send_message`、`read_inbox` 等工具的展示和检测逻辑
- `tools` tab（不再需要）
- Kiro 检测警告逻辑

**保留：**
- 流式文本响应展示
- `log` tab（执行日志）
- `system` tab（系统提示词展示）
- 输入框和发送逻辑
- sessionStorage 日志缓存

**重命名/调整：**
- 标题从"子智能体测试 — Agent Mode"改为"纯文本聊天 — Direct Chat"
- tab "系统提示词" 简化为只显示 lead 的 system prompt

### 2. `app/api/test-stream/route.ts`

- 保持不变（已经忽略 `agentMode` flag）
- 后续如需区分，可新建 `/api/chat/route.ts` 专门处理纯聊天

### 3. UI 简化后布局

```
┌─────────────────────────────────┐
│  ● ● ●  纯文本聊天 — Direct Chat │
├─────────────────────────────────┤
│  [执行日志]  [系统提示词]         │
├─────────────────────────────────┤
│                                  │
│  ← 流式响应在这里展示              │
│                                  │
├─────────────────────────────────┤
│  输入框...                [发送] │
└─────────────────────────────────┘
```

## 影响范围

- `AgentInterface.tsx`：仅影响此组件
- 其他组件（Sidebar、ChatInterface、TestPromptCard）：**无影响**
- `route.ts`：**无影响**

## 实施步骤

1. 修改 `AgentInterface.tsx`：
   - 移除 `agentMode` 相关状态和逻辑
   - 移除 tools tab
   - 移除 Kiro 检测警告
   - 更新标题和 tab 名称
   - 简化 `run()` 函数，移除 `agentMode: true` 发送

2. 验证构建通过
