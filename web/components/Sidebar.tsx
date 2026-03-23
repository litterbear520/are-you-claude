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

function Pupil({
  size = 12, maxDistance = 5, pupilColor = '#2D2D2D',
  forceLookX, forceLookY,
}: {
  size?: number; maxDistance?: number; pupilColor?: string
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
      className="rounded-full"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: pupilColor,
        transform: `translate(${px}px, ${py}px)`,
        transition: 'transform 0.1s ease-out',
      }}
    />
  )
}

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
      className="rounded-full flex items-center justify-center transition-all duration-150"
      style={{
        width: `${size}px`,
        height: isBlinking ? '2px' : `${size}px`,
        backgroundColor: eyeColor,
        overflow: 'hidden',
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

function WatchingCharacters({ hasKeyContent, isKeyVisible }: { hasKeyContent: boolean; isKeyVisible: boolean }) {
  const [purpleBlink, setPurpleBlink] = useState(false)
  const [blackBlink, setBlackBlink] = useState(false)
  const [purplePeeking, setPurplePeeking] = useState(false)
  const [mouseX, setMouseX] = useState(0)
  const [mouseY, setMouseY] = useState(0)
  const purpleRef = useRef<HTMLDivElement>(null)
  const blackRef = useRef<HTMLDivElement>(null)
  const yellowRef = useRef<HTMLDivElement>(null)
  const orangeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onMove = (e: MouseEvent) => { setMouseX(e.clientX); setMouseY(e.clientY) }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  const calcPos = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 }
    const r = ref.current.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 3
    const dx = mouseX - cx
    const dy = mouseY - cy
    return {
      faceX: Math.max(-15, Math.min(15, dx / 20)),
      faceY: Math.max(-10, Math.min(10, dy / 30)),
      bodySkew: Math.max(-6, Math.min(6, -dx / 120)),
    }
  }

  // Random blinking for purple
  useEffect(() => {
    const schedule = (): ReturnType<typeof setTimeout> => {
      return setTimeout(() => {
        setPurpleBlink(true)
        setTimeout(() => { setPurpleBlink(false); schedule() }, 150)
      }, Math.random() * 4000 + 3000)
    }
    const t = schedule()
    return () => clearTimeout(t)
  }, [])

  // Random blinking for black
  useEffect(() => {
    const schedule = (): ReturnType<typeof setTimeout> => {
      return setTimeout(() => {
        setBlackBlink(true)
        setTimeout(() => { setBlackBlink(false); schedule() }, 150)
      }, Math.random() * 4000 + 3000)
    }
    const t = schedule()
    return () => clearTimeout(t)
  }, [])

  // Purple sneaky peeking when password is visible
  useEffect(() => {
    if (hasKeyContent && isKeyVisible) {
      const schedulePeek = (): ReturnType<typeof setTimeout> => {
        return setTimeout(() => {
          setPurplePeeking(true)
          setTimeout(() => { setPurplePeeking(false); schedulePeek() }, 800)
        }, Math.random() * 3000 + 2000)
      }
      const t = schedulePeek()
      return () => clearTimeout(t)
    } else {
      setPurplePeeking(false)
    }
  }, [hasKeyContent, isKeyVisible, purplePeeking])

  const purplePos = calcPos(purpleRef)
  const blackPos = calcPos(blackRef)
  const yellowPos = calcPos(yellowRef)
  const orangePos = calcPos(orangeRef)

  return (
    <div className="flex items-center justify-center flex-1" aria-hidden="true">
      <div className="relative" style={{ width: '550px', height: '400px', transform: 'scale(0.65)', transformOrigin: 'center' }}>
        {/* Purple tall rectangle character - Back layer */}
        <div
          ref={purpleRef}
          className="absolute bottom-0 transition-all duration-700 ease-in-out"
          style={{
            left: '70px',
            width: '180px',
            height: (hasKeyContent && !isKeyVisible) ? '440px' : '400px',
            backgroundColor: '#6C3FF5',
            borderRadius: '10px 10px 0 0',
            zIndex: 1,
            transform: (hasKeyContent && isKeyVisible)
              ? `skewX(0deg)`
              : (hasKeyContent && !isKeyVisible)
                ? `skewX(${(purplePos.bodySkew || 0) - 12}deg) translateX(40px)`
                : `skewX(${purplePos.bodySkew || 0}deg)`,
            transformOrigin: 'bottom center',
          }}
        >
          {/* Eyes */}
          <div
            className="absolute flex gap-8 transition-all duration-700 ease-in-out"
            style={{
              left: (hasKeyContent && isKeyVisible) ? `${20}px` : `${45 + purplePos.faceX}px`,
              top: (hasKeyContent && isKeyVisible) ? `${35}px` : `${40 + purplePos.faceY}px`,
            }}
          >
            <EyeBall
              size={18}
              pupilSize={7}
              maxDistance={5}
              eyeColor="white"
              pupilColor="#2D2D2D"
              isBlinking={purpleBlink}
              forceLookX={(hasKeyContent && isKeyVisible) ? (purplePeeking ? 4 : -4) : undefined}
              forceLookY={(hasKeyContent && isKeyVisible) ? (purplePeeking ? 5 : -4) : undefined}
            />
            <EyeBall
              size={18}
              pupilSize={7}
              maxDistance={5}
              eyeColor="white"
              pupilColor="#2D2D2D"
              isBlinking={purpleBlink}
              forceLookX={(hasKeyContent && isKeyVisible) ? (purplePeeking ? 4 : -4) : undefined}
              forceLookY={(hasKeyContent && isKeyVisible) ? (purplePeeking ? 5 : -4) : undefined}
            />
          </div>
        </div>

        {/* Black tall rectangle character - Middle layer */}
        <div
          ref={blackRef}
          className="absolute bottom-0 transition-all duration-700 ease-in-out"
          style={{
            left: '240px',
            width: '120px',
            height: '310px',
            backgroundColor: '#2D2D2D',
            borderRadius: '8px 8px 0 0',
            zIndex: 2,
            transform: (hasKeyContent && isKeyVisible)
              ? `skewX(0deg)`
              : (hasKeyContent && !isKeyVisible)
                ? `skewX(${(blackPos.bodySkew || 0) * 1.5}deg)`
                : `skewX(${blackPos.bodySkew || 0}deg)`,
            transformOrigin: 'bottom center',
          }}
        >
          {/* Eyes */}
          <div
            className="absolute flex gap-6 transition-all duration-700 ease-in-out"
            style={{
              left: (hasKeyContent && isKeyVisible) ? `${10}px` : `${26 + blackPos.faceX}px`,
              top: (hasKeyContent && isKeyVisible) ? `${28}px` : `${32 + blackPos.faceY}px`,
            }}
          >
            <EyeBall
              size={16}
              pupilSize={6}
              maxDistance={4}
              eyeColor="white"
              pupilColor="#2D2D2D"
              isBlinking={blackBlink}
              forceLookX={(hasKeyContent && isKeyVisible) ? -4 : undefined}
              forceLookY={(hasKeyContent && isKeyVisible) ? -4 : undefined}
            />
            <EyeBall
              size={16}
              pupilSize={6}
              maxDistance={4}
              eyeColor="white"
              pupilColor="#2D2D2D"
              isBlinking={blackBlink}
              forceLookX={(hasKeyContent && isKeyVisible) ? -4 : undefined}
              forceLookY={(hasKeyContent && isKeyVisible) ? -4 : undefined}
            />
          </div>
        </div>

        {/* Orange semi-circle character - Front left */}
        <div
          ref={orangeRef}
          className="absolute bottom-0 transition-all duration-700 ease-in-out"
          style={{
            left: '0px',
            width: '240px',
            height: '200px',
            zIndex: 3,
            backgroundColor: '#FF9B6B',
            borderRadius: '120px 120px 0 0',
            transform: (hasKeyContent && isKeyVisible) ? `skewX(0deg)` : `skewX(${orangePos.bodySkew || 0}deg)`,
            transformOrigin: 'bottom center',
          }}
        >
          {/* Eyes - just pupils, no white */}
          <div
            className="absolute flex gap-8 transition-all duration-200 ease-out"
            style={{
              left: (hasKeyContent && isKeyVisible) ? `${50}px` : `${82 + (orangePos.faceX || 0)}px`,
              top: (hasKeyContent && isKeyVisible) ? `${85}px` : `${90 + (orangePos.faceY || 0)}px`,
            }}
          >
            <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(hasKeyContent && isKeyVisible) ? -5 : undefined} forceLookY={(hasKeyContent && isKeyVisible) ? -4 : undefined} />
            <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(hasKeyContent && isKeyVisible) ? -5 : undefined} forceLookY={(hasKeyContent && isKeyVisible) ? -4 : undefined} />
          </div>
        </div>

        {/* Yellow tall rectangle character - Front right */}
        <div
          ref={yellowRef}
          className="absolute bottom-0 transition-all duration-700 ease-in-out"
          style={{
            left: '310px',
            width: '140px',
            height: '230px',
            backgroundColor: '#E8D754',
            borderRadius: '70px 70px 0 0',
            zIndex: 4,
            transform: (hasKeyContent && isKeyVisible) ? `skewX(0deg)` : `skewX(${yellowPos.bodySkew || 0}deg)`,
            transformOrigin: 'bottom center',
          }}
        >
          {/* Eyes - just pupils, no white */}
          <div
            className="absolute flex gap-6 transition-all duration-200 ease-out"
            style={{
              left: (hasKeyContent && isKeyVisible) ? `${20}px` : `${52 + (yellowPos.faceX || 0)}px`,
              top: (hasKeyContent && isKeyVisible) ? `${35}px` : `${40 + (yellowPos.faceY || 0)}px`,
            }}
          >
            <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(hasKeyContent && isKeyVisible) ? -5 : undefined} forceLookY={(hasKeyContent && isKeyVisible) ? -4 : undefined} />
            <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(hasKeyContent && isKeyVisible) ? -5 : undefined} forceLookY={(hasKeyContent && isKeyVisible) ? -4 : undefined} />
          </div>
          {/* Horizontal line for mouth */}
          <div
            className="absolute w-20 h-[4px] bg-[#2D2D2D] rounded-full transition-all duration-200 ease-out"
            style={{
              left: (hasKeyContent && isKeyVisible) ? `${10}px` : `${40 + (yellowPos.faceX || 0)}px`,
              top: (hasKeyContent && isKeyVisible) ? `${88}px` : `${88 + (yellowPos.faceY || 0)}px`,
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
          <WatchingCharacters hasKeyContent={key.length > 0} isKeyVisible={showKey} />
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

          <div className="space-y-4 flex-1">
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
              <div className="segmented-control">
                {URL_OPTIONS.map(u => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setUrl(u.value)}
                    className={`segmented-item ${url === u.value ? 'active' : ''}`}
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
              <div className="segmented-control">
                {MODEL_OPTIONS.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setModelId(m.value)}
                    className={`segmented-item ${modelId === m.value ? 'active' : ''}`}
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
