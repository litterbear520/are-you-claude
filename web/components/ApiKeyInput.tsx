'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface ApiKeyInputProps {
  value: string
  onChange: (value: string) => void
}

export default function ApiKeyInput({ value, onChange }: ApiKeyInputProps) {
  const [showKey, setShowKey] = useState(false)

  return (
    <div>
      <label htmlFor="api-key" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
        API Key
      </label>
      <div className="relative">
        <input
          id="api-key"
          type={showKey ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="sk-ant-..."
          className="input w-full pr-10"
          name="api-key"
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="button"
          onClick={() => setShowKey(!showKey)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label={showKey ? 'Hide API key' : 'Show API key'}
        >
          {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}
