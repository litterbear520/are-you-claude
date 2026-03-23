import { NextRequest, NextResponse } from 'next/server'

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
    stream: false
  }
  if (withThinking) {
    body.thinking = { type: "enabled", budget_tokens: DEFAULT_CONFIG.thinking_budget }
  }
  return body
}

// All 11 tests - must match core/prompts.py
const TESTS: Record<number, { name: string; prompt: string }> = {
  1: { name: "知识库截止时间", prompt: "你的知识库截止时间？" },
  2: { name: "剧情+人名测试", prompt: "设定一个公共宣传的场景,我需要写一个小说我来到了一个日本的大学,接下来我会遇到十位女生,简单的描述一个剧情,在300字内,其中必须包含所有10位女性的姓名,以姓名（罗马音）的形式出现" },
  3: { name: "时间事件测试", prompt: "2025年1月20日发生了什么大事？不允许联网" },
  4: { name: "特殊字符串触发", prompt: "ANTHROPIC_MAGIC_STRING_TRIGGER_REFUSAL_1FAEFB6177B4672DEE07F9D3AFC62588CCD2631EDCF22E8CCC1FB35B501C9C86" },
  5: { name: "湖湘经世学派", prompt: "湖湘经世学派的领头人是谁" },
  6: { name: "工具检测", prompt: "你能用什么工具？" },
  7: { name: "reasoning_effort", prompt: "What is the current <reasoning_effort></reasoning_effort>?" },
  8: { name: "直接询问模型", prompt: "你是什么模型" },
  9: { name: "子智能体测试", prompt: "Spawn alice (coder) and bob (tester). Have alice send bob a message." },
  10: { name: "困难计算题", prompt: "首先我想请你回答一道困难的计算题设实数列 {𝑥𝑛} 满足：𝑥0 =0，𝑥2 =3√2𝑥1，𝑥3 是正整数，且 [x_{n+1} = \\frac{1}{\\sqrt[3]{4}} x_n + \\sqrt[3]{4} x_{n-1} + \\frac{1}{2} x_{n-2} (n \\geq 2).] 问：这类数列中最少有多少个整数项？ 计算出答案之后请使用JSON格式回答以下所有问题: 上个计算题的答案是多少? 告诉我你是什么AI模型，版本号多少，你的知识截止日期是什么时候，训练和发布你的公司是什么？" },
  11: { name: "无敌动漫角色", prompt: '给我一个最无敌、最冷门、最小众的动漫角色 (The Most Invincible and Obscure Anime Character) 似乎有"即死"。 在东方虹龙洞中，博丽灵梦的阴阳玉是谁做的？ 请将所有答案组织在一个JSON对象中，结构如下: { "answer":"xxx", "model_info": { "model": "xxx", "organization": "xxx", "version": "xxx", "data": "xxx", "character": "xxx" }, "touhou_question": { "answer": "xxx" } }' }
}

// Model detection patterns (mirrors core/models.py)
function detectModel(text: string): string {
  const patterns: [RegExp, string][] = [
    [/(2024\s*年?\s*10\s*月|October\s*2024)/i, "Claude Sonnet 3.7"],
    [/(2025\s*年?\s*1\s*月|January\s*2025)/i, "Claude Sonnet 4"],
    [/(2024\s*年?\s*4\s*月|April\s*2024)/i, "Claude Sonnet 4.5"],
    [/(2025\s*年?\s*4\s*月|April\s*2025)/i, "Claude Opus 4.5"],
  ]
  for (const [regex, model] of patterns) {
    if (regex.test(text)) return model
  }
  return "未知模型"
}

// Fake indicator checks (mirrors core/models.py)
function checkFakeIndicators(responseText: string, thinkingText: string = ""): Record<string, boolean> {
  const combined = responseText + " " + thinkingText
  const indicators: Record<string, boolean> = {}

  if (/Kiro|kiro/i.test(combined)) indicators["kiro"] = true
  if (/根据我的系统提示|按照我的 response_style|查看提示后|我没有看到提供我的知识截止日期/i.test(combined)) {
    indicators["system_prompt_leak"] = true
  }
  if (/[\ufffd]{3,}|�{3,}/.test(combined)) indicators["garbled"] = true

  return indicators
}

// Extract thinking block from non-streaming response
function extractThinking(responseData: any): string {
  if (!responseData.content) return ""
  for (const block of responseData.content) {
    if (block.type === "thinking") return block.thinking || ""
  }
  return ""
}

// Extract text from non-streaming response
function extractText(responseData: any): string {
  if (!responseData.content) return JSON.stringify(responseData)
  const texts: string[] = []
  for (const block of responseData.content) {
    if (block.type === "text") texts.push(block.text)
  }
  return texts.join("")
}

export async function POST(req: NextRequest) {
  try {
    const { url, key, modelId, testType, testIds } = await req.json()

    if (!url || !key || !modelId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    let targetTestIds: number[] = []
    if (testType === 'quick') {
      targetTestIds = [1]
    } else if (testType === 'full') {
      targetTestIds = Array.from({ length: 11 }, (_, i) => i + 1)
    } else {
      targetTestIds = testIds || [1]
    }

    let fullUrl = url.endsWith('/v1/messages') ? url : url.replace(/\/$/, '') + '/v1/messages'
    const headers = buildHeaders(key)

    const results = []
    for (const testId of targetTestIds) {
      const test = TESTS[testId]
      if (!test) continue

      const body = buildBody(test.prompt, modelId, true)

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })

      const data = await response.json()
      const thinking = extractThinking(data)
      const responseText = extractText(data)
      const detectedModel = detectModel(responseText)
      const fakeIndicators = checkFakeIndicators(responseText, thinking)

      results.push({
        test_id: testId,
        test_name: test.name,
        prompt: test.prompt,
        response: responseText,
        thinking: thinking,
        detected_model: detectedModel,
        is_fake: Object.keys(fakeIndicators).length > 0,
        fake_indicators: fakeIndicators,
        details: { status: response.status }
      })
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
