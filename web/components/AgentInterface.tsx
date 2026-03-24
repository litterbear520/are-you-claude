'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

type LogLevel = 'info' | 'result' | 'error'

interface LogEntry {
  id: string
  ts: number
  level: LogLevel
  text: string
}

const SESSION_KEY = 'agent-chat-log'

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

interface AgentInterfaceProps {
  config: { url: string; key: string; modelId: string }
  prompt: string
}

export default function AgentInterface({ config, prompt }: AgentInterfaceProps) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [running, setRunning] = useState(false)
  const [input, setInput] = useState(prompt)
  const logEndRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

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
              // skip
            } else if (d.type === 'text_delta') {
              addLog('result', d.content)
            }
          } catch { /* skip */ }
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
  }

  return (
    <div className="flex flex-col h-full font-mono text-sm bg-[#0d1117] rounded-[inherit] overflow-hidden">
      <div className="relative flex items-center justify-center px-4 py-2.5 border-b border-[#21262d] shrink-0 bg-[#161b22]">
        <div className="absolute left-4 flex items-center gap-1.5" aria-hidden="true">
          <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
          <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
          <span className="w-3 h-3 rounded-full bg-[#28C840]" />
        </div>
        <span className="text-xs text-[#8b9ab0]">Direct Chat</span>
        {running && (
          <span className="absolute right-4 text-[10px] text-[#f78c6c] animate-pulse">●</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5 min-h-0">
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

      <div className="border-t border-[#21262d] bg-[#161b22] px-3 py-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[#58a6ff] select-none shrink-0">&gt;&gt;</span>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !running) { e.preventDefault(); run() } }}
            className="flex-1 bg-transparent outline-none text-[#e6edf3] text-xs placeholder-[#484f58] caret-[#58a6ff]"
            spellCheck={false}
          />
          {logs.length > 0 && (
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
  )
}
