'use client'

interface TestPromptCardProps {
  id: number
  name: string
  prompt: string
  description: string
  onSelect: (id: number) => void
}

export default function TestPromptCard({ id, name, prompt, description, onSelect }: TestPromptCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className="test-card card p-5 w-full text-left"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="badge badge-primary">
          #{id}
        </div>
        <h3 className="heading-font text-lg text-[var(--text-primary)] flex-1">
          {name}
        </h3>
      </div>

      <p className="text-sm text-[var(--text-secondary)] mb-4 leading-relaxed">
        {description}
      </p>

      <div className="p-3 bg-[var(--surface-variant)] rounded-lg border border-[var(--border)]">
        <p className="text-xs font-medium text-[var(--text-tertiary)] mb-2 uppercase tracking-wide">
          提示词预览
        </p>
        <p className="text-sm text-[var(--text-primary)] line-clamp-3 font-mono">
          {prompt}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2 text-[var(--accent-primary)] text-sm font-medium">
        <span>点击测试</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </div>
    </button>
  )
}
