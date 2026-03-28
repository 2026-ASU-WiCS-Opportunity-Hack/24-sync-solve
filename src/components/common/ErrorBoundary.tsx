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
        <div role="alert" className="flex flex-col items-center justify-center py-16 text-center">
          <AlertTriangle size={40} className="text-wial-red mb-4" aria-hidden="true" />
          <h2 className="text-wial-navy text-lg font-semibold">Something went wrong</h2>
          <p className="mt-2 text-sm text-gray-500">Please refresh the page or try again later.</p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="bg-wial-navy hover:bg-wial-navy-dark mt-4 rounded-lg px-4 py-2 text-sm font-medium text-white"
          >
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
