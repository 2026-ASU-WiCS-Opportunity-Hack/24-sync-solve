'use client'

import { Component, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div
          role="alert"
          className="mx-auto flex max-w-lg flex-col items-center justify-center rounded-2xl border border-red-100 bg-white px-6 py-14 text-center shadow-sm"
        >
          <AlertTriangle size={40} className="text-wial-red mb-4" aria-hidden="true" />
          <h2 className="text-wial-navy text-lg font-semibold">Something went wrong</h2>
          <p className="mt-2 text-sm text-gray-500">Please refresh the page or try again later.</p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="bg-wial-navy hover:bg-wial-navy-dark mt-5 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
          >
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
