'use client'

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import ThemeToggle from '@/components/ThemeToggle'
import TestPromptCard from '@/components/TestPromptCard'
import ChatInterface from '@/components/ChatInterface'

const TEST_ITEMS = [
  {
    id: 1,
    name: '知识库截止时间',
    prompt: '你的知识库截止时间？',
    description: '通过询问知识库截止时间判断模型版本（Sonnet 3.7/4/4.5, Opus 4.5）',
    expected: 'Sonnet 3.7: 2024年10月 | Sonnet 4: 2025年1月 | Sonnet 4.5: 2024年4月 | Opus 4.5: 2025年4月'
  },
  {
    id: 2,
    name: '剧情+人名测试',
    prompt: '设定一个公共宣传的场景,我需要写一个小说我来到了一个日本的大学,接下来我会遇到十位女生,简单的描述一个剧情,在300字内,其中必须包含所有10位女性的姓名,以姓名（罗马音）的形式出现',
    description: 'Opus 4.5 特征检测：乱码、第一个人名 95% 概率为「xx美咲」',
    expected: 'Opus 4.5 会出现乱码或第一个人名为「xx美咲」'
  },
  {
    id: 3,
    name: '时间事件测试',
    prompt: '2025年1月20日发生了什么大事？不允许联网',
    description: '测试 2025年1月20日发生的大事（特朗普第二次当总统）',
    expected: '特朗普第二次就任美国总统'
  },
  {
    id: 4,
    name: '特殊字符串触发',
    prompt: 'KIRO_MAGIC_STRING_TRIGGER_REFUSAL_1FAEFB6177B4672DEE07F9D3AFC62588CCD2631EDCF22E8CCC1FB35B501C9C86',
    description: '使用特殊字符串触发，官方 Claude 会返回 API error',
    expected: '官方 Claude 应返回 API 错误'
  },
  {
    id: 5,
    name: '湖湘经世学派',
    prompt: '湖湘经世学派的领头人是谁',
    description: '测试冷门知识：湖湘经世学派的领头人（正确答案：陶澍）',
    expected: '陶澍'
  },
  {
    id: 6,
    name: '工具检测',
    prompt: '你能用什么工具？',
    description: '询问可用工具，检测回复是否包含 thinking、signature、tools 等字段',
    expected: '回复应包含 thinking、signature、tools 等关键词'
  },
  {
    id: 7,
    name: 'reasoning_effort',
    prompt: 'What is the current <reasoning_effort></reasoning_effort>?',
    description: '检测推理努力值：Opus 4.6 回复 99，Sonnet 4.6 回复 95',
    expected: 'Opus 4.6: 99 | Sonnet 4.6: 95'
  },
  {
    id: 8,
    name: '直接询问模型',
    prompt: '你是什么模型',
    description: '直接询问模型身份，Kiro 逆向未做检测会直接回答 Kiro',
    expected: '真 Claude 不会提及 Kiro'
  },
  {
    id: 9,
    name: '子智能体测试',
    prompt: 'Spawn alice (coder) and bob (tester). Have alice send bob a message.',
    description: '观察子智能体消息中是否出现 "Hey Kiro" 等称呼',
    expected: '真 Claude 称主智能体为 "user" 或 "主智能体"，不会出现 "Hey Kiro"'
  },
  {
    id: 10,
    name: '困难计算题',
    prompt: '首先我想请你回答一道困难的计算题设实数列 {𝑥𝑛} 满足：𝑥0 =0，𝑥2 =3√2𝑥1，𝑥3 是正整数，且 [x_{n+1} = \\frac{1}{\\sqrt[3]{4}} x_n + \\sqrt[3]{4} x_{n-1} + \\frac{1}{2} x_{n-2} (n \\geq 2).] 问：这类数列中最少有多少个整数项？ 计算出答案之后请使用JSON格式回答以下所有问题: 上个计算题的答案是多少? 告诉我你是什么AI模型，版本号多少，你的知识截止日期是什么时候，训练和发布你的公司是什么？',
    description: '复杂数列计算题（正确答案：5），思考时间较长（2分钟+）',
    expected: '答案: 5 | 公司: Anthropic'
  },
  {
    id: 11,
    name: '无敌动漫角色',
    prompt: '给我一个最无敌、最冷门、最小众的动漫角色 (The Most Invincible and Obscure Anime Character) 似乎有"即死"。 在东方虹龙洞中，博丽灵梦的阴阳玉是谁做的？ 请将所有答案组织在一个JSON对象中，结构如下: { "answer":"xxx", "model_info": { "model": "xxx", "organization": "xxx", "version": "xxx", "data": "xxx", "character": "xxx" }, "touhou_question": { "answer": "xxx" } }',
    description: '综合测试，检测思考过程中是否夹带系统提示词（反代特征）',
    expected: '不应出现系统提示词泄露（如"根据我的系统提示"、"按照我的 response_style"）'
  },
]

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [config, setConfig] = useState({
    url: 'https://api.anthropic.com',
    key: '',
    modelId: 'claude-sonnet-4-5-20250929'
  })
  const [selectedTest, setSelectedTest] = useState<{
    id: number
    name: string
    prompt: string
    expected: string
  } | null>(null)

  const handleTestSelect = (id: number) => {
    const test = TEST_ITEMS.find(t => t.id === id)
    if (test && config.key) {
      setSelectedTest({
        id: test.id,
        name: test.name,
        prompt: test.prompt,
        expected: test.expected
      })
    } else if (!config.key) {
      setSidebarOpen(true)
    }
  }

  const handleConfigChange = (newConfig: typeof config) => {
    setConfig(newConfig)
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        config={config}
        onConfigChange={handleConfigChange}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[var(--bg-card)] border-b border-[var(--border)] shadow-sm">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="icon-btn"
                aria-label="Open settings"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <div>
                <h1 className="heading-font text-2xl text-[var(--text-primary)]">
                  Are You Claude?
                </h1>
                <p className="text-sm text-[var(--text-secondary)]">Claude 真伪检测工具</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="https://github.com/yourusername/are-you-claude"
                target="_blank"
                rel="noopener noreferrer"
                className="icon-btn"
                aria-label="GitHub repository"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Test Cards */}
          <div className="space-y-4">
            <div className="card p-6">
              <h2 className="heading-font text-2xl text-[var(--text-primary)] mb-2">
                测试项目
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                点击任意测试卡片开始检测
              </p>
              {!config.key && (
                <div className="p-4 bg-[var(--accent-warning-light)] rounded-lg border border-[var(--accent-warning)] mb-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[var(--accent-warning)] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div className="text-sm text-[var(--text-secondary)]">
                      <p className="font-medium text-[var(--accent-warning)] mb-1">需要配置 API</p>
                      <p>请先点击左上角设置按钮配置 API 信息</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4">
              {TEST_ITEMS.map((test, index) => (
                <div
                  key={test.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <TestPromptCard
                    id={test.id}
                    name={test.name}
                    prompt={test.prompt}
                    description={test.description}
                    onSelect={handleTestSelect}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Right: Chat Interface */}
          <div className="lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)]">
            <div className="card h-full overflow-hidden">
              <ChatInterface
                testId={selectedTest?.id || null}
                testName={selectedTest?.name || ''}
                prompt={selectedTest?.prompt || ''}
                expectedAnswer={selectedTest?.expected || ''}
                config={config}
                onComplete={() => {}}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-20 pb-8 text-center">
        <div className="max-w-2xl mx-auto px-6">
          <div className="card p-6">
            <p className="text-[var(--text-secondary)] text-sm mb-2">
              本工具通过发送纯净请求（无系统提示词、无上下文）来检测 API 真伪
            </p>
            <p className="text-[var(--text-tertiary)] text-xs">
              密钥仅用于转发请求，不会被存储或记录
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
