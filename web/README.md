# Are You Claude? - Web 应用

一个采用 Google Material Design 3 风格的 Claude 真伪检测工具 Web 界面。

## 设计特点

### 视觉风格
- **Material Design 3**：遵循 Google 最新设计规范
- **简洁明亮**：白色背景 + 精致阴影系统
- **Google 配色**：
  - Primary: Google Blue (#1a73e8)
  - Danger: Google Red (#d93025)
  - Success: Google Green (#1e8e3e)
  - Warning: Google Yellow (#f9ab00)

### 字体选择
- **Google Sans**：标题字体，Google 官方品牌字体
- **Roboto**：正文字体，Material Design 标准字体

### Material 组件

#### Material Card
- 12px 圆角
- 三层阴影系统（sm/md/lg）
- 悬停时轻微上浮效果
- 1px 边框分隔

#### Material Button
- **Filled**：填充按钮，主要操作
- **Outlined**：轮廓按钮，次要操作
- **Text**：文本按钮，最低优先级
- Ripple 波纹点击效果
- 24px 圆角（药丸形状）

#### Material Input
- 8px 圆角
- Focus 时边框加粗（1px → 2px）
- 平滑过渡动画
- 清晰的 placeholder 样式

#### Material Checkbox
- 2px 边框
- 选中时显示对勾动画
- 悬停时边框变色

#### Chip & Badge
- 圆角标签
- 多种颜色变体（Primary/Success/Danger/Warning）
- 用于状态和分类展示

### 交互设计
- **Sticky Header**：固定顶部导航
- **卡片式测试选择**：11 个测试项以 Material Card 展示
- **实时反馈**：选中状态有明显的视觉反馈
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
- 实时显示已选择数量（Badge 样式）

### 3. 测试执行
- Material Filled Button
- 加载动画（Spinner）
- 错误提示（带图标的警告卡片）

### 4. 结果展示
- **总览统计**：三栏卡片展示真模型、假模型、未知数量
- **详细结果**：
  - 可展开的结果卡片
  - 状态标签（真模型/假模型/未知）
  - 提示词、思考过程、模型回复分区展示
  - 假模型特征标签（Chip 样式）

## 技术栈

- **框架**：Next.js 16 (App Router + Turbopack)
- **语言**：TypeScript
- **样式**：Tailwind CSS + Material Design CSS
- **字体**：Google Fonts (Google Sans + Roboto)

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

## Material Design 颜色系统

```css
/* Primary - Google Blue */
--accent-primary: #1a73e8
--accent-primary-hover: #1557b0
--accent-primary-light: #e8f0fe

/* Danger - Google Red */
--accent-danger: #d93025
--accent-danger-light: #fce8e6

/* Success - Google Green */
--accent-success: #1e8e3e
--accent-success-light: #e6f4ea

/* Warning - Google Yellow */
--accent-warning: #f9ab00
--accent-warning-light: #fef7e0

/* Backgrounds */
--bg-primary: #ffffff
--bg-secondary: #f8f9fa
--bg-card: #ffffff
--surface-variant: #e8eaed

/* Text */
--text-primary: #202124
--text-secondary: #5f6368
--text-tertiary: #80868b

/* Borders */
--border: #dadce0
--divider: #e8eaed
```

## Material Design 阴影系统

```css
/* Small - 轻微抬升 */
--shadow-sm: 0 1px 2px 0 rgba(60, 64, 67, 0.3),
             0 1px 3px 1px rgba(60, 64, 67, 0.15)

/* Medium - 中等抬升 */
--shadow-md: 0 1px 3px 0 rgba(60, 64, 67, 0.3),
             0 4px 8px 3px rgba(60, 64, 67, 0.15)

/* Large - 高度抬升 */
--shadow-lg: 0 2px 6px 2px rgba(60, 64, 67, 0.15),
             0 8px 24px 4px rgba(60, 64, 67, 0.15)
```

## 组件结构

```
app/
├── page.tsx              # 主页面
├── layout.tsx            # 布局
├── globals.css           # 全局样式（Material Design）
└── api/
    └── test/
        └── route.ts      # API 路由

components/
├── TestForm.tsx          # API 配置表单（Material Input）
├── TestCard.tsx          # 测试项卡片（Material Card）
├── TestRunner.tsx        # 测试结果展示（Material Components）
├── ResultCard.tsx        # 结果卡片（未使用）
└── CompareView.tsx       # 对比视图（未使用）
```

## Material Design 原则

本设计遵循 Google Material Design 3 的核心原则：

1. **Material is the metaphor** - 使用卡片、阴影创造物理深度感
2. **Bold, graphic, intentional** - 清晰的视觉层次和大胆的设计选择
3. **Motion provides meaning** - 有意义的动画反馈（Ripple、Fade-in）
4. **Adaptive design** - 响应式布局，适配所有设备
5. **Accessible** - 良好的对比度、焦点样式、键盘导航

## 动画效果

- **Fade-in**：页面元素渐入（Material 标准缓动函数）
- **Ripple**：按钮点击波纹效果
- **Elevation**：卡片悬停时阴影变化
- **Smooth transitions**：200ms cubic-bezier(0.4, 0, 0.2, 1)

## 响应式断点

- **Mobile**: < 768px (1 列)
- **Tablet**: 768px - 1024px (2 列)
- **Desktop**: > 1024px (3 列)

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

## 设计参考

- [Material Design 3](https://m3.material.io/)
- [Google Design](https://design.google/)
- [Material Components Web](https://material.io/components)

## 许可证

MIT

