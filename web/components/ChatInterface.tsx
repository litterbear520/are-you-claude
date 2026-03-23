'use client'

import { useEffect, useRef, useState } from 'react'

interface Message {
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (testId && prompt) {
      runTest()
    }
  }, [testId, prompt])

  const runTest = async () => {
    if (!config.url || !config.key) return

    // Add user message
    setMessages([{ role: 'user', content: prompt }])
    setIsStreaming(true)

    try {
      const response = await fetch('/api/test-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: config.url,
          key: config.key,
          modelId: config.modelId,
          prompt: prompt,
          testId: testId
        })
      })

      if (!response.ok) {
        throw new Error(`API 错误: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      let thinkingContent = ''
      let responseContent = ''
      let currentType: 'thinking' | 'text' | null = null

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.type === 'thinking_delta') {
                currentType = 'thinking'
                thinkingContent += data.content
                setMessages(prev => {
                  const filtered = prev.filter(m => m.role !== 'thinking')
                  return [
                    ...filtered,
                    { role: 'thinking', content: thinkingContent, streaming: true }
                  ]
                })
              } else if (data.type === 'text_delta') {
                currentType = 'text'
                responseContent += data.content
                setMessages(prev => {
                  const filtered = prev.filter(m => !(m.role === 'assistant' && m.streaming))
                  return [
                    ...filtered.filter(m => m.role !== 'thinking' || !m.streaming),
                    ...(thinkingContent ? [{ role: 'thinking' as const, content: thinkingContent }] : []),
                    { role: 'assistant', content: responseContent, streaming: true }
                  ]
                })
              } else if (data.type === 'done') {
                setMessages(prev => {
                  const filtered = prev.filter(m => !m.streaming)
                  return [
                    ...filtered,
                    ...(thinkingContent ? [{ role: 'thinking' as const, content: thinkingContent }] : []),
                    { role: 'assistant', content: responseContent }
                  ]
                })
              }
            } catch (e) {
              console.error('Parse error:', e)
            }
          }
        }
      }
    } catch (error) {
      console.error('Test error:', error)
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `错误: ${error instanceof Error ? error.message : '请求失败'}` }
      ])
    } finally {
      setIsStreaming(false)
      onComplete()
    }
  }

  if (!testId) {
    return (
      <div className="flex items-center justify-center h-full text-center p-8">
        <div>
          <svg className="w-16 h-16 mx-auto mb-4 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3 className="heading-font text-xl text-[var(--text-primary)] mb-2">
            选择一个测试开始
          </h3>
          <p className="text-[var(--text-secondary)]">
            点击左侧的测试卡片来运行测试
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-[var(--border)] bg-[var(--bg-card)]">
        <div className="flex items-center gap-3 mb-2">
          <div className="badge badge-primary">
            测试 #{testId}
          </div>
          <h2 className="heading-font text-xl text-[var(--text-primary)]">
            {testName}
          </h2>
        </div>
        {isStreaming && (
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <div className="spinner" />
            <span>正在运行测试...</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-message ${msg.role}`}>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                {msg.role === 'user' ? (
                  <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)] flex items-center justify-center text-white text-sm font-medium">
                    U
                  </div>
                ) : msg.role === 'thinking' ? (
                  <div className="w-8 h-8 rounded-full bg-[var(--text-tertiary)] flex items-center justify-center text-white text-sm">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[var(--accent-success)] flex items-center justify-center text-white text-sm font-medium">
                    A
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-[var(--text-tertiary)] mb-1 uppercase tracking-wide">
                  {msg.role === 'user' ? '提示词' : msg.role === 'thinking' ? '思考过程' : '模型回复'}
                </div>
                <div className="text-sm text-[var(--text-primary)] whitespace-pre-wrap break-words">
                  {msg.content}
                  {msg.streaming && <span className="streaming-cursor" />}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Expected Answer */}
      {!isStreaming && messages.length > 0 && (
        <div className="p-6 border-t border-[var(--border)] bg-[var(--bg-secondary)]">
          <div className="card p-4 border-l-4 border-[var(--accent-success)]">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-[var(--accent-success)] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <div className="text-sm font-medium text-[var(--accent-success)] mb-1">
                  预期答案
                </div>
                <div className="text-sm text-[var(--text-secondary)]">
                  {expectedAnswer}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
