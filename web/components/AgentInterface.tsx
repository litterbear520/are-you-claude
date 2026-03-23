'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// ── System prompt and tools mirrored from cli/agent.py ──────────────────────

const LEAD_SYSTEM = `You are a team lead. Spawn teammates and communicate via inboxes.`

const LEAD_TOOLS = [
  {
    name: 'bash',
    description: 'Run a shell command.',
    input_schema: {
      type: 'object',
      properties: { command: { type: 'string', description: 'Shell command to execute' } },
      required: ['command'],
    },
  },
  {
    name: 'read_file',
    description: 'Read file contents.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Relative file path' },
        limit: { type: 'integer', description: 'Max lines to return' },
      },
      required: ['path'],
    },
  },
  {
    name: 'write_file',
    description: 'Write content to file.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        content: { type: 'string' },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'edit_file',
    description: 'Replace exact text in file.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        old_text: { type: 'string' },
        new_text: { type: 'string' },
      },
      required: ['path', 'old_text', 'new_text'],
    },
  },
  {
    name: 'spawn_teammate',
    description: 'Spawn a persistent teammate that runs in its own thread.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Teammate name (e.g. alice)' },
        role: { type: 'string', description: 'Role description' },
        prompt: { type: 'string', description: 'Initial task prompt' },
      },
      required: ['name', 'role', 'prompt'],
    },
  },
  {
    name: 'list_teammates',
    description: 'List all teammates with name, role, status.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'send_message',
    description: "Send a message to a teammate's inbox.",
    input_schema: {
      type: 'object',
      properties: {
        to: { type: 'string' },
        content: { type: 'string' },
        msg_type: {
          type: 'string',
          enum: ['message', 'broadcast', 'shutdown_request', 'shutdown_response', 'plan_approval_response'],
        },
      },
      required: ['to', 'content'],
    },
  },
  {
    name: 'read_inbox',
    description: "Read and drain the lead's inbox.",
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'broadcast',
    description: 'Send a message to all teammates.',
    input_schema: {
      type: 'object',
      properties: { content: { type: 'string' } },
      required: ['content'],
    },
  },
]

const TEAMMATE_TOOLS = LEAD_TOOLS.filter(t =>
  ['bash', 'read_file', 'write_file', 'edit_file', 'send_message', 'read_inbox'].includes(t.name)
)

// ── Types ────────────────────────────────────────────────────────────────────

type LogLevel = 'info' | 'tool' | 'result' | 'warn' | 'error' | 'spawn' | 'msg'

interface LogEntry {
  id: string
  ts: number
  level: LogLevel
  text: string
}

type Tab = 'log' | 'system' | 'tools'

const SESSION_KEY = 'agent-test-log'

// ── Helpers ──────────────────────────────────────────────────────────────────

const levelStyle: Record<LogLevel, string> = {
  info:   'text-[#8b9ab0]',
  tool:   'text-[#c792ea]',
  result: 'text-[#c3e88d]',
  warn:   'text-[#f78c6c]',
  error:  'text-[#ff5370]',
  spawn:  'text-[#89ddff]',
  msg:    'text-[#ffcb6b]',
}

const levelPrefix: Record<LogLevel, string> = {
  info:   '  ',
  tool:   '⟩ ',
  result: '← ',
  warn:   '! ',
  error:  '✗ ',
  spawn:  '⊕ ',
  msg:    '✉ ',
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
  const [selectedTool, setSelectedTool] = useState<typeof LEAD_TOOLS[0] | null>(null)
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
          testId: 9,
          agentMode: true,
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
              // skip thinking in agent mode
            } else if (d.type === 'text_delta') {
              addLog('result', d.content)
            } else if (d.type === 'tool_use') {
              addLog('tool', `${d.name}(${JSON.stringify(d.input).slice(0, 120)})`)
              if (d.name === 'spawn_teammate') addLog('spawn', `生成子智能体: ${d.input?.name ?? '?'} (${d.input?.role ?? ''})`)
              if (d.name === 'send_message') addLog('msg', `→ ${d.input?.to}: ${String(d.input?.content ?? '').slice(0, 80)}`)
            } else if (d.type === 'tool_result') {
              addLog('result', `← ${String(d.content ?? '').slice(0, 160)}`)
              if (String(d.content ?? '').toLowerCase().includes('kiro')) {
                addLog('warn', '⚠️ 检测到 "Kiro" 字样 → 疑似非官方 Claude')
              }
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
    addLog('warn', '已中止')
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
        <span className="text-xs text-[#8b9ab0]">子智能体测试 — Agent Mode</span>
        {running && (
          <span className="absolute right-4 text-[10px] text-[#f78c6c] animate-pulse">● 运行中</span>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-0 border-b border-[#21262d] bg-[#161b22] shrink-0">
        {(['log', 'system', 'tools'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs transition-colors border-b-2 ${
              tab === t
                ? 'border-[#58a6ff] text-[#e6edf3]'
                : 'border-transparent text-[#8b9ab0] hover:text-[#e6edf3]'
            }`}
          >
            {t === 'log' ? '执行日志' : t === 'system' ? '系统提示词' : '工具列表'}
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
                  <p>在下方输入框发送指令以启动测试</p>
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
                <span className="text-[#58a6ff] select-none shrink-0">s09 &gt;&gt;</span>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !running) { e.preventDefault(); run() } }}
                  placeholder="输入指令，Enter 执行…"
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
                      执行
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
            <div className="text-[10px] text-[#8b9ab0] mb-2 uppercase tracking-widest">Lead Agent System Prompt</div>
            <pre className="text-xs text-[#c3e88d] leading-relaxed whitespace-pre-wrap bg-[#161b22] rounded-lg p-4 border border-[#21262d]">
{LEAD_SYSTEM}
            </pre>
            <div className="text-[10px] text-[#8b9ab0] mt-5 mb-2 uppercase tracking-widest">Teammate Agent System Prompt (template)</div>
            <pre className="text-xs text-[#89ddff] leading-relaxed whitespace-pre-wrap bg-[#161b22] rounded-lg p-4 border border-[#21262d]">
{`You are '{name}', role: {role}.
Use send_message to communicate. Complete your task.`}
            </pre>
            <div className="text-[10px] text-[#8b9ab0] mt-5 mb-2 uppercase tracking-widest">检测逻辑</div>
            <div className="text-xs text-[#e6edf3] bg-[#161b22] rounded-lg p-4 border border-[#21262d] leading-relaxed space-y-1">
              <p>• 观察 <code className="text-[#c792ea]">send_message</code> 的内容中是否出现 <code className="text-[#ff5370]">"Hey Kiro"</code></p>
              <p>• 真实 Claude 称主智能体为 <code className="text-[#c3e88d]">"user"</code> 或 <code className="text-[#c3e88d]">"主智能体"</code></p>
              <p>• 若出现 Kiro / AWS Kiro 等字样，判定为非官方 Claude</p>
            </div>
          </div>
        )}

        {/* Tools tab */}
        {tab === 'tools' && (
          <div className="flex h-full min-h-0 overflow-hidden">
            {/* Tool list */}
            <div className="w-44 shrink-0 border-r border-[#21262d] overflow-y-auto py-2">
              <div className="text-[9px] text-[#484f58] px-3 py-1 uppercase tracking-widest mb-1">Lead (9)</div>
              {LEAD_TOOLS.map(t => (
                <button
                  key={t.name}
                  onClick={() => setSelectedTool(t)}
                  className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                    selectedTool?.name === t.name
                      ? 'bg-[#58a6ff]/10 text-[#58a6ff]'
                      : 'text-[#8b9ab0] hover:text-[#e6edf3]'
                  }`}
                >
                  {t.name}
                </button>
              ))}
              <div className="text-[9px] text-[#484f58] px-3 py-1 uppercase tracking-widest mt-2 mb-1">Teammate (6)</div>
              {TEAMMATE_TOOLS.map(t => (
                <button
                  key={`tm-${t.name}`}
                  onClick={() => setSelectedTool(t)}
                  className={`w-full text-left px-3 py-1.5 text-xs transition-colors opacity-60 ${
                    selectedTool?.name === t.name
                      ? 'bg-[#58a6ff]/10 text-[#58a6ff] opacity-100'
                      : 'text-[#8b9ab0] hover:text-[#e6edf3] hover:opacity-100'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>

            {/* Schema viewer */}
            <div className="flex-1 overflow-y-auto px-4 py-3 min-w-0">
              {selectedTool ? (
                <>
                  <div className="text-xs text-[#c792ea] font-bold mb-1">{selectedTool.name}</div>
                  <div className="text-xs text-[#8b9ab0] mb-3 leading-relaxed">{selectedTool.description}</div>
                  <div className="text-[10px] text-[#484f58] uppercase tracking-widest mb-2">input_schema</div>
                  <pre className="text-[11px] text-[#e6edf3] bg-[#161b22] rounded-lg p-3 border border-[#21262d] overflow-x-auto leading-relaxed">
                    {JSON.stringify(selectedTool.input_schema, null, 2)}
                  </pre>
                </>
              ) : (
                <div className="text-xs text-[#484f58] mt-6 text-center select-none">
                  点击左侧工具查看 JSON Schema
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
