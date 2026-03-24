'use client'

import { useState } from 'react'

interface ExpectedTableRow {
  model: string
  date: string
}

interface TestItem {
  id: number
  name: string
  prompt: string
  description: string
  expected: string
  expectedTable?: ExpectedTableRow[]
}

interface TestPanelProps {
  tests: TestItem[]
  customTestIds: number[]
  activeTestId: number | null
  onSelect: (id: number) => void
  onAddCustomTest: (test: Omit<TestItem, 'id' | 'expectedTable'>) => void
  onDeleteCustomTest: (id: number) => void
  hasKey: boolean
  onOpenSettings: () => void
}

function AddTestForm({ onAdd, onCancel }: {
  onAdd: (test: { name: string; prompt: string; description: string; expected: string }) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [prompt, setPrompt] = useState('')
  const [description, setDescription] = useState('')
  const [expected, setExpected] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !prompt.trim()) return
    onAdd({ name: name.trim(), prompt: prompt.trim(), description: description.trim(), expected: expected.trim() })
  }

  return (
    <form onSubmit={handleSubmit} className="mx-2 mb-2 rounded-xl border border-[var(--accent-primary)] overflow-hidden">
      <div className="px-3 py-3 space-y-2.5 bg-[var(--surface-variant)]">
        <p className="text-[10px] font-semibold text-[var(--accent-primary)] uppercase tracking-wider">新建测试</p>

        <div>
          <label htmlFor="custom-name" className="text-[10px] text-[var(--text-tertiary)] font-medium block mb-1">
            标题 <span aria-hidden="true">*</span>
          </label>
          <input
            id="custom-name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="测试名称…"
            required
            autoComplete="off"
            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent-primary)]"
          />
        </div>

        <div>
          <label htmlFor="custom-prompt" className="text-[10px] text-[var(--text-tertiary)] font-medium block mb-1">
            提示词 <span aria-hidden="true">*</span>
          </label>
          <textarea
            id="custom-prompt"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="输入发送给模型的提示词…"
            required
            rows={3}
            autoComplete="off"
            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent-primary)] resize-none focus-visible:outline-none"
          />
        </div>

        <div>
          <label htmlFor="custom-desc" className="text-[10px] text-[var(--text-tertiary)] font-medium block mb-1">
            说明（可选）
          </label>
          <input
            id="custom-desc"
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="这个测试检测什么…"
            autoComplete="off"
            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent-primary)]"
          />
        </div>

        <div>
          <label htmlFor="custom-expected" className="text-[10px] text-[var(--text-tertiary)] font-medium block mb-1">
            预期答案（可选）
          </label>
          <input
            id="custom-expected"
            type="text"
            value={expected}
            onChange={e => setExpected(e.target.value)}
            placeholder="真 Claude 应该回答…"
            autoComplete="off"
            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent-primary)]"
          />
        </div>
      </div>

      <div className="flex border-t border-[var(--border)]">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 text-xs font-medium text-[var(--text-secondary)] bg-[var(--bg-card)] hover:bg-[var(--surface-variant)] transition-colors"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={!name.trim() || !prompt.trim()}
          className="flex-1 py-2 text-xs font-semibold text-white bg-[var(--accent-primary)] hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed border-l border-[var(--border)]"
        >
          添加
        </button>
      </div>
    </form>
  )
}

export default function TestPanel({
  tests, customTestIds, activeTestId, onSelect, onAddCustomTest, onDeleteCustomTest, hasKey, onOpenSettings
}: TestPanelProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  const handleRowClick = (id: number) => {
    setExpandedId(prev => prev === id ? null : id)
  }

  const handleRun = (id: number) => {
    if (!hasKey) { onOpenSettings(); return }
    onSelect(id)
  }

  const handleAdd = (test: { name: string; prompt: string; description: string; expected: string }) => {
    onAddCustomTest(test)
    setShowAddForm(false)
  }

  if (collapsed) {
    return (
      <div className="flex flex-col items-center py-4 gap-3 w-12 border-r border-[var(--border)] h-full shrink-0">
        <button
          onClick={() => setCollapsed(false)}
          className="icon-btn"
          aria-label="展开测试面板"
          title="展开测试面板"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <div className="flex flex-col gap-1.5 mt-1">
          {tests.map(t => (
            <button
              key={t.id}
              onClick={() => handleRun(t.id)}
              title={t.name}
              aria-label={`运行测试 ${t.id}: ${t.name}`}
              className={`w-7 h-7 rounded-lg text-[10px] font-bold transition-colors ${
                activeTestId === t.id
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'bg-[var(--surface-variant)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {customTestIds.includes(t.id) ? '★' : t.id}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col w-72 border-r border-[var(--border)] h-full shrink-0">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] shrink-0">
        <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
          测试项目
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setShowAddForm(v => !v); setExpandedId(null) }}
            className="icon-btn w-7 h-7"
            aria-label="添加自定义测试"
            title="添加自定义测试"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={() => setCollapsed(true)}
            className="icon-btn w-7 h-7"
            aria-label="收起面板"
            title="收起面板"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* No key warning */}
      {!hasKey && (
        <button
          onClick={onOpenSettings}
          className="mx-3 mt-3 px-3 py-2 rounded-lg bg-[var(--accent-warning-light)] border border-[var(--accent-warning)] text-left"
        >
          <p className="text-xs font-medium text-[var(--accent-warning)]">需要配置 API Key</p>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">点击此处前往设置</p>
        </button>
      )}

      {/* Test list */}
      <div className="flex-1 overflow-y-auto py-2">
        {/* Add form */}
        {showAddForm && (
          <AddTestForm
            onAdd={handleAdd}
            onCancel={() => setShowAddForm(false)}
          />
        )}

        {tests.map(test => {
          const isActive = activeTestId === test.id
          const isExpanded = expandedId === test.id
          const isCustom = customTestIds.includes(test.id)

          return (
            <div key={test.id}>
              <button
                type="button"
                onClick={() => handleRowClick(test.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors text-left group hover:bg-[var(--surface-variant)] ${
                  isActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'
                }`}
                style={{ width: 'calc(100% - 16px)', marginLeft: '8px' }}
                aria-expanded={isExpanded}
              >
                <span className={`shrink-0 w-5 h-5 rounded-md text-[10px] font-bold flex items-center justify-center transition-colors ${
                  isActive
                    ? 'bg-[var(--accent-primary)] text-white'
                    : 'bg-[var(--surface-variant)] text-[var(--text-tertiary)] group-hover:bg-[var(--border)]'
                }`}>
                  {isCustom ? '★' : test.id}
                </span>
                <span className="flex-1 text-sm font-medium truncate">{test.name}</span>
                <svg
                  className={`shrink-0 w-3 h-3 text-[var(--text-tertiary)] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isExpanded && (
                <div className="mx-2 mb-1 rounded-xl border border-[var(--border)] overflow-hidden">
                  <div className="px-3 py-3 space-y-3 bg-[var(--surface-variant)]">

                    {test.description ? (
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{test.description}</p>
                    ) : null}

                    {(test.expected || test.expectedTable) && (
                      <div>
                        <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5">
                          预期答案
                        </p>
                        {test.expectedTable ? (
                          <table className="w-full text-xs border-collapse">
                            <thead>
                              <tr>
                                <th className="text-left py-1 px-2 text-[var(--text-tertiary)] font-medium bg-[var(--bg-card)] border border-[var(--border)]">模型</th>
                                <th className="text-left py-1 px-2 text-[var(--text-tertiary)] font-medium bg-[var(--bg-card)] border border-[var(--border)] border-l-0">知识截止</th>
                              </tr>
                            </thead>
                            <tbody>
                              {test.expectedTable.map((row, i) => (
                                <tr key={row.model} className={i % 2 === 0 ? 'bg-[var(--bg-card)]' : 'bg-[var(--surface-variant)]'}>
                                  <td className="py-1 px-2 text-[var(--text-primary)] font-mono border border-[var(--border)] border-t-0">{row.model}</td>
                                  <td className="py-1 px-2 text-[var(--text-primary)] border border-[var(--border)] border-t-0 border-l-0">{row.date}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <p className="text-xs text-[var(--text-primary)] bg-[var(--bg-card)] rounded-lg px-2.5 py-1.5 border border-[var(--border)]">
                            {test.expected}
                          </p>
                        )}
                      </div>
                    )}

                    <div>
                      <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5">提示词</p>
                      <p className="text-xs text-[var(--text-secondary)] font-mono leading-relaxed break-all line-clamp-3 bg-[var(--bg-card)] rounded-lg px-2.5 py-1.5 border border-[var(--border)]">
                        {test.prompt}
                      </p>
                    </div>
                  </div>

                  <div className="flex border-t border-[var(--border)]">
                    {isCustom && (
                      <button
                        type="button"
                        onClick={() => onDeleteCustomTest(test.id)}
                        className="px-3 py-2.5 text-xs font-medium text-[var(--accent-danger)] bg-[var(--bg-card)] hover:bg-[var(--accent-danger-light)] transition-colors border-r border-[var(--border)]"
                        aria-label={`删除测试 ${test.name}`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRun(test.id)}
                      className="flex-1 py-2.5 text-xs font-semibold text-white bg-[var(--accent-primary)] hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3l14 9-14 9V3z" />
                      </svg>
                      运行测试
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
