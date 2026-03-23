'use client'

import { TestResult } from './TestRunner'

export default function ResultCard({ result }: { result: TestResult }) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium">{result.test_name}</h3>
        <span className={`text-sm ${result.is_fake ? 'text-red-600' : 'text-green-600'}`}>
          {result.is_fake ? '假' : '真'}
        </span>
      </div>
      <p className="text-sm text-gray-600">{result.detected_model}</p>
      <details className="mt-2">
        <summary className="text-sm text-blue-600 cursor-pointer">查看详情</summary>
        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      </details>
    </div>
  )
}
