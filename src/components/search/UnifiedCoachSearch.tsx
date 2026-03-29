'use client'

import { useState, useEffect } from 'react'
import { Search, Sparkles, X, ZapOff, Filter } from 'lucide-react'
import { smartMatchCoaches, SmartMatchResult } from '@/features/search/actions/smartMatch'
import { CoachCard } from '@/components/coaches/CoachCard'
import { AILoader } from './AILoader'

interface UnifiedCoachSearchProps {
  onTextSearch: (query: string) => void
  onAISearchModeChange?: (isAIMode: boolean) => void
  textSearchPlaceholder: string
  searchLabel: string
  isTextSearching?: boolean
  currentQuery?: string
}

export function UnifiedCoachSearch({
  onTextSearch,
  onAISearchModeChange,
  textSearchPlaceholder,
  searchLabel,
  isTextSearching = false,
  currentQuery = '',
}: UnifiedCoachSearchProps) {
  const [query, setQuery] = useState(currentQuery)
  const [searchMode, setSearchMode] = useState<'text' | 'ai' | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [aiResult, setAiResult] = useState<SmartMatchResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Sync query with URL params
  useEffect(() => {
    setQuery(currentQuery)
  }, [currentQuery])

  // Notify parent when AI mode changes
  useEffect(() => {
    onAISearchModeChange?.(searchMode === 'ai' && (aiResult !== null || isLoading))
  }, [searchMode, aiResult, isLoading, onAISearchModeChange])

  const handleTextSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) {
      alert('Please enter a search term')
      return
    }
    setSearchMode('text')
    setAiResult(null)
    setError(null)
    onTextSearch(query)
  }

  const handleAISearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) {
      alert('Please describe what you need')
      return
    }
    // Clear text search results before starting AI search
    onTextSearch('')
    setSearchMode('ai')
    setIsLoading(true)
    setError(null)
    setAiResult(null)
    try {
      const matchData = await smartMatchCoaches(query)
      setAiResult(matchData)
    } catch (err: any) {
      console.error(err)
      setError(
        err.message || 'Something went wrong. Please check if your OpenAI API key is configured.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const clearSearch = () => {
    setQuery('')
    setAiResult(null)
    setError(null)
    setSearchMode(null)
    onTextSearch('')
    onAISearchModeChange?.(false)
  }

  // AI Mode Results View
  if (searchMode === 'ai' && (aiResult || isLoading)) {
    return (
      <>
        {isLoading && <AILoader />}
        <div className="flex flex-col gap-6">
          {/* Modern Search Bar - AI Mode */}
          <form onSubmit={handleAISearch} className="relative">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-500/40 via-indigo-400/20 to-purple-500/40 p-1.5 shadow-2xl backdrop-blur-xl">
              <div className="relative flex items-center gap-4 rounded-3xl border border-purple-200 bg-white px-7 py-5 shadow-lg">
                {/* Sparkles icon - AI indicator */}
                <Sparkles
                  size={24}
                  className="shrink-0 animate-pulse text-purple-600"
                  aria-hidden="true"
                />

                {/* Input */}
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={textSearchPlaceholder}
                  className="flex-1 appearance-none border-0 bg-transparent text-base font-medium text-gray-900 placeholder-gray-400 caret-purple-600 outline-none"
                  autoComplete="off"
                />

                {/* Clear button */}
                {query && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="group relative flex shrink-0 items-center justify-center"
                    aria-label="Clear search"
                  >
                    <X
                      size={22}
                      className="text-red-500 transition-colors group-hover:text-red-600"
                    />
                  </button>
                )}

                {/* Divider */}
                <div className="h-8 w-px bg-gradient-to-b from-gray-300/0 via-gray-300 to-gray-300/0" />

                {/* Mode Buttons - Always Visible */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSearchMode('text')}
                    className="flex items-center gap-2 rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-700 shadow transition-all hover:bg-gray-200 active:scale-95 active:bg-gray-300"
                    title="Switch to specific search"
                  >
                    <Filter size={16} />
                    <span>Specific</span>
                  </button>

                  <button
                    type="submit"
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:from-purple-500 hover:to-purple-400 hover:shadow-purple-500/50 active:scale-95 active:from-purple-700 active:to-purple-600"
                  >
                    <Sparkles size={16} className={isLoading ? 'animate-spin' : ''} />
                    <span>{isLoading ? 'Matching...' : 'AI Match'}</span>
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Error State */}
          {error && (
            <div className="rounded-2xl border border-red-300 bg-red-50 px-6 py-4 text-sm text-red-700 backdrop-blur">
              {error}
            </div>
          )}

          {/* AI Results */}
          {aiResult && (
            <div className="flex flex-col gap-6">
              {/* AI Explanation Box */}
              <div className="rounded-3xl border border-purple-200 bg-purple-50 p-6 shadow-lg backdrop-blur">
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-200">
                    <Sparkles size={18} className="text-purple-600" />
                  </div>
                  <div className="flex flex-1 flex-col gap-3">
                    <p className="text-base leading-relaxed font-medium text-gray-900">
                      {aiResult.explanation}
                    </p>

                    {/* Filter badges */}
                    {Object.keys(aiResult.parsedFilters).length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {aiResult.parsedFilters.semanticSearchQuery && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-200 px-3 py-1.5 text-xs font-semibold text-purple-700">
                            <Sparkles size={12} />
                            {aiResult.parsedFilters.semanticSearchQuery}
                          </span>
                        )}
                        {aiResult.parsedFilters.country && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700">
                            📍 {aiResult.parsedFilters.country}
                          </span>
                        )}
                        {aiResult.parsedFilters.certification && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700">
                            🏆 {aiResult.parsedFilters.certification}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Results */}
              {aiResult.coaches.length > 0 ? (
                <div>
                  <p className="mb-4 text-base font-semibold text-gray-800">
                    Found <span className="text-purple-600">{aiResult.coaches.length}</span>{' '}
                    matching coaches
                  </p>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {aiResult.coaches.map((coach) => (
                      <CoachCard key={coach.id} coach={coach} />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-gray-200 bg-gray-50 px-6 py-16 text-center backdrop-blur">
                  <ZapOff size={32} className="mx-auto mb-3 text-gray-400" />
                  <p className="font-medium text-gray-600">
                    No coaches found matching your criteria.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Reset button */}
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={clearSearch}
              className="rounded-lg bg-red-100 px-6 py-2 font-medium text-red-700 transition-colors hover:bg-red-200"
            >
              Reset Search
            </button>
          </div>
        </div>
      </>
    )
  }

  // Text Search Mode View
  return (
    <form onSubmit={handleTextSearch}>
      <div className="relative">
        {/* Gradient Border Container */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-500/40 via-purple-400/20 to-blue-500/40 p-1.5 shadow-2xl backdrop-blur-xl">
          <div className="relative flex items-center gap-4 rounded-3xl border border-blue-200 bg-white px-7 py-5 shadow-lg">
            {/* Search Icon */}
            <Search
              size={24}
              className="shrink-0 text-blue-600 transition-colors"
              aria-hidden="true"
            />

            {/* Input Field */}
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={textSearchPlaceholder}
              className="flex-1 appearance-none border-0 bg-transparent text-base font-medium text-gray-900 placeholder-gray-400 caret-blue-600 outline-none"
              autoComplete="off"
            />

            {/* Clear Button */}
            {query && (
              <button
                type="button"
                onClick={clearSearch}
                className="group relative flex shrink-0 items-center justify-center"
                aria-label="Clear search"
              >
                <X size={22} className="text-red-500 transition-colors group-hover:text-red-600" />
              </button>
            )}

            {/* Divider */}
            <div className="h-8 w-px bg-gradient-to-b from-gray-300/0 via-gray-300 to-gray-300/0" />

            {/* Mode Selection Buttons */}
            <div className="flex items-center gap-3">
              {/* Specific Search Button - Always Visible */}
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:from-blue-500 hover:to-blue-400 hover:shadow-blue-500/50 active:scale-95 active:from-blue-700 active:to-blue-600"
                title="Find coaches by name, location, or certification"
              >
                <Filter size={16} />
                <span>Search Specific</span>
              </button>

              {/* AI Search Button - Always Visible */}
              <button
                type="button"
                onClick={handleAISearch}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:from-purple-500 hover:to-purple-400 hover:shadow-purple-500/50 active:scale-95 active:from-purple-700 active:to-purple-600"
                title="Ask AI to find coaches matching your needs"
              >
                <Sparkles size={16} className={isLoading ? 'animate-spin' : ''} />
                <span>{isLoading ? 'Matching...' : 'AI Match'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Helper Text */}
        {!query && (
          <p className="mt-5 text-sm leading-relaxed text-gray-700">
            <strong className="mb-2 block text-base text-gray-900">💡 How to search:</strong>
            <span className="mb-2 block leading-relaxed text-gray-600">
              • <strong className="text-gray-800">Search Specific</strong> to find coaches by name,
              certification{' '}
              <span className="inline-block rounded bg-gray-100 px-2 py-1 font-mono text-xs">
                (PALC, SALC)
              </span>
              , or location
            </span>
            <span className="block text-gray-600">
              • <strong className="text-gray-800">AI Match</strong> to describe what you need
              naturally
            </span>
          </p>
        )}

        {/* Tip shown when typing */}
        {query && !searchMode && (
          <p className="mt-4 text-sm font-medium text-gray-700">
            ✨ <strong>Choose a search method</strong> above to continue
          </p>
        )}
      </div>
    </form>
  )
}
