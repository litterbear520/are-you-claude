'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'thinking'
  content: string
  streaming?: boolean
}

interface ChatInterfaceProps {
  testId: number | null
  testName: string
  prompt: string
  expectedAnswer: string
  config: { url: string; key: string; modelId: string }
  onComplete: () => void
}

function ThinkingBlock({ content, streaming }: { content: string; streaming?: boolean }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="my-3">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
      >
        <svg
          className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-90' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span>{streaming ? '思考中…' : `思考过程 · ${content.length} 字符`}</span>
        {streaming && <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--text-tertiary)] animate-pulse" />}
      </button>
      {open && (
        <div className="mt-2 p-3 rounded-lg bg-[var(--surface-variant)] border border-[var(--border)] text-xs text-[var(--text-secondary)] whitespace-pre-wrap break-words font-mono leading-relaxed max-h-64 overflow-y-auto">
          {content}
        </div>
      )}
    </div>
  )
}

export default function ChatInterface({
  testId,
  testName,
  prompt,
  expectedAnswer,
  config,
  onComplete
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const thinkingRef = useRef('')
  const responseRef = useRef('')
  const rafRef = useRef<number>()

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const flushMessages = useCallback(() => {
    const thinking = thinkingRef.current
    const response = responseRef.current
    setMessages(prev => {
      const base = prev.filter(m => m.role === 'user')
      const next: Message[] = [...base]
      if (thinking) next.push({ id: 'thinking', role: 'thinking', content: thinking, streaming: true })
      if (response) next.push({ id: 'assistant', role: 'assistant', content: response, streaming: true })
      return next
    })
  }, [])

  const scheduleFlush = useCallback(() => {
    if (rafRef.current) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = undefined
      flushMessages()
    })
  }, [flushMessages])

  useEffect(() => {
    if (testId && prompt) {
      runTest()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId, prompt])

  const runTest = async () => {
    if (!config.url || !config.key) return

    thinkingRef.current = ''
    responseRef.current = ''
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = undefined }

    setMessages([{ id: 'user', role: 'user', content: prompt }])
    setIsStreaming(true)

    try {
      const response = await fetch('/api/test-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: config.url, key: config.key, modelId: config.modelId, prompt, testId })
      })

      if (!response.ok) throw new Error(`API 错误: ${response.status}`)

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.type === 'thinking_delta') {
              thinkingRef.current += data.content
              scheduleFlush()
            } else if (data.type === 'text_delta') {
              responseRef.current += data.content
              scheduleFlush()
            } else if (data.type === 'done') {
              if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = undefined }
              const thinking = thinkingRef.current
              const response = responseRef.current
              setMessages(prev => {
                const base = prev.filter(m => m.role === 'user')
                const next: Message[] = [...base]
                if (thinking) next.push({ id: 'thinking', role: 'thinking', content: thinking })
                if (response) next.push({ id: 'assistant', role: 'assistant', content: response })
                return next
              })
              scrollToBottom()
            }
          } catch (e) {
            console.error('Parse error:', e)
          }
        }
      }
    } catch (error) {
      console.error('Test error:', error)
      setMessages(prev => [
        ...prev,
        { id: 'error', role: 'assistant', content: `错误: ${error instanceof Error ? error.message : '请求失败'}` }
      ])
    } finally {
      setIsStreaming(false)
      onComplete()
    }
  }

  if (!testId) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center select-none">
        <div className="w-12 h-12 rounded-2xl bg-[var(--surface-variant)] flex items-center justify-center">
          <svg className="w-6 h-6 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <div>
          <p className="text-[var(--text-primary)] font-medium mb-1">选择一个测试开始</p>
          <p className="text-sm text-[var(--text-tertiary)]">点击左侧的测试卡片来运行测试</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)]">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-xs font-medium text-[var(--text-tertiary)] shrink-0">#{testId}</span>
          <span className="text-sm font-semibold text-[var(--text-primary)] truncate">{testName}</span>
        </div>
        {isStreaming && (
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] shrink-0">
            <span className="inline-flex gap-0.5">
              <span className="w-1 h-1 rounded-full bg-[var(--accent-primary)] animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-1 rounded-full bg-[var(--accent-primary)] animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-1 rounded-full bg-[var(--accent-primary)] animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
            <span>运行中</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6" aria-live="polite" aria-atomic="false">
        {messages.map((msg) => {
          if (msg.role === 'user') {
            return (
              <div key={msg.id} className="flex justify-end">
                <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-tr-sm bg-[var(--accent-primary)] text-white text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {msg.content}
                </div>
              </div>
            )
          }

          if (msg.role === 'thinking') {
            return (
              <div key={msg.id} className="flex justify-start">
                <div className="max-w-[90%]">
                  <ThinkingBlock content={msg.content} streaming={msg.streaming} />
                </div>
              </div>
            )
          }

          return (
            <div key={msg.id} className="flex justify-start gap-3 items-start">
              <img
                src="/claude-jumping.svg"
                alt="Claude"
                className="shrink-0 w-7 h-auto mt-0.5"
              />
              <div className="flex-1 text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap break-words">
                {msg.content}
                {msg.streaming && <span className="streaming-cursor" />}
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Expected Answer */}
      {!isStreaming && messages.some(m => m.role === 'assistant') && (
        <div className="px-5 py-3 border-t border-[var(--border)]">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-[var(--accent-success)] shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <span className="text-xs font-medium text-[var(--accent-success)]">预期答案　</span>
              <span className="text-xs text-[var(--text-secondary)]">{expectedAnswer}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
