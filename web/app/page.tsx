'use client'

import { useState } from 'react'
import TestForm from '@/components/TestForm'
import TestRunner from '@/components/TestRunner'
import TestCard from '@/components/TestCard'
import { TestResult } from '@/components/TestRunner'

const TEST_ITEMS = [
  { id: 1, name: '知识库截止时间', description: '通过询问知识库截止时间判断模型版本（Sonnet 3.7/4/4.5, Opus 4.5）' },
  { id: 2, name: '剧情+人名测试', description: 'Opus 4.5 特征检测：乱码、第一个人名 95% 概率为「xx美咲」' },
  { id: 3, name: '时间事件测试', description: '测试 2025年1月20日发生的大事（特朗普第二次当总统）' },
  { id: 4, name: '特殊字符串触发', description: '使用特殊字符串触发，官方 Claude 会返回 API error' },
  { id: 5, name: '湖湘经世学派', description: '测试冷门知识：湖湘经世学派的领头人（正确答案：陶澍）' },
  { id: 6, name: '工具检测', description: '询问可用工具，检测回复是否包含 thinking、signature、tools 等字段' },
  { id: 7, name: 'reasoning_effort', description: '检测推理努力值：Opus 4.6 回复 99，Sonnet 4.6 回复 95' },
  { id: 8, name: '直接询问模型', description: '直接询问模型身份，Kiro 逆向未做检测会直接回答 Kiro' },
  { id: 9, name: '子智能体测试', description: '观察子智能体消息中是否出现 "Hey Kiro" 等称呼' },
  { id: 10, name: '困难计算题', description: '复杂数列计算题（正确答案：5），思考时间较长（2分钟+）' },
  { id: 11, name: '无敌动漫角色', description: '综合测试，检测思考过程中是否夹带系统提示词（反代特征）' },
]

export default function Home() {
  const [config, setConfig] = useState<{url: string, key: string, modelId: string} | null>(null)
  const [selectedTests, setSelectedTests] = useState<number[]>([])
  const [results, setResults] = useState<TestResult[] | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleTest = (id: number) => {
    setSelectedTests(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
  }

  const selectAll = () => {
    setSelectedTests(TEST_ITEMS.map(t => t.id))
  }

  const clearAll = () => {
    setSelectedTests([])
  }

  const handleTest = async () => {
    if (!config || selectedTests.length === 0) return
    setRunning(true)
    setResults(null)
    setError(null)

    try {
      const res = await fetch('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: config.url,
          key: config.key,
          modelId: config.modelId,
          testType: 'custom',
          testIds: selectedTests.sort((a, b) => a - b)
        })
      })

      if (!res.ok) {
        throw new Error(`API 错误: ${res.status}`)
      }

      const data = await res.json()

      if (data.error) {
        setError(data.error)
      } else {
        setResults(data.results || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '请求失败')
      console.error(err)
    } finally {
      setRunning(false)
    }
  }

  return (
    <main className="min-h-screen bg-[var(--bg-secondary)]">
      {/* Header */}
      <header className="bg-[var(--bg-card)] border-b border-[var(--border)] sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--accent-primary)] flex items-center justify-center text-white font-bold text-lg">
              A
            </div>
            <div>
              <h1 className="heading-font text-xl font-medium text-[var(--text-primary)]">
                Are You Claude?
              </h1>
              <p className="text-sm text-[var(--text-secondary)]">Claude 真伪检测工具</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="mb-8 animate-fade-in">
          <div className="material-card p-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--accent-primary-light)] rounded-full mb-4">
              <span className="w-2 h-2 bg-[var(--accent-primary)] rounded-full"></span>
              <span className="text-sm font-medium text-[var(--accent-primary)]">11 项专业测试</span>
            </div>
            <h2 className="heading-font text-3xl md:text-4xl font-medium text-[var(--text-primary)] mb-3">
              通过试金石测试识别真假 Claude
            </h2>
            <p className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto">
              在无系统提示词、无上下文的纯净环境下测试 API，准确判断模型版本和真伪
            </p>
          </div>
        </div>

        {/* Config Form */}
        <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <TestForm onSubmit={(cfg) => setConfig(cfg)} />
        </div>

        {config && (
          <>
            {/* Test Selection Header */}
            <div className="mb-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="material-card p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="heading-font text-2xl font-medium text-[var(--text-primary)] mb-2">
                      选择测试项
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--text-secondary)]">已选择</span>
                      <span className="badge-material">{selectedTests.length}</span>
                      <span className="text-[var(--text-secondary)]">/ {TEST_ITEMS.length} 项</span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={selectAll}
                      className="btn-material btn-material-outlined"
                    >
                      全选
                    </button>
                    <button
                      onClick={clearAll}
                      className="btn-material btn-material-text"
                    >
                      清空
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Test Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {TEST_ITEMS.map((test, index) => (
                <div
                  key={test.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${0.3 + index * 0.05}s` }}
                >
                  <TestCard
                    id={test.id}
                    name={test.name}
                    description={test.description}
                    selected={selectedTests.includes(test.id)}
                    onToggle={toggleTest}
                  />
                </div>
              ))}
            </div>

            {/* Run Test Button */}
            <div className="flex flex-col items-center gap-4 mb-12 animate-fade-in" style={{ animationDelay: '0.9s' }}>
              <button
                onClick={handleTest}
                disabled={running || selectedTests.length === 0}
                className="btn-material btn-material-filled px-8 py-3 text-base"
              >
                {running ? (
                  <span className="flex items-center gap-3">
                    <span className="loading-spinner"></span>
                    <span>测试中...</span>
                  </span>
                ) : (
                  `开始测试 (${selectedTests.length}项)`
                )}
              </button>

              {selectedTests.length === 0 && (
                <p className="text-[var(--text-secondary)] text-sm">
                  请至少选择一项测试
                </p>
              )}
            </div>
          </>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-8 animate-fade-in">
            <div className="material-card p-6 border-l-4 border-[var(--accent-danger)] bg-[var(--accent-danger-light)]">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-[var(--accent-danger)] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-[var(--accent-danger)] font-medium mb-1">测试失败</h3>
                  <p className="text-[var(--text-secondary)]">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="animate-fade-in">
            <TestRunner results={results} />
          </div>
        )}

        {/* Footer */}
        <footer className="mt-20 text-center">
          <div className="material-card p-6 inline-block">
            <p className="text-[var(--text-secondary)] text-sm mb-2">
              本工具通过发送纯净请求（无系统提示词、无上下文）来检测 API 真伪
            </p>
            <p className="text-[var(--text-tertiary)] text-xs">
              密钥仅用于转发请求，不会被存储或记录
            </p>
          </div>
        </footer>
      </div>
    </main>
  )
}
