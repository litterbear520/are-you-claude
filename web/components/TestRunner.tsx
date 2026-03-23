'use client'

import { useState } from 'react'

export interface TestResult {
  test_id: number
  test_name: string
  prompt: string
  response: string
  thinking: string
  detected_model: string
  is_fake: boolean
  fake_indicators: Record<string, boolean>
  details: Record<string, unknown>
}

export default function TestRunner({ results }: { results: TestResult[] }) {
  const [expanded, setExpanded] = useState<number | null>(null)

  const getStatusColor = (result: TestResult) => {
    if (result.is_fake) return 'text-red-600'
    if (result.detected_model !== '未知模型' && result.detected_model !== '待实现') return 'text-green-600'
    return 'text-yellow-600'
  }

  return (
    <div className="mt-8 space-y-4">
      <h2 className="text-xl font-semibold">测试结果</h2>
      {results.map((result) => (
        <div key={result.test_id} className="bg-white rounded-xl shadow overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === result.test_id ? null : result.test_id)}
            className="w-full px-4 py-3 flex justify-between items-center hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <span className="font-medium">#{result.test_id}</span>
              <span>{result.test_name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className={getStatusColor(result)}>
                {result.is_fake ? '假' : result.detected_model !== '未知模型' && result.detected_model !== '待实现' ? '真' : '未知'}
              </span>
              <span className="text-gray-400">{expanded === result.test_id ? '−' : '+'}</span>
            </div>
          </button>
          {expanded === result.test_id && (
            <div className="px-4 py-3 border-t space-y-3">
              {result.thinking && (
                <div className="bg-gray-100 rounded p-3">
                  <p className="text-xs text-gray-500 mb-1">思考过程:</p>
                  <pre className="text-sm whitespace-pre-wrap font-mono">{result.thinking}</pre>
                </div>
              )}
              <div className="bg-gray-50 rounded p-3">
                <p className="text-xs text-gray-500 mb-1">回复:</p>
                <pre className="text-sm whitespace-pre-wrap">{result.response}</pre>
              </div>
              {Object.keys(result.fake_indicators).length > 0 && (
                <div className="text-red-600 text-sm">
                  假模型特征: {Object.entries(result.fake_indicators).map(([k]) => k).join(', ')}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
