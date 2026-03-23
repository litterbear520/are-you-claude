'use client'

import { useState } from 'react'

interface Config {
  url: string
  key: string
  modelId: string
}

const MODEL_OPTIONS = [
  { id: '1', name: 'Sonnet', value: 'claude-sonnet-4-5-20250929' },
  { id: '2', name: 'Opus', value: 'claude-opus-4-5-20251101' },
]

export default function TestForm({ onSubmit }: { onSubmit: (cfg: Config) => void }) {
  const [url, setUrl] = useState('')
  const [key, setKey] = useState('')
  const [modelId, setModelId] = useState(MODEL_OPTIONS[0].value)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ url, key, modelId })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">API URL</label>
        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://api.example.com"
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">API Key</label>
        <input
          type="password"
          value={key}
          onChange={e => setKey(e.target.value)}
          placeholder="sk-..."
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">模型</label>
        <select
          value={modelId}
          onChange={e => setModelId(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        >
          {MODEL_OPTIONS.map(m => (
            <option key={m.id} value={m.value}>{m.name} ({m.value})</option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        保存配置
      </button>
    </form>
  )
}
