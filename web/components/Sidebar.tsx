'use client'

import { useState } from 'react'

interface Config {
  url: string
  key: string
  modelId: string
}

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  config: Config
  onConfigChange: (config: Config) => void
}

const MODEL_OPTIONS = [
  { id: '1', name: 'Sonnet 4.5', value: 'claude-sonnet-4-5-20250929' },
  { id: '2', name: 'Opus 4.5', value: 'claude-opus-4-5-20251101' },
]

export default function Sidebar({ isOpen, onClose, config, onConfigChange }: SidebarProps) {
  const [url, setUrl] = useState(config.url)
  const [key, setKey] = useState(config.key)
  const [modelId, setModelId] = useState(config.modelId)
  const [showKey, setShowKey] = useState(false)

  const handleSave = () => {
    onConfigChange({ url, key, modelId })
    onClose()
  }

  return (
    <>
      {/* Overlay */}
      <div
        className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="heading-font text-2xl text-[var(--text-primary)]">
              API 配置
            </h2>
            <button
              onClick={onClose}
              className="icon-btn"
              aria-label="Close sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                API URL
              </label>
              <input
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://api.anthropic.com"
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                模型选择
              </label>
              <select
                value={modelId}
                onChange={e => setModelId(e.target.value)}
                className="input w-full cursor-pointer"
              >
                {MODEL_OPTIONS.map(m => (
                  <option key={m.id} value={m.value}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={key}
                  onChange={e => setKey(e.target.value)}
                  placeholder="sk-ant-..."
                  className="input w-full pr-20"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)] text-sm font-medium"
                >
                  {showKey ? '隐藏' : '显示'}
                </button>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={!url || !key}
              className="btn btn-primary w-full"
            >
              保存配置
            </button>

            {/* Info */}
            <div className="mt-6 p-4 bg-[var(--accent-primary-light)] rounded-lg border border-[var(--accent-primary)]">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[var(--accent-primary)] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-[var(--text-secondary)]">
                  <p className="font-medium text-[var(--accent-primary)] mb-1">隐私说明</p>
                  <p>密钥仅用于转发请求，不会被存储或记录。</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
