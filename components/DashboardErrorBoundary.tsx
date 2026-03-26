'use client'

import { ErrorBoundary } from './ErrorBoundary'
import { FileX, Home } from 'lucide-react'

export function DashboardErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileX className="w-8 h-8 text-orange-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Dashboard Error
            </h1>
            <p className="text-gray-600 mb-6">
              Something went wrong loading this page. Our team has been notified.
            </p>
            <a
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold"
            >
              <Home className="w-5 h-5" />
              Back to Dashboard
            </a>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}
