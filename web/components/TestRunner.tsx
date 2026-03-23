'use client'

import { useState } from 'react'

export interface TestResult {
  test_id: number
  test_name: string
  prompt: string
  response: string
  thinking: string
  detected_model: string
  is_fake: boolean
  fake_indicators: Record<string, boolean>
  details: Record<string, unknown>
}

export default function TestRunner({ results }: { results: TestResult[] }) {
  const [expanded, setExpanded] = useState<number | null>(null)

  const getStatusInfo = (result: TestResult) => {
    if (result.is_fake) {
      return { label: '假模型', color: 'var(--accent-danger)', icon: '✗' }
    }
    if (result.detected_model !== '未知模型' && result.detected_model !== '待实现') {
      return { label: '真模型', color: 'var(--accent-primary)', icon: '✓' }
    }
    return { label: '未知', color: 'var(--text-secondary)', icon: '?' }
  }

  const fakeCount = results.filter(r => r.is_fake).length
  const realCount = results.filter(r => !r.is_fake && r.detected_model !== '未知模型').length
  const unknownCount = results.length - fakeCount - realCount

  return (
    <div className="space-y-8">
      {/* Summary Stats */}
      <div className="glass-card p-8">
        <h2 className="heading-font text-3xl font-bold mb-6 gradient-text">测试结果总览</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)]">
            <div className="text-5xl font-bold mb-2" style={{ color: 'var(--accent-primary)' }}>
              {realCount}
            </div>
            <div className="text-[var(--text-secondary)]">真模型</div>
          </div>
          <div className="text-center p-6 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)]">
            <div className="text-5xl font-bold mb-2" style={{ color: 'var(--accent-danger)' }}>
              {fakeCount}
            </div>
            <div className="text-[var(--text-secondary)]">假模型</div>
          </div>
          <div className="text-center p-6 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)]">
            <div className="text-5xl font-bold mb-2 text-[var(--text-secondary)]">
              {unknownCount}
            </div>
            <div className="text-[var(--text-secondary)]">未知</div>
          </div>
        </div>
      </div>

      {/* Detailed Results */}
      <div className="space-y-4">
        <h3 className="heading-font text-2xl font-bold mb-4">详细结果</h3>
        {results.map((result, index) => {
          const status = getStatusInfo(result)
          const isExpanded = expanded === result.test_id

          return (
            <div
              key={result.test_id}
              className="glass-card overflow-hidden animate-slide-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <button
                onClick={() => setExpanded(isExpanded ? null : result.test_id)}
                className="w-full px-6 py-4 flex justify-between items-center hover:bg-[var(--bg-secondary)] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg"
                    style={{
                      backgroundColor: `${status.color}20`,
                      color: status.color,
                      border: `2px solid ${status.color}`
                    }}
                  >
                    {status.icon}
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-[var(--accent-secondary)] font-bold text-sm">
                        #{result.test_id}
                      </span>
                      <span className="heading-font font-bold text-lg">{result.test_name}</span>
                    </div>
                    <div className="text-sm text-[var(--text-secondary)]">
                      {result.detected_model}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className="px-4 py-1 rounded-full text-sm font-bold"
                    style={{
                      backgroundColor: `${status.color}20`,
                      color: status.color
                    }}
                  >
                    {status.label}
                  </span>
                  <span className="text-[var(--text-secondary)] text-2xl">
                    {isExpanded ? '−' : '+'}
                  </span>
                </div>
              </button>

              {isExpanded && (
                <div className="px-6 py-4 border-t border-[var(--border)] space-y-4 bg-[var(--bg-secondary)]">
                  {/* Prompt */}
                  <div>
                    <div className="text-xs text-[var(--accent-secondary)] font-bold mb-2 uppercase tracking-wider">
                      提示词
                    </div>
                    <div className="bg-[var(--bg-card)] rounded-lg p-4 border border-[var(--border)]">
                      <pre className="text-sm whitespace-pre-wrap text-[var(--text-secondary)]">
                        {result.prompt}
                      </pre>
                    </div>
                  </div>

                  {/* Thinking */}
                  {result.thinking && (
                    <div>
                      <div className="text-xs text-[var(--accent-secondary)] font-bold mb-2 uppercase tracking-wider">
                        思考过程
                      </div>
                      <div className="bg-[var(--bg-card)] rounded-lg p-4 border border-[var(--border)] max-h-60 overflow-y-auto">
                        <pre className="text-sm whitespace-pre-wrap font-mono text-[var(--text-secondary)]">
                          {result.thinking}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Response */}
                  <div>
                    <div className="text-xs text-[var(--accent-secondary)] font-bold mb-2 uppercase tracking-wider">
                      模型回复
                    </div>
                    <div className="bg-[var(--bg-card)] rounded-lg p-4 border border-[var(--border)] max-h-80 overflow-y-auto">
                      <pre className="text-sm whitespace-pre-wrap text-white leading-relaxed">
                        {result.response}
                      </pre>
                    </div>
                  </div>

                  {/* Fake Indicators */}
                  {Object.keys(result.fake_indicators).length > 0 && (
                    <div className="bg-[var(--accent-danger)] bg-opacity-10 border border-[var(--accent-danger)] rounded-lg p-4">
                      <div className="text-xs text-[var(--accent-danger)] font-bold mb-2 uppercase tracking-wider">
                        ⚠ 假模型特征检测
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(result.fake_indicators)
                          .filter(([, v]) => v)
                          .map(([k]) => (
                            <span
                              key={k}
                              className="px-3 py-1 bg-[var(--accent-danger)] bg-opacity-20 rounded-full text-sm text-[var(--accent-danger)] font-bold"
                            >
                              {k}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
