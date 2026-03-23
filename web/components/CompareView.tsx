'use client'

import { TestResult } from './TestRunner'

export default function CompareView({ result }: { result: TestResult }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white rounded-xl shadow p-4">
        <h3 className="font-medium mb-2">被测 API 回复</h3>
        {result.thinking && (
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">思考过程:</p>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
              {result.thinking}
            </pre>
          </div>
        )}
        <div>
          <p className="text-xs text-gray-500 mb-1">回复:</p>
          <pre className="text-sm bg-gray-50 p-2 rounded overflow-auto max-h-60">
            {result.response}
          </pre>
        </div>
      </div>
      <div className="bg-blue-50 rounded-xl shadow p-4">
        <h3 className="font-medium mb-2">预期特征</h3>
        <pre className="text-sm overflow-auto">
          {JSON.stringify(result.details?.expected || {}, null, 2)}
        </pre>
      </div>
    </div>
  )
}
