'use client'

import { useState, useEffect, useRef } from 'react'
import { Eye, EyeOff } from 'lucide-react'

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
  { id: '1', name: 'Claude Sonnet 4.6', value: 'claude-sonnet-4-6' },
  { id: '2', name: 'Claude Opus 4.6', value: 'claude-opus-4-6' },
  { id: '3', name: 'Claude Sonnet 4.5', value: 'claude-sonnet-4-5-20250929' },
  { id: '4', name: 'Claude Opus 4.5', value: 'claude-opus-4-5-20251101' },
]

const URL_OPTIONS = [
  { id: '1', name: 'Anthropic 官方', value: 'https://api.anthropic.com' },
  { id: '2', name: '兔子 API', value: 'https://gaccode.com/claudecode' },
  { id: '3', name: 'OpenRouter', value: 'https://openrouter.ai/api' },
  { id: '4', name: 'PPChat', value: 'https://code.ppchat.vip' },
]

function EyeBall({
  size = 14, pupilSize = 6, maxDistance = 4,
  eyeColor = 'white', pupilColor = '#2D2D2D', isBlinking = false,
  forceLookX, forceLookY,
}: {
  size?: number; pupilSize?: number; maxDistance?: number
  eyeColor?: string; pupilColor?: string; isBlinking?: boolean
  forceLookX?: number; forceLookY?: number
}) {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!ref.current) return
      if (forceLookX !== undefined && forceLookY !== undefined) return
      const r = ref.current.getBoundingClientRect()
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height / 2)
      const dist = Math.min(Math.sqrt(dx * dx + dy * dy), maxDistance)
      const angle = Math.atan2(dy, dx)
      setPos({ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist })
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [maxDistance, forceLookX, forceLookY])

  const px = forceLookX !== undefined ? forceLookX : pos.x
  const py = forceLookY !== undefined ? forceLookY : pos.y

  return (
    <div
      ref={ref}
      className="rounded-full flex items-center justify-center"
      style={{
        width: `${size}px`,
        height: isBlinking ? '2px' : `${size}px`,
        backgroundColor: eyeColor,
        overflow: 'hidden',
        transition: 'height 0.1s ease',
      }}
    >
      {!isBlinking && (
        <div
          className="rounded-full"
          style={{
            width: `${pupilSize}px`,
            height: `${pupilSize}px`,
            backgroundColor: pupilColor,
            transform: `translate(${px}px, ${py}px)`,
            transition: 'transform 0.1s ease-out',
          }}
        />
      )}
    </div>
  )
}

function WatchingCharacters({ isTypingKey, isKeyVisible }: { isTypingKey: boolean; isKeyVisible: boolean }) {
  const [purpleBlink, setPurpleBlink] = useState(false)
  const [blackBlink, setBlackBlink] = useState(false)
  const [lookAtEachOther, setLookAtEachOther] = useState(false)
  const [purplePeeking, setPurplePeeking] = useState(false)

  // Random blinking
  useEffect(() => {
    const schedule = (setter: (v: boolean) => void): ReturnType<typeof setTimeout> => {
      const t = setTimeout(() => {
        setter(true)
        setTimeout(() => { setter(false); schedule(setter) }, 150)
      }, Math.random() * 4000 + 3000)
      return t
    }
    const t1 = schedule(setPurpleBlink)
    const t2 = schedule(setBlackBlink)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  // Look at each other briefly when typing starts
  useEffect(() => {
    if (!isTypingKey) { setLookAtEachOther(false); return }
    setLookAtEachOther(true)
    const t = setTimeout(() => setLookAtEachOther(false), 800)
    return () => clearTimeout(t)
  }, [isTypingKey])

  // Purple sneaky peek when key is visible
  useEffect(() => {
    if (!isKeyVisible) { setPurplePeeking(false); return }
    const schedulePeek = (): ReturnType<typeof setTimeout> => {
      return setTimeout(() => {
        setPurplePeeking(true)
        setTimeout(() => { setPurplePeeking(false); schedulePeek() }, 800)
      }, Math.random() * 3000 + 2000)
    }
    const t = schedulePeek()
    return () => clearTimeout(t)
  }, [isKeyVisible])

  // Characters cover eyes when key is being typed (hidden mode)
  const hiding = isTypingKey && !isKeyVisible

  return (
    <div className="flex items-center justify-center flex-1" aria-hidden="true">
      <div className="flex items-end gap-1">
        {/* Orange - semi-circle */}
        <div
          className="relative transition-all duration-500"
          style={{
            width: 80, height: 58,
            backgroundColor: '#FF9B6B',
            borderRadius: '40px 40px 0 0',
            transform: hiding ? 'translateY(20px)' : 'translateY(0)',
          }}
        >
          <div className="absolute flex gap-3 transition-all duration-300" style={{ left: 24, top: 24 }}>
            <EyeBall size={13} pupilSize={5} maxDistance={3} eyeColor="white" pupilColor="#2D2D2D"
              forceLookX={hiding ? 0 : isKeyVisible ? -4 : undefined}
              forceLookY={hiding ? -5 : isKeyVisible ? -3 : undefined}
            />
            <EyeBall size={13} pupilSize={5} maxDistance={3} eyeColor="white" pupilColor="#2D2D2D"
              forceLookX={hiding ? 0 : isKeyVisible ? -4 : undefined}
              forceLookY={hiding ? -5 : isKeyVisible ? -3 : undefined}
            />
          </div>
        </div>

        {/* Purple - tall rectangle */}
        <div
          className="relative transition-all duration-700"
          style={{
            width: 72, height: hiding ? 96 : 84,
            backgroundColor: '#6C3FF5',
            borderRadius: '8px 8px 0 0',
            transform: hiding
              ? 'skewX(-10deg) translateX(8px)'
              : lookAtEachOther ? 'skewX(4deg)' : 'skewX(0deg)',
            transformOrigin: 'bottom center',
          }}
        >
          <div
            className="absolute flex gap-3 transition-all duration-500"
            style={{
              left: hiding ? 18 : lookAtEachOther ? 28 : 20,
              top: hiding ? 30 : lookAtEachOther ? 28 : 24,
            }}
          >
            <EyeBall size={14} pupilSize={6} maxDistance={4} eyeColor="white" pupilColor="#2D2D2D"
              isBlinking={purpleBlink}
              forceLookX={hiding ? 0 : isKeyVisible ? (purplePeeking ? 4 : -4) : lookAtEachOther ? 3 : undefined}
              forceLookY={hiding ? -5 : isKeyVisible ? (purplePeeking ? 4 : -4) : lookAtEachOther ? 3 : undefined}
            />
            <EyeBall size={14} pupilSize={6} maxDistance={4} eyeColor="white" pupilColor="#2D2D2D"
              isBlinking={purpleBlink}
              forceLookX={hiding ? 0 : isKeyVisible ? (purplePeeking ? 4 : -4) : lookAtEachOther ? 3 : undefined}
              forceLookY={hiding ? -5 : isKeyVisible ? (purplePeeking ? 4 : -4) : lookAtEachOther ? 3 : undefined}
            />
          </div>
        </div>

        {/* Black - medium rectangle */}
        <div
          className="relative transition-all duration-700"
          style={{
            width: 56, height: hiding ? 80 : 68,
            backgroundColor: '#2D2D2D',
            borderRadius: '6px 6px 0 0',
            transform: hiding
              ? 'skewX(8deg) translateX(-6px)'
              : lookAtEachOther ? 'skewX(-4deg)' : 'skewX(0deg)',
            transformOrigin: 'bottom center',
          }}
        >
          <div
            className="absolute flex gap-2 transition-all duration-500"
            style={{
              left: hiding ? 14 : lookAtEachOther ? 10 : 14,
              top: hiding ? 24 : lookAtEachOther ? 18 : 20,
            }}
          >
            <EyeBall size={12} pupilSize={5} maxDistance={3} eyeColor="white" pupilColor="#6C3FF5"
              isBlinking={blackBlink}
              forceLookX={hiding ? 0 : isKeyVisible ? -4 : lookAtEachOther ? -3 : undefined}
              forceLookY={hiding ? -5 : isKeyVisible ? -3 : lookAtEachOther ? 3 : undefined}
            />
            <EyeBall size={12} pupilSize={5} maxDistance={3} eyeColor="white" pupilColor="#6C3FF5"
              isBlinking={blackBlink}
              forceLookX={hiding ? 0 : isKeyVisible ? -4 : lookAtEachOther ? -3 : undefined}
              forceLookY={hiding ? -5 : isKeyVisible ? -3 : lookAtEachOther ? 3 : undefined}
            />
          </div>
        </div>

        {/* Yellow - rounded top */}
        <div
          className="relative transition-all duration-500"
          style={{
            width: 68, height: 60,
            backgroundColor: '#E8D754',
            borderRadius: '34px 34px 0 0',
            transform: hiding ? 'translateY(18px)' : 'translateY(0)',
          }}
        >
          <div className="absolute flex gap-2 transition-all duration-300" style={{ left: 20, top: 22 }}>
            <EyeBall size={12} pupilSize={5} maxDistance={3} eyeColor="white" pupilColor="#2D2D2D"
              forceLookX={hiding ? 0 : isKeyVisible ? -4 : undefined}
              forceLookY={hiding ? -5 : isKeyVisible ? -3 : undefined}
            />
            <EyeBall size={12} pupilSize={5} maxDistance={3} eyeColor="white" pupilColor="#2D2D2D"
              forceLookX={hiding ? 0 : isKeyVisible ? -4 : undefined}
              forceLookY={hiding ? -5 : isKeyVisible ? -3 : undefined}
            />
          </div>
          {/* Mouth */}
          <div
            className="absolute rounded-full transition-all duration-300"
            style={{
              width: 28, height: 3,
              backgroundColor: '#2D2D2D',
              left: 20, top: 42,
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default function Sidebar({ isOpen, onClose, config, onConfigChange }: SidebarProps) {
  const [url, setUrl] = useState(config.url)
  const [key, setKey] = useState(config.key)
  const [modelId, setModelId] = useState(config.modelId)
  const [showKey, setShowKey] = useState(false)
  const [isTypingKey, setIsTypingKey] = useState(false)

  const handleSave = () => {
    onConfigChange({ url, key, modelId })
    onClose()
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (isOpen) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  return (
    <>
      {/* Overlay */}
      <div
        className={`modal-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={`modal-dialog ${isOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="API 配置"
      >
        {/* Left panel */}
        <div className="modal-left">
          <div className="text-center">
            <h2 className="heading-font text-xl text-white mb-1">API 配置</h2>
            <p className="text-xs text-white/50">配置你的 Claude API</p>
          </div>
          <WatchingCharacters isTypingKey={isTypingKey} isKeyVisible={showKey && key.length > 0} />
          <p className="text-xs text-white/30 text-center">他们在看着你</p>
        </div>

        {/* Right panel */}
        <div className="modal-right">
          <div className="flex items-center justify-between mb-5">
            <h3 className="heading-font text-lg text-[var(--text-primary)]">连接设置</h3>
            <button onClick={onClose} className="icon-btn" aria-label="关闭">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4 overflow-y-auto flex-1">
            {/* URL */}
            <div>
              <label htmlFor="api-url" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                API URL
              </label>
              <input
                id="api-url"
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://api.anthropic.com"
                className="input w-full"
                name="api-url"
                autoComplete="url"
              />
              <div className="text-xs text-[var(--text-tertiary)] mt-2 mb-1.5">预设地址：</div>
              <div className="grid grid-cols-2 gap-1.5">
                {URL_OPTIONS.map(u => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setUrl(u.value)}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                      url === u.value
                        ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]'
                        : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--accent-primary)]'
                    }`}
                  >
                    {u.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Model */}
            <div>
              <label htmlFor="model-input" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                模型
              </label>
              <input
                id="model-input"
                type="text"
                value={modelId}
                onChange={e => setModelId(e.target.value)}
                placeholder="claude-sonnet-4-6"
                className="input w-full"
                name="model-id"
                autoComplete="off"
                spellCheck={false}
              />
              <div className="text-xs text-[var(--text-tertiary)] mt-2 mb-1.5">预设模型：</div>
              <div className="grid grid-cols-2 gap-1.5">
                {MODEL_OPTIONS.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setModelId(m.value)}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                      modelId === m.value
                        ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]'
                        : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--accent-primary)]'
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>

            {/* API Key */}
            <div>
              <label htmlFor="api-key" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                API Key
              </label>
              <div className="relative">
                <input
                  id="api-key"
                  type={showKey ? 'text' : 'password'}
                  value={key}
                  onChange={e => setKey(e.target.value)}
                  onFocus={() => setIsTypingKey(true)}
                  onBlur={() => setIsTypingKey(false)}
                  placeholder="sk-ant-..."
                  className="input w-full pr-10"
                  name="api-key"
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  aria-label={showKey ? 'Hide API key' : 'Show API key'}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
          </div>
        </div>
      </div>
    </>
  )
}
