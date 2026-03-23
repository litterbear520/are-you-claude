'use client'

interface TestCardProps {
  id: number
  name: string
  description: string
  selected: boolean
  onToggle: (id: number) => void
}

const CARD_COLORS = [
  'rgba(0, 255, 136, 0.1)',  // Green
  'rgba(0, 204, 255, 0.1)',  // Cyan
  'rgba(255, 51, 102, 0.1)', // Pink
  'rgba(255, 204, 0, 0.1)',  // Yellow
  'rgba(153, 102, 255, 0.1)', // Purple
]

export default function TestCard({ id, name, description, selected, onToggle }: TestCardProps) {
  const accentColor = CARD_COLORS[(id - 1) % CARD_COLORS.length]

  return (
    <div
      onClick={() => onToggle(id)}
      className={`test-card glass-card p-5 cursor-pointer transition-all duration-300 group ${
        selected ? 'border-[var(--accent-primary)] shadow-[0_0_30px_rgba(0,255,136,0.3)] scale-[1.02]' : ''
      }`}
      style={{
        background: selected ? accentColor : undefined
      }}
    >
      <div className="flex items-start gap-4">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => {}}
          className="checkbox-custom mt-1"
          onClick={(e) => e.stopPropagation()}
        />
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[var(--accent-secondary)] font-bold text-sm px-2 py-1 bg-[var(--bg-secondary)] rounded">
              #{id.toString().padStart(2, '0')}
            </span>
            <h3 className="heading-font font-bold text-lg group-hover:text-[var(--accent-primary)] transition-colors">
              {name}
            </h3>
          </div>
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      {/* Hover indicator */}
      <div className="absolute top-0 right-0 w-1 h-full bg-[var(--accent-primary)] opacity-0 group-hover:opacity-100 transition-opacity rounded-r-2xl" />
    </div>
  )
}
