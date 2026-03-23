'use client'

interface TestCardProps {
  id: number
  name: string
  description: string
  selected: boolean
  onToggle: (id: number) => void
}

export default function TestCard({ id, name, description, selected, onToggle }: TestCardProps) {
  return (
    <div
      onClick={() => onToggle(id)}
      className={`material-card p-5 cursor-pointer transition-all duration-200 ${
        selected ? 'material-card-elevated border-[var(--accent-primary)] bg-[var(--accent-primary-light)]' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => {}}
          className="checkbox-material mt-1"
          onClick={(e) => e.stopPropagation()}
        />
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="chip-material-primary text-xs font-medium px-2 py-1">
              测试 {id}
            </span>
            <h3 className="heading-font font-medium text-base text-[var(--text-primary)]">
              {name}
            </h3>
          </div>
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </div>
  )
}
