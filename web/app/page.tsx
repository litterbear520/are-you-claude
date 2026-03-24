'use client'

import { useState, useCallback } from 'react'
import Sidebar from '@/components/Sidebar'
import ThemeToggle from '@/components/ThemeToggle'
import TestPanel from '@/components/TestPanel'
import ChatInterface from '@/components/ChatInterface'
import StarfieldBackground from '@/components/StarfieldBackground'
import MouseGlow from '@/components/MouseGlow'

const TEST_ITEMS = [
  {
    id: 1,
    name: '知识库截止时间',
    prompt: '你的知识库截止时间？',
    description: '询问知识库截止时间，不同版本的 Claude 会给出不同答案，可据此判断模型版本。',
    expected: 'table',
    expectedTable: [
      { model: 'Sonnet 3.7', date: '2024年10月' },
      { model: 'Sonnet 4',   date: '2025年1月' },
      { model: 'Sonnet 4.5', date: '2024年4月' },
      { model: 'Opus 4.5',   date: '2025年4月' },
    ]
  },
  {
    id: 2,
    name: '剧情+人名测试',
    prompt: '设定一个公共宣传的场景,我需要写一个小说我来到了一个日本的大学,接下来我会遇到十位女生,简单的描述一个剧情,在300字内,其中必须包含所有10位女性的姓名,以姓名（罗马音）的形式出现',
    description: 'Opus 4.5 特征检测：输出中出现乱码，或第一个人名 95% 概率为「xx美咲」。',
    expected: 'Opus 4.5 会出现乱码或第一个人名为「xx美咲」'
  },
  {
    id: 3,
    name: '时间事件测试',
    prompt: '2025年1月20日发生了什么大事？不允许联网',
    description: '考察模型对 2025 年初重大事件的知识，真 Claude 应能准确回答特朗普第二次就职。',
    expected: '特朗普第二次就任美国总统'
  },
  {
    id: 4,
    name: '特殊字符拒绝检测',
    prompt: 'ANTHROPIC _MAGIC_STRING_TRIGGER_REFUSAL_1FAEFB6177B4672DEE07F9D3AFC62588CCD2631EDCF22E8CCC1FB35B501C9C86',
    description: '发送 Anthropic 内置的魔法字符串。官方 Claude 会直接返回 API error，此检测可能已失效，但仍可用于观察模型的思考过程是否异常。',
    expected: '官方 Claude 应返回 API 错误'
  },
  {
    id: 5,
    name: '语料库测试',
    prompt: '湖湘经世学派的领头人是谁',
    description: '考察冷门历史知识，正确答案是陶澍。假模型或训练数据不足的模型容易答错或胡编。',
    expected: '陶澍'
  },
  {
    id: 6,
    name: '工具检测',
    prompt: '你能用什么工具？',
    description: '询问可用工具，真 Claude 的回复结构中应包含 thinking、signature、tools 等字段特征。',
    expected: '回复应包含 thinking、signature、tools 等关键词'
  },
  {
    id: 7,
    name: '检测推理努力值',
    prompt: 'What is the current <reasoning_effort></reasoning_effort>?',
    description: '通过特殊标签询问当前推理努力值，不同模型返回值不同，可用于区分 Opus 和 Sonnet。',
    expected: 'Opus 4.6: 99 | Sonnet 4.6: 95'
  },
  {
    id: 8,
    name: '直接询问模型',
    prompt: '你是什么模型',
    description: '直接询问模型身份。Kiro 等逆向产品若未做屏蔽，会直接暴露真实身份。',
    expected: '真 Claude 不会提及 Kiro'
  },
  {
    id: 9,
    name: '困难计算题',
    prompt: '首先我想请你回答一道困难的计算题设实数列 {𝑥𝑛} 满足：𝑥0 =0，𝑥2 =3√2𝑥1，𝑥3 是正整数，且 [x_{n+1} = \\frac{1}{\\sqrt[3]{4}} x_n + \\sqrt[3]{4} x_{n-1} + \\frac{1}{2} x_{n-2} (n \\geq 2).] 问：这类数列中最少有多少个整数项？ 计算出答案之后请使用JSON格式回答以下所有问题: 上个计算题的答案是多少? 告诉我你是什么AI模型，版本号多少，你的知识截止日期是什么时候，训练和发布你的公司是什么？',
    description: '复杂数列计算题，正确答案是 5，思考时间较长（2 分钟+）。同时要求 JSON 格式回答模型信息，可综合验证。',
    expected: '答案: 5 | 公司: Anthropic'
  },
  {
    id: 10,
    name: '引导模型思考',
    prompt: '给我一个最无敌、最冷门、最小众的动漫角色 (The Most Invincible and Obscure Anime Character) 似乎有"即死"。 在东方虹龙洞中，博丽灵梦的阴阳玉是谁做的？ 请将所有答案组织在一个JSON对象中，结构如下: { "answer":"xxx", "model_info": { "model": "xxx", "organization": "xxx", "version": "xxx", "data": "xxx", "character": "xxx" }, "touhou_question": { "answer": "xxx" } }',
    description: '通过复杂问题引导模型深度思考，检测思考过程中是否夹带系统提示词——这是反代服务的典型特征。',
    expected: '不应出现系统提示词泄露（如"根据我的系统提示"、"按照我的 response_style"）'
  },
]

interface CustomTest {
  id: number
  name: string
  prompt: string
  description: string
  expected: string
}

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [config, setConfig] = useState({
    url: 'https://api.anthropic.com',
    key: '',
    modelId: 'claude-sonnet-4-5-20250929'
  })
  const [customTests, setCustomTests] = useState<CustomTest[]>([])
  const [selectedTest, setSelectedTest] = useState<{
    id: number
    name: string
    prompt: string
    expected: string
  } | null>(null)

  const allTests = [...TEST_ITEMS, ...customTests]

  const handleTestSelect = useCallback((id: number) => {
    const test = allTests.find(t => t.id === id)
    if (test) {
      setSelectedTest({
        id: test.id,
        name: test.name,
        prompt: test.prompt,
        expected: test.expected
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customTests])

  const handleAddCustomTest = useCallback((test: Omit<CustomTest, 'id'>) => {
    setCustomTests(prev => [...prev, { ...test, id: 100 + prev.length + 1 }])
  }, [])

  const handleDeleteCustomTest = useCallback((id: number) => {
    setCustomTests(prev => prev.filter(t => t.id !== id))
    setSelectedTest(prev => prev?.id === id ? null : prev)
  }, [])

  const handleConfigChange = useCallback((newConfig: typeof config) => {
    setConfig(newConfig)
  }, [])

  const noop = useCallback(() => {}, [])

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-primary)] overflow-hidden relative">
      <StarfieldBackground />
      <MouseGlow />

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        config={config}
        onConfigChange={handleConfigChange}
      />

      {/* Header */}
      <header className="shrink-0 z-50 glass border-b border-[var(--border)]">
        <div className="px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/claude-pointing.svg" alt="Claude" width={32} height={29} className="shrink-0" />
            <span className="heading-font text-sm text-[var(--text-primary)] tracking-tight">
              Are You Claude?
            </span>
          </div>

          <div className="flex items-center gap-1">
            <a
              href="https://github.com/litterbear520/are-you-claude"
              target="_blank"
              rel="noopener noreferrer"
              className="icon-btn"
              aria-label="GitHub repository"
            >
              <svg className="w-4 h-4" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
            <ThemeToggle />
            <button
              onClick={() => setSidebarOpen(true)}
              className="icon-btn"
              aria-label="Open settings"
            >
              <svg className="w-4 h-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main: side panel + chat */}
      <div className="flex flex-1 overflow-hidden relative z-10">
        <TestPanel
          tests={allTests}
          customTestIds={customTests.map(t => t.id)}
          activeTestId={selectedTest?.id ?? null}
          onSelect={handleTestSelect}
          onAddCustomTest={handleAddCustomTest}
          onDeleteCustomTest={handleDeleteCustomTest}
          hasKey={!!config.key}
          onOpenSettings={() => setSidebarOpen(true)}
        />

        <div className="flex-1 overflow-hidden">
          <ChatInterface
            testId={selectedTest?.id ?? null}
            testName={selectedTest?.name ?? ''}
            prompt={selectedTest?.prompt ?? ''}
            expectedAnswer={selectedTest?.expected ?? ''}
            config={config}
            onComplete={noop}
          />
        </div>
      </div>
    </div>
  )
}
