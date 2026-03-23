import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Are You Claude? - Claude 真伪检测工具',
  description: '通过 11 项试金石测试，识别真假 Claude 模型',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  )
}
