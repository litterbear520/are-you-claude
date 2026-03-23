'use client'

import { useState } from 'react'

interface Config {
  url: string
  key: string
  modelId: string
}

const MODEL_OPTIONS = [
  { id: '1', name: 'Sonnet 4.5', value: 'claude-sonnet-4-5-20250929' },
  { id: '2', name: 'Opus 4.5', value: 'claude-opus-4-5-20251101' },
]

export default function TestForm({ onSubmit }: { onSubmit: (cfg: Config) => void }) {
  const [url, setUrl] = useState('')
  const [key, setKey] = useState('')
  const [modelId, setModelId] = useState(MODEL_OPTIONS[0].value)
  const [showKey, setShowKey] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!url || !key) return
    onSubmit({ url, key, modelId })
  }

  return (
    <form onSubmit={handleSubmit} className="material-card p-6">
      <h3 className="heading-font text-xl font-medium text-[var(--text-primary)] mb-6">
        API 配置
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            API URL
          </label>
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://api.anthropic.com"
            required
            className="input-material w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            模型选择
          </label>
          <select
            value={modelId}
            onChange={e => setModelId(e.target.value)}
            className="input-material w-full cursor-pointer"
          >
            {MODEL_OPTIONS.map(m => (
              <option key={m.id} value={m.value}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
          API Key
        </label>
        <div className="relative">
          <input
            type={showKey ? 'text' : 'password'}
            value={key}
            onChange={e => setKey(e.target.value)}
            placeholder="sk-ant-..."
            required
            className="input-material w-full pr-20"
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
        type="submit"
        className="btn-material btn-material-filled w-full"
      >
        保存配置并继续
      </button>
    </form>
  )
}
