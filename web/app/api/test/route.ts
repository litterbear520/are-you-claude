import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { url, key, modelId, testType, testIds } = await req.json()

    if (!url || !key || !modelId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Placeholder - returns mock results. Real implementation in Task 4.
    const mockResults = (testIds || [1]).map((id: number) => ({
      test_id: id,
      test_name: `Test ${id}`,
      prompt: '',
      response: 'Mock response - real implementation in Task 4',
      thinking: '',
      detected_model: '待实现',
      is_fake: false,
      fake_indicators: {},
      details: {}
    }))

    return NextResponse.json({ results: mockResults })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
