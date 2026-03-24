import { NextRequest, NextResponse } from 'next/server'

// Extend Vercel serverless function timeout to 300 seconds
export const maxDuration = 300

const DEFAULT_CONFIG = {
  max_tokens: 32000,
  thinking_budget: 31999
}

function buildHeaders(apiKey: string) {
  return {
    "accept": "application/json",
    "anthropic-beta": "claude-code-20250219,interleaved-thinking-2025-05-14",
    "anthropic-dangerous-direct-browser-access": "true",
    "anthropic-version": "2023-06-01",
    "authorization": `Bearer ${apiKey}`,
    "content-type": "application/json",
    "user-agent": "claude-cli/2.0.76 (external, cli)",
  }
}

function buildBody(message: string, modelId: string, withThinking: boolean = true) {
  const body: Record<string, unknown> = {
    model: modelId,
    messages: [{
      role: "user",
      content: [
        { type: "text", text: "null" },
        { type: "text", text: "null" },
        { type: "text", text: message, cache_control: { type: "ephemeral" } }
      ]
    }],
    system: [{ type: "text", text: "null", cache_control: { type: "ephemeral" } }],
    metadata: {
      user_id: "user_82a10c807646e5141d2ffcbf5c6d439ee4cfd99d1903617b7b69e3a5c03b1dbf_account__session_74673a26-ea49-47f4-a8ed-27f9248f231f"
    },
    max_tokens: DEFAULT_CONFIG.max_tokens,
    stream: true
  }
  if (withThinking) {
    body.thinking = { type: "enabled", budget_tokens: DEFAULT_CONFIG.thinking_budget }
  }
  return body
}

export async function POST(request: NextRequest) {
  try {
    const { url, key, modelId, prompt, testId } = await request.json()

    if (!url || !key || !modelId || !prompt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const headers = buildHeaders(key)
    const body = buildBody(prompt, modelId, true)

    const response = await fetch(`${url}/v1/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ error: `API error: ${response.status} - ${errorText}` }, { status: response.status })
    }

    // Create a TransformStream to process SSE and convert to our format
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        if (!reader) {
          controller.close()
          return
        }

        let buffer = ''

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim()

                if (data === '[DONE]') {
                  controller.enqueue(encoder.encode('data: ' + JSON.stringify({ type: 'done' }) + '\n\n'))
                  continue
                }

                try {
                  const parsed = JSON.parse(data)

                  if (parsed.type === 'content_block_delta') {
                    if (parsed.delta?.type === 'thinking_delta') {
                      controller.enqueue(encoder.encode('data: ' + JSON.stringify({
                        type: 'thinking_delta',
                        content: parsed.delta.thinking || ''
                      }) + '\n\n'))
                    } else if (parsed.delta?.type === 'text_delta') {
                      controller.enqueue(encoder.encode('data: ' + JSON.stringify({
                        type: 'text_delta',
                        content: parsed.delta.text || ''
                      }) + '\n\n'))
                    }
                  } else if (parsed.type === 'message_stop') {
                    controller.enqueue(encoder.encode('data: ' + JSON.stringify({ type: 'done' }) + '\n\n'))
                  }
                } catch (e) {
                  console.error('Parse error:', e)
                }
              }
            }
          }
        } catch (error) {
          console.error('Stream error:', error)
          controller.error(error)
        } finally {
          controller.close()
        }
      }
    })

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Request error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
