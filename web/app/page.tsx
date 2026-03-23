'use client'

import { useState } from 'react'
import TestForm from '@/components/TestForm'
import TestRunner from '@/components/TestRunner'
import { TestResult } from '@/components/TestRunner'

export default function Home() {
  const [config, setConfig] = useState<{url: string, key: string, modelId: string} | null>(null)
  const [results, setResults] = useState<TestResult[] | null>(null)
  const [running, setRunning] = useState(false)

  const handleTest = async (testType: 'quick' | 'full', testIds?: number[]) => {
    if (!config) return
    setRunning(true)
    setResults(null)

    try {
      const res = await fetch('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: config.url,
          key: config.key,
          modelId: config.modelId,
          testType,
          testIds: testIds || [1]
        })
      })
      const data = await res.json()
      setResults(data.results || [])
    } catch (err) {
      console.error(err)
    } finally {
      setRunning(false)
    }
  }

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-2">Are You Claude?</h1>
      <p className="text-center text-gray-600 mb-8">测试你的 API 是否是真正的 Claude</p>

      <TestForm onSubmit={(cfg) => setConfig(cfg)} />

      {config && (
        <div className="mt-6 flex gap-4 justify-center">
          <button
            onClick={() => handleTest('quick')}
            disabled={running}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            快速检测
          </button>
          <button
            onClick={() => handleTest('full')}
            disabled={running}
            className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50"
          >
            完整检测 (11项)
          </button>
        </div>
      )}

      {running && <p className="text-center mt-6">测试中...</p>}

      {results && <TestRunner results={results} />}
    </main>
  )
}
