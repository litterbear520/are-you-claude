export default function Home() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        <h1 className="text-6xl font-bold text-center mb-8 gradient-text">
          Cursor 风格设计完成！
        </h1>

        <div className="card p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-white">✨ 新设计特性</h2>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start gap-3">
              <span className="text-blue-400">🌌</span>
              <span><strong className="text-white">深空星空背景</strong> - 全黑背景 + 动态星空粒子效果，鼠标移动时星星会互动</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-purple-400">✨</span>
              <span><strong className="text-white">鼠标光晕效果</strong> - 跟随鼠标的蓝色光晕，增强交互感</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-400">💎</span>
              <span><strong className="text-white">玻璃态效果</strong> - 毛玻璃背景模糊，现代科技感</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-pink-400">🎨</span>
              <span><strong className="text-white">蓝紫渐变</strong> - 按钮和强调色使用蓝色到紫色的渐变</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-cyan-400">⚡</span>
              <span><strong className="text-white">发光边框</strong> - 卡片悬停时出现蓝色发光边框</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-400">🔤</span>
              <span><strong className="text-white">Inter 字体</strong> - 使用 Inter 字体，更现代的排版</span>
            </li>
          </ul>
        </div>

        <div className="card p-8">
          <h2 className="text-2xl font-bold mb-4 text-white">🎯 访问地址</h2>
          <div className="space-y-2">
            <a
              href="http://localhost:3000"
              target="_blank"
              className="block p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg hover:bg-blue-500/20 transition-colors"
            >
              <div className="text-blue-400 font-mono">http://localhost:3000</div>
              <div className="text-sm text-gray-400 mt-1">本地访问</div>
            </a>
            <a
              href="http://192.168.1.5:3000"
              target="_blank"
              className="block p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg hover:bg-purple-500/20 transition-colors"
            >
              <div className="text-purple-400 font-mono">http://192.168.1.5:3000</div>
              <div className="text-sm text-gray-400 mt-1">网络访问</div>
            </a>
          </div>
        </div>

        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>切换到深色模式查看完整效果 🌙</p>
        </div>
      </div>
    </div>
  )
}
