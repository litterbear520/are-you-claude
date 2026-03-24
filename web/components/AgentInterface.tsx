'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// ── System prompt ──────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a helpful assistant.`

// ── Types ────────────────────────────────────────────────────────────────────

type LogLevel = 'info' | 'result' | 'error'

interface LogEntry {
  id: string
  ts: number
  level: LogLevel
  text: string
}

type Tab = 'log' | 'system'

const SESSION_KEY = 'agent-chat-log'

// ── Helpers ──────────────────────────────────────────────────────────────────

const levelStyle: Record<LogLevel, string> = {
  info:   'text-[#8b9ab0]',
  result: 'text-[#c3e88d]',
  error:  'text-[#ff5370]',
}

const levelPrefix: Record<LogLevel, string> = {
  info:   '  ',
  result: '← ',
  error:  '✗ ',
}

// ── Main component ───────────────────────────────────────────────────────────

interface AgentInterfaceProps {
  config: { url: string; key: string; modelId: string }
  prompt: string
}

export default function AgentInterface({ config, prompt }: AgentInterfaceProps) {
  const [tab, setTab] = useState<Tab>('log')
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [running, setRunning] = useState(false)
  const [input, setInput] = useState(prompt)
  const [hasRun, setHasRun] = useState(false)
  const logEndRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Load cached logs from sessionStorage
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(SESSION_KEY)
      if (cached) setLogs(JSON.parse(cached))
    } catch { /* ignore */ }
  }, [])

  const addLog = useCallback((level: LogLevel, text: string) => {
    const entry: LogEntry = { id: crypto.randomUUID(), ts: Date.now(), level, text }
    setLogs(prev => {
      const next = [...prev, entry]
      try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(next.slice(-200))) } catch { /* ignore */ }
      return next
    })
  }, [])

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const clearLogs = () => {
    setLogs([])
    sessionStorage.removeItem(SESSION_KEY)
  }

  const run = async () => {
    if (!config.key) { addLog('error', '请先配置 API Key'); return }
    if (!input.trim()) return

    abortRef.current?.abort()
    abortRef.current = new AbortController()

    setRunning(true)
    setHasRun(true)
    addLog('info', `\u2500\u2500 开始执行 \u2500\u2500`)
    addLog('info', `→ ${input.trim()}`)

    try {
      const res = await fetch('/api/test-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: config.url,
          key: config.key,
          modelId: config.modelId,
          prompt: input.trim(),
        }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        addLog('error', `HTTP ${res.status}: ${await res.text()}`)
        return
      }

      const reader = res.body?.getReader()
      const dec = new TextDecoder()

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = dec.decode(value)
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue
          try {
            const d = JSON.parse(line.slice(6))
            if (d.type === 'thinking_delta') {
              // skip thinking
            } else if (d.type === 'text_delta') {
              addLog('result', d.content)
            } else if (d.type === 'done') {
              addLog('info', `\u2500\u2500 执行完毕 \u2500\u2500`)
            }
          } catch { /* skip malformed */ }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        addLog('error', err.message)
      }
    } finally {
      setRunning(false)
    }
  }

  const stop = () => {
    abortRef.current?.abort()
    setRunning(false)
    addLog('info', '已中止')
  }

  return (
    <div className="flex flex-col h-full font-mono text-sm bg-[#0d1117] rounded-[inherit] overflow-hidden">
      {/* ── macOS title bar ── */}
      <div className="relative flex items-center justify-center px-4 py-2.5 border-b border-[#21262d] shrink-0 bg-[#161b22]">
        <div className="absolute left-4 flex items-center gap-1.5" aria-hidden="true">
          <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
          <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
          <span className="w-3 h-3 rounded-full bg-[#28C840]" />
        </div>
        <span className="text-xs text-[#8b9ab0]">纯文本聊天 — Direct Chat</span>
        {running && (
          <span className="absolute right-4 text-[10px] text-[#f78c6c] animate-pulse">● 运行中</span>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-0 border-b border-[#21262d] bg-[#161b22] shrink-0">
        {(['log', 'system'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs transition-colors border-b-2 ${
              tab === t
                ? 'border-[#58a6ff] text-[#e6edf3]'
                : 'border-transparent text-[#8b9ab0] hover:text-[#e6edf3]'
            }`}
          >
            {t === 'log' ? '执行日志' : '系统提示词'}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">

        {/* Log tab */}
        {tab === 'log' && (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5 min-h-0">
              {logs.length === 0 && (
                <div className="text-[#8b9ab0] text-xs mt-4 text-center select-none">
                  <p className="mb-1">尚无日志</p>
                  <p>在下方输入框发送消息开始对话</p>
                </div>
              )}
              {logs.map(log => (
                <div key={log.id} className={`leading-5 whitespace-pre-wrap break-all ${levelStyle[log.level]}`}>
                  <span className="opacity-40 text-[10px] select-none mr-2">
                    {new Date(log.ts).toLocaleTimeString('zh-CN', { hour12: false })}
                  </span>
                  <span className="opacity-60 select-none">{levelPrefix[log.level]}</span>
                  {log.text}
                </div>
              ))}
              <div ref={logEndRef} />
            </div>

            {/* Input bar */}
            <div className="border-t border-[#21262d] bg-[#161b22] px-3 py-2.5 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[#58a6ff] select-none shrink-0">&gt;&gt;</span>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !running) { e.preventDefault(); run() } }}
                  placeholder="输入消息，Enter 发送…"
                  className="flex-1 bg-transparent outline-none text-[#e6edf3] text-xs placeholder-[#484f58] caret-[#58a6ff]"
                  spellCheck={false}
                />
                <div className="flex items-center gap-1.5 shrink-0">
                  {hasRun && (
                    <button
                      onClick={clearLogs}
                      className="text-[10px] text-[#484f58] hover:text-[#8b9ab0] transition-colors px-1.5 py-1"
                    >
                      清空
                    </button>
                  )}
                  {running ? (
                    <button
                      onClick={stop}
                      className="text-[10px] px-2.5 py-1 rounded bg-[#f78c6c]/20 text-[#f78c6c] hover:bg-[#f78c6c]/30 transition-colors"
                    >
                      停止
                    </button>
                  ) : (
                    <button
                      onClick={run}
                      disabled={!input.trim()}
                      className="text-[10px] px-2.5 py-1 rounded bg-[#58a6ff]/20 text-[#58a6ff] hover:bg-[#58a6ff]/30 transition-colors disabled:opacity-30"
                    >
                      发送
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* System prompt tab */}
        {tab === 'system' && (
          <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
            <div className="text-[10px] text-[#8b9ab0] mb-2 uppercase tracking-widest">System Prompt</div>
            <pre className="text-xs text-[#c3e88d] leading-relaxed whitespace-pre-wrap bg-[#161b22] rounded-lg p-4 border border-[#21262d]">
{SYSTEM_PROMPT}
            </pre>
            <div className="text-[10px] text-[#8b9ab0] mt-5 mb-2 uppercase tracking-widest">说明</div>
            <div className="text-xs text-[#e6edf3] bg-[#161b22] rounded-lg p-4 border border-[#21262d] leading-relaxed space-y-1">
              <p>• 无上下文：每次请求相互独立</p>
              <p>• 无工具调用：纯文本对话</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
