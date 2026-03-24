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
  const [open, setOpen] = useState(true)
  const bodyRef = useRef<HTMLDivElement>(null)

  // Auto-scroll thinking content to bottom while streaming
  useEffect(() => {
    if (streaming && open && bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight
    }
  }, [content, streaming, open])

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
        <div ref={bodyRef} className="mt-2 p-3 rounded-lg bg-[var(--surface-variant)] border border-[var(--border)] text-xs text-[var(--text-secondary)] whitespace-pre-wrap break-words font-mono leading-relaxed max-h-64 overflow-y-auto">
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
  const [inputValue, setInputValue] = useState('')
  const [activeTestName, setActiveTestName] = useState('')
  const [activeExpected, setActiveExpected] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const thinkingRef = useRef('')
  const responseRef = useRef('')
  const rafRef = useRef<number>()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  // Use ref to track streaming state to avoid stale closures in useCallback
  const isStreamingRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const flushMessages = useCallback((baseMessages: Message[]) => {
    const thinking = thinkingRef.current
    const response = responseRef.current
    setMessages(() => {
      const next: Message[] = [...baseMessages]
      if (thinking) next.push({ id: 'thinking', role: 'thinking', content: thinking, streaming: true })
      if (response) next.push({ id: 'assistant', role: 'assistant', content: response, streaming: true })
      return next
    })
  }, [])

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px'
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (inputValue.trim() && !isStreamingRef.current) {
        sendMessage(inputValue.trim())
      }
    }
  }

  const sendMessage = useCallback(async (text: string) => {
    if (!config.url || !config.key || isStreamingRef.current) return

    isStreamingRef.current = true
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    setInputValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    thinkingRef.current = ''
    responseRef.current = ''
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = undefined }

    const userMsg: Message = { id: `user-${Date.now()}`, role: 'user', content: text }
    const baseMessages = [userMsg]
    setMessages(baseMessages)
    setIsStreaming(true)

    // Track whether we received a proper 'done' event
    let receivedDone = false

    try {
      const response = await fetch('/api/test-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: config.url, key: config.key, modelId: config.modelId, prompt: text, testId: null }),
        signal: abortController.signal
      })

      if (!response.ok) throw new Error(`API 错误: ${response.status}`)

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.type === 'thinking_delta') {
              thinkingRef.current += data.content
              if (rafRef.current) cancelAnimationFrame(rafRef.current)
              rafRef.current = requestAnimationFrame(() => {
                rafRef.current = undefined
                flushMessages(baseMessages)
                scrollToBottom()
              })
            } else if (data.type === 'text_delta') {
              responseRef.current += data.content
              if (rafRef.current) cancelAnimationFrame(rafRef.current)
              rafRef.current = requestAnimationFrame(() => {
                rafRef.current = undefined
                flushMessages(baseMessages)
                scrollToBottom()
              })
            } else if (data.type === 'done') {
              receivedDone = true
              if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = undefined }
              const thinking = thinkingRef.current
              const resp = responseRef.current
              setMessages(() => {
                const next: Message[] = [...baseMessages]
                if (thinking) next.push({ id: 'thinking', role: 'thinking', content: thinking })
                if (resp) next.push({ id: 'assistant', role: 'assistant', content: resp })
                return next
              })
              scrollToBottom()
            }
          } catch (e) {
            console.error('Parse error:', e)
          }
        }
      }

      // Fallback: if stream ended without a 'done' event (e.g. timeout/truncation),
      // commit whatever we have so the UI doesn't get stuck
      if (!receivedDone) {
        if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = undefined }
        const thinking = thinkingRef.current
        const resp = responseRef.current
        if (thinking || resp) {
          setMessages(() => {
            const next: Message[] = [...baseMessages]
            if (thinking) next.push({ id: 'thinking', role: 'thinking', content: thinking })
            if (resp) next.push({ id: 'assistant', role: 'assistant', content: resp })
            return next
          })
          scrollToBottom()
        }
      }
    } catch (error) {
      // Ignore abort errors — user intentionally stopped, partial content already committed
      if (error instanceof Error && error.name === 'AbortError') {
        if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = undefined }
        const thinking = thinkingRef.current
        const resp = responseRef.current
        if (thinking || resp) {
          setMessages(() => {
            const next: Message[] = [...baseMessages]
            if (thinking) next.push({ id: 'thinking', role: 'thinking', content: thinking })
            if (resp) next.push({ id: 'assistant', role: 'assistant', content: resp })
            return next
          })
        }
      } else {
        console.error('Test error:', error)
        // On error, still commit partial content if we have any
        if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = undefined }
        const thinking = thinkingRef.current
        const resp = responseRef.current
        if (thinking || resp) {
          setMessages(() => {
            const next: Message[] = [...baseMessages]
            if (thinking) next.push({ id: 'thinking', role: 'thinking', content: thinking })
            if (resp) next.push({ id: 'assistant', role: 'assistant', content: resp })
            return next
          })
        } else {
          setMessages(prev => [
            ...prev,
            { id: 'error', role: 'assistant', content: `错误: ${error instanceof Error ? error.message : '请求失败'}` }
          ])
        }
      }
    } finally {
      isStreamingRef.current = false
      abortControllerRef.current = null
      setIsStreaming(false)
      onComplete()
    }
  }, [config, flushMessages, scrollToBottom, onComplete])

  // Run test when testId/prompt changes
  useEffect(() => {
    if (testId && prompt) {
      setActiveTestName(testName)
      setActiveExpected(expectedAnswer)
      setMessages([])
      sendMessage(prompt)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId, prompt])

  const handleNewChat = () => {
    setMessages([])
    setActiveTestName('')
    setActiveExpected('')
    thinkingRef.current = ''
    responseRef.current = ''
  }

  const handleAbort = useCallback(() => {
    abortControllerRef.current?.abort()
  }, [])

  const isEmpty = messages.length === 0 && !isStreaming

  return (
    <div className="flex flex-col h-full">
      {/* macOS-style title bar */}
      <div className="relative flex items-center justify-center px-4 py-3 border-b border-[var(--border)] shrink-0">
        <div className="absolute left-4 flex items-center gap-1.5" aria-hidden="true">
          <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
          <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
          <span className="w-3 h-3 rounded-full bg-[#28C840]" />
        </div>
        <span className="text-xs font-medium text-[var(--text-secondary)] truncate max-w-[60%]">
          {activeTestName || '无上下文对话'}
        </span>
        <div className="absolute right-4 flex items-center gap-2">
          {isStreaming && (
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
              <span className="inline-flex gap-0.5">
                <span className="w-1 h-1 rounded-full bg-[var(--accent-primary)] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-1 rounded-full bg-[var(--accent-primary)] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-1 rounded-full bg-[var(--accent-primary)] animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
              <span>运行中</span>
            </div>
          )}
          {!isEmpty && (
            <button
              onClick={handleNewChat}
              className="icon-btn w-7 h-7 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              title="新对话"
              aria-label="新对话"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6" aria-live="polite" aria-atomic="false">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center select-none">
            <img src="/claude-pointing.svg" alt="Claude" className="w-12 h-auto opacity-40" />
            <div>
              <p className="text-[var(--text-primary)] font-medium mb-1">直接输入或选择测试</p>
              <p className="text-sm text-[var(--text-tertiary)]">无系统提示词、无上下文的纯净对话</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            if (msg.role === 'user') {
              return (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-tr-sm bg-[var(--surface-variant)] border border-[var(--border)] text-[var(--text-primary)] text-sm leading-relaxed whitespace-pre-wrap break-words">
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
                <img src="/claude-jumping.svg" alt="Claude" className="shrink-0 w-7 h-auto mt-0.5" />
                <div className="flex-1 text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap break-words">
                  {msg.content}
                  {msg.streaming && <span className="streaming-cursor" />}
                </div>
              </div>
            )
          })
        )}
        {/* Jumping Claude indicator while waiting for first response token */}
        {isStreaming && messages.length <= 1 && (
          <div className="flex justify-start gap-3 items-end">
            <img src="/claude-jumping.svg" alt="思考中" className="w-10 h-auto" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Expected answer (only for tests) */}
      {activeExpected && !isStreaming && messages.some(m => m.role === 'assistant') && (
        <div className="px-5 py-2.5 border-t border-[var(--border)]">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-[var(--accent-success)] shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <span className="text-xs font-medium text-[var(--accent-success)]">预期答案　</span>
              <span className="text-xs text-[var(--text-secondary)]">{activeExpected}</span>
            </div>
          </div>
        </div>
      )}

      {/* Input area — Claude Code style */}
      <div className="px-4 pb-4 pt-2 shrink-0">
        <div className={`flex items-end gap-2 rounded-2xl border px-4 py-3 transition-colors ${
          isStreaming ? 'border-[var(--border)]' : 'border-[var(--border)] focus-within:border-[var(--accent-primary)]'
        } bg-[var(--surface-variant)]`}>
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={config.key ? '输入消息… (Enter 发送，Shift+Enter 换行)' : '请先配置 API Key'}
            disabled={isStreaming || !config.key}
            rows={1}
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] resize-none outline-none focus:outline-none focus-visible:outline-none leading-relaxed disabled:opacity-50"
            style={{ maxHeight: '200px' }}
          />
          {isStreaming ? (
            <button
              onClick={handleAbort}
              className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-colors bg-[var(--accent-danger)] text-white hover:opacity-90"
              aria-label="停止响应"
              title="停止响应"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <rect x="5" y="5" width="14" height="14" rx="2" />
              </svg>
            </button>
          ) : (
            <button
              onClick={() => { if (inputValue.trim()) sendMessage(inputValue.trim()) }}
              disabled={!inputValue.trim() || !config.key}
              className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-colors disabled:opacity-30 bg-[var(--accent-primary)] text-white hover:opacity-90 disabled:cursor-not-allowed"
              aria-label="发送"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
        <p className="text-center text-[10px] text-[var(--text-tertiary)] mt-2">
          无系统提示词 · 无上下文 · 纯净请求
        </p>
      </div>
    </div>
  )
}
