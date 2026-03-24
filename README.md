# Are You Claude?

Claude 真伪检测工具——在无系统提示词、无上下文的纯净环境下调用 API，通过 10 项固定测试识别目标接口是否为真实 Claude 及其版本。

## 原理

直接调用 Anthropic Messages API，模拟 Claude CLI 的请求头，开启 `thinking`，系统提示词设为 `"null"`，发送纯净请求后对比预期答案判定真假。

## 快速开始

### Web（推荐）

```bash
cd web
npm install
npm run dev   # http://localhost:3000
```

打开右上角设置，填入 API URL / Key / 模型，点击左侧测试卡片展开后运行。

**Vercel 一键部署：** 将 `web/` 目录导入 Vercel，无需任何环境变量，密钥由用户在页面填写，不经过服务器存储。

### CLI

```bash
pip install httpx python-dotenv anthropic
cp .env.example .env   # 填写 API_KEY、BASE_URL、MODEL_ID
cd cli && python main.py
```

## 测试项目

| # | 名称 | 预期 |
|---|------|------|
| 1 | 知识库截止时间 | Sonnet 3.7: 10月 / Sonnet 4: 1月 / Sonnet 4.5: 4月 / Opus 4.5: 4月 |
| 2 | 剧情+人名测试 | Opus 4.5 会出现乱码或第一个人名为「xx美咲」|
| 3 | 时间事件测试 | 特朗普第二次就任美国总统 |
| 4 | 特殊字符拒绝检测 | 官方 Claude 返回 API error |
| 5 | 语料库测试 | 陶澍 |
| 6 | 工具检测 | 回复含 thinking / signature / tools 字段 |
| 7 | 检测推理努力值 | Opus 4.6 → 99，Sonnet 4.6 → 95 |
| 8 | 直接询问模型 | 不会提及 Kiro |
| 9 | 困难计算题 | 答案 5，公司 Anthropic |
| 10 | 引导模型思考 | 思考过程中不出现系统提示词泄露 |

## 假模型特征

| 特征 | 说明 |
|------|------|
| Kiro 字样 | 回复或思考出现 "Kiro" |
| 系统提示词泄露 | 出现「根据我的系统提示」「按照我的 response_style」等 |
| 乱码 | 3+ 个连续 `\ufffd`（Opus 4.5 反代特征）|

## 安全

- Web：密钥仅用于转发请求，API Route 不存储、不记录任何日志
- CLI：密钥完全本地，不经过任何第三方

## 许可证

MIT
