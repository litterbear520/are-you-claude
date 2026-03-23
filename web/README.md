# Are You Claude? - Web 应用

一个现代化的 Claude 真伪检测工具 Web 界面，采用赛博朋克风格设计。

## 设计特点

### 视觉风格
- **赛博朋克主题**：深色背景 + 霓虹绿/青色渐变
- **玻璃态卡片**：毛玻璃效果 + 边框发光
- **动态效果**：
  - 页面元素渐入动画
  - 卡片悬停效果
  - 按钮光波扫过动画
  - 背景模糊光球动画

### 字体选择
- **标题字体**：Syne - 现代几何无衬线字体，具有强烈的视觉冲击力
- **正文字体**：JetBrains Mono - 等宽字体，适合代码和技术内容

### 交互设计
- **卡片式测试选择**：11 个测试项以卡片形式展示，可单独选择
- **实时反馈**：选中状态有明显的视觉反馈（边框发光、背景色变化）
- **响应式布局**：适配桌面、平板、手机
- **无障碍支持**：键盘导航、焦点样式、语义化 HTML

## 功能特性

### 1. API 配置
- URL 输入
- API Key 输入（支持显示/隐藏）
- 模型选择（Sonnet 4.5 / Opus 4.5）

### 2. 测试选择
- 11 个测试项卡片展示
- 每个卡片显示测试名称和描述
- 支持单选、全选、清空
- 实时显示已选择数量

### 3. 测试执行
- 一键开始测试
- 加载动画（点状加载指示器）
- 错误提示

### 4. 结果展示
- **总览统计**：真模型、假模型、未知数量
- **详细结果**：
  - 每个测试的状态（真/假/未知）
  - 可展开查看详细信息
  - 提示词、思考过程、模型回复
  - 假模型特征标记

## 技术栈

- **框架**：Next.js 16 (App Router)
- **语言**：TypeScript
- **样式**：Tailwind CSS + 自定义 CSS
- **字体**：Google Fonts (Syne + JetBrains Mono)

## 开发命令

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 代码检查
npm run lint
```

## 颜色系统

```css
--bg-primary: #0a0a0f       /* 主背景 - 深黑色 */
--bg-secondary: #13131a     /* 次级背景 */
--bg-card: #1a1a24          /* 卡片背景 */
--accent-primary: #00ff88   /* 主强调色 - 霓虹绿 */
--accent-secondary: #00ccff /* 次强调色 - 青色 */
--accent-danger: #ff3366    /* 危险色 - 粉红 */
--text-primary: #ffffff     /* 主文本 */
--text-secondary: #a0a0b8   /* 次级文本 */
--border: #2a2a38           /* 边框 */
```

## 组件结构

```
app/
├── page.tsx              # 主页面
├── layout.tsx            # 布局
├── globals.css           # 全局样式
└── api/
    └── test/
        └── route.ts      # API 路由

components/
├── TestForm.tsx          # API 配置表单
├── TestCard.tsx          # 测试项卡片
├── TestRunner.tsx        # 测试结果展示
├── ResultCard.tsx        # 结果卡片（未使用）
└── CompareView.tsx       # 对比视图（未使用）
```

## 设计理念

本设计遵循 **frontend-design** skill 的指导原则：

1. **大胆的美学方向**：选择赛博朋克风格，而非通用的企业风格
2. **独特的字体选择**：避免 Inter/Roboto 等常见字体
3. **有意义的动画**：每个动画都有目的，增强用户体验
4. **空间构图**：使用渐变、模糊、发光等效果创造深度
5. **避免 AI 美学陷阱**：不使用紫色渐变、通用布局等常见模式

## 部署

推荐部署到 Vercel：

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel
```

或者使用 Docker：

```bash
# 构建镜像
docker build -t are-you-claude-web .

# 运行容器
docker run -p 3000:3000 are-you-claude-web
```

## 浏览器支持

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- 移动端浏览器

## 许可证

MIT
