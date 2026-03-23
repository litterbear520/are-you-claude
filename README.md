# Are You Claude? - 项目总览

Claude 真伪检测工具 - 通过 11 项试金石测试识别真假 Claude 模型

## 项目结构

```
are-you-claude/
├── core/                 # 共享测试逻辑（Python）
│   ├── __init__.py
│   ├── prompts.py        # 11 项测试定义
│   ├── detector.py       # 请求发送和解析
│   └── models.py         # 模型检测和假模型特征识别
├── cli/                  # CLI 工具
│   ├── main.py           # 主入口
│   └── agent.py          # 子智能体测试
├── web/                  # Next.js Web 应用
│   ├── app/              # Next.js App Router
│   ├── components/       # React 组件
│   └── public/           # 静态资源
├── docs/                 # 文档
│   └── superpowers/      # 设计文档
├── CLAUDE.md             # 项目指南
└── README.md             # 本文件
```

## 快速开始

### CLI 工具

```bash
# 安装依赖
pip install httpx python-dotenv anthropic

# 运行 CLI
cd cli
python main.py
```

### Web 应用

```bash
# 安装依赖
cd web
npm install

# 开发模式
npm run dev

# 访问 http://localhost:3000
```

## 测试项目

共 11 项测试，涵盖：

1. **知识库截止时间** - 判断模型版本
2. **剧情+人名测试** - Opus 4.5 特征检测
3. **时间事件测试** - 2025年1月20日事件
4. **特殊字符串触发** - API error 检测
5. **湖湘经世学派** - 冷门知识测试
6. **工具检测** - 工具字段检测
7. **reasoning_effort** - 推理努力值检测
8. **直接询问模型** - Kiro 特征检测
9. **子智能体测试** - jsonl 消息检测
10. **困难计算题** - 复杂计算 + 思考时间
11. **无敌动漫角色** - 系统提示词泄露检测

## 设计风格

### Web 应用 - Google Material Design 3

- **配色**：Google Blue/Red/Green/Yellow
- **字体**：Google Sans + Roboto
- **组件**：Material Card/Button/Input/Checkbox/Chip
- **动画**：Ripple、Fade-in、Elevation
- **布局**：响应式、卡片式、Sticky Header

### CLI 工具 - 终端友好

- 流式输出
- 思考过程实时显示
- 多种测试模式
- 对话模式

## 核心原理

1. **纯净请求**：无系统提示词、无上下文
2. **模拟 Claude CLI**：使用相同的请求头和请求体
3. **特征检测**：
   - 知识库截止时间
   - 乱码特征
   - Kiro 关键词
   - 系统提示词泄露
   - 回复速度和质量

## 技术栈

### Python CLI
- httpx - HTTP 客户端
- python-dotenv - 环境变量
- anthropic - Agent 测试

### Next.js Web
- Next.js 16 - React 框架
- TypeScript - 类型安全
- Tailwind CSS - 样式框架
- Material Design - 设计系统

## 开发指南

详见 [CLAUDE.md](./CLAUDE.md)

## 部署

### Web 应用

**Vercel（推荐）**
```bash
vercel
```

**Docker**
```bash
cd web
docker build -t are-you-claude-web .
docker run -p 3000:3000 are-you-claude-web
```

### CLI 工具

```bash
# 打包为可执行文件
pip install pyinstaller
pyinstaller --onefile cli/main.py
```

## 安全说明

- CLI：密钥不经过任何第三方
- Web：密钥仅用于转发请求，不存储、不记录
- API Route 不保存任何请求/响应数据

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT

## 相关链接

- [Material Design 3](https://m3.material.io/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Anthropic API](https://docs.anthropic.com/)
