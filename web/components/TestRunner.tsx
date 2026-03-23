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
      return { label: '假模型', color: 'var(--accent-danger)', bgColor: 'var(--accent-danger-light)' }
    }
    if (result.detected_model !== '未知模型' && result.detected_model !== '待实现') {
      return { label: '真模型', color: 'var(--accent-success)', bgColor: 'var(--accent-success-light)' }
    }
    return { label: '未知', color: 'var(--text-secondary)', bgColor: 'var(--surface-variant)' }
  }

  const fakeCount = results.filter(r => r.is_fake).length
  const realCount = results.filter(r => !r.is_fake && r.detected_model !== '未知模型').length
  const unknownCount = results.length - fakeCount - realCount

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="material-card p-6">
        <h2 className="heading-font text-2xl font-medium text-[var(--text-primary)] mb-6">测试结果总览</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-6 bg-[var(--accent-success-light)] rounded-xl border border-[var(--accent-success)]">
            <div className="text-5xl font-bold mb-2" style={{ color: 'var(--accent-success)' }}>
              {realCount}
            </div>
            <div className="text-[var(--text-secondary)] font-medium">真模型</div>
          </div>
          <div className="text-center p-6 bg-[var(--accent-danger-light)] rounded-xl border border-[var(--accent-danger)]">
            <div className="text-5xl font-bold mb-2" style={{ color: 'var(--accent-danger)' }}>
              {fakeCount}
            </div>
            <div className="text-[var(--text-secondary)] font-medium">假模型</div>
          </div>
          <div className="text-center p-6 bg-[var(--surface-variant)] rounded-xl border border-[var(--border)]">
            <div className="text-5xl font-bold mb-2 text-[var(--text-secondary)]">
              {unknownCount}
            </div>
            <div className="text-[var(--text-secondary)] font-medium">未知</div>
          </div>
        </div>
      </div>

      {/* Detailed Results */}
      <div className="space-y-3">
        <h3 className="heading-font text-xl font-medium text-[var(--text-primary)] mb-4">详细结果</h3>
        {results.map((result, index) => {
          const status = getStatusInfo(result)
          const isExpanded = expanded === result.test_id

          return (
            <div
              key={result.test_id}
              className="material-card overflow-hidden animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <button
                onClick={() => setExpanded(isExpanded ? null : result.test_id)}
                className="w-full px-6 py-4 flex justify-between items-center hover:bg-[var(--bg-secondary)] transition-colors text-left"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="chip-material-primary px-3 py-1 text-sm font-medium">
                    #{result.test_id}
                  </div>
                  <div className="flex-1">
                    <div className="heading-font font-medium text-base text-[var(--text-primary)] mb-1">
                      {result.test_name}
                    </div>
                    <div className="text-sm text-[var(--text-secondary)]">
                      {result.detected_model}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className="px-4 py-1.5 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: status.bgColor,
                      color: status.color
                    }}
                  >
                    {status.label}
                  </span>
                  <svg
                    className={`w-5 h-5 text-[var(--text-secondary)] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {isExpanded && (
                <div className="px-6 py-4 border-t border-[var(--divider)] space-y-4 bg-[var(--bg-secondary)]">
                  {/* Prompt */}
                  <div>
                    <div className="text-xs font-medium text-[var(--accent-primary)] mb-2 uppercase tracking-wide">
                      提示词
                    </div>
                    <div className="material-card p-4 bg-[var(--bg-card)]">
                      <pre className="text-sm whitespace-pre-wrap text-[var(--text-secondary)] font-mono">
                        {result.prompt}
                      </pre>
                    </div>
                  </div>

                  {/* Thinking */}
                  {result.thinking && (
                    <div>
                      <div className="text-xs font-medium text-[var(--accent-primary)] mb-2 uppercase tracking-wide">
                        思考过程
                      </div>
                      <div className="material-card p-4 bg-[var(--bg-card)] max-h-60 overflow-y-auto">
                        <pre className="text-sm whitespace-pre-wrap font-mono text-[var(--text-secondary)]">
                          {result.thinking}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Response */}
                  <div>
                    <div className="text-xs font-medium text-[var(--accent-primary)] mb-2 uppercase tracking-wide">
                      模型回复
                    </div>
                    <div className="material-card p-4 bg-[var(--bg-card)] max-h-80 overflow-y-auto">
                      <pre className="text-sm whitespace-pre-wrap text-[var(--text-primary)] leading-relaxed">
                        {result.response}
                      </pre>
                    </div>
                  </div>

                  {/* Fake Indicators */}
                  {Object.keys(result.fake_indicators).length > 0 && (
                    <div className="material-card p-4 border-l-4 border-[var(--accent-danger)] bg-[var(--accent-danger-light)]">
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-[var(--accent-danger)] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-[var(--accent-danger)] mb-2">
                            检测到假模型特征
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(result.fake_indicators)
                              .filter(([, v]) => v)
                              .map(([k]) => (
                                <span
                                  key={k}
                                  className="chip-material-danger text-xs px-3 py-1"
                                >
                                  {k}
                                </span>
                              ))}
                          </div>
                        </div>
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
