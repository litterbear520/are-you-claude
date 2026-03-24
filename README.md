# Are You Claude?

Claude 真伪检测工具——在无系统提示词、无上下文的纯净环境下调用 API，通过 11 项固定测试识别目标接口是否为真实 Claude 及其版本。

## 在线体验

**🌐 直接访问：[claude.huangsitao.fun](https://claude.huangsitao.fun)**

> **重要声明**
>
> 本服务使用 Vercel 部署，**不会记录任何 API 密钥或请求内容**。密钥仅在你的浏览器中填写，由前端直接发送至你填写的 API 地址，不经过任何服务器存储。
>
> **如仍有顾虑，请选择本地启动（见下方 CLI 或本地 Web 方式）。**

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

### CLI

```bash
pip install httpx python-dotenv anthropic
cp .env.example .env   # 填写 API_KEY、BASE_URL、MODEL_ID
cd cli && python main.py
```

## 相关讨论

| 社区 | 帖子 |
|------|------|
| ![Linux DO](https://img.shields.io/badge/Linux%20DO-FF6C2C?style=flat&logo=linux&logoColor=white) | [假Claude辨别指南 - 如何辨别假Claude](https://linux.do/t/topic/1702676/8) |
| ![Linux DO](https://img.shields.io/badge/Linux%20DO-FF6C2C?style=flat&logo=linux&logoColor=white) | [Claude API中间商调查报告](https://linux.do/t/topic/1491552) |
| ![Linux DO](https://img.shields.io/badge/Linux%20DO-FF6C2C?style=flat&logo=linux&logoColor=white) | [教你识别假Claude反代服务](https://linux.do/t/topic/1628136/3) |
| ![V2EX](https://img.shields.io/badge/V2EX-394856?style=flat&logoColor=white) | [如何判断自己用的 Claude API 是否为真实模型](https://www.v2ex.com/t/1200135#reply53) |

## 致谢

感谢以上论坛的各位大佬们分享的检测思路和方式，本工具正是在这些讨论的基础上整理和实现的。特别感谢每一位研究过假模型特征、贡献了验证方法的社区成员。

## 许可证

MIT
