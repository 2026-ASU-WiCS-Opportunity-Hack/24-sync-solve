interface LoadingStateProps {
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

export function LoadingState({ label = 'Loading...', size = 'md' }: LoadingStateProps) {
  const sizeClass = { sm: 'size-4', md: 'size-6', lg: 'size-10' }[size]

  return (
    <div role="status" aria-label={label} className="flex items-center justify-center py-12">
      <span
        className={`${sizeClass} border-t-wial-red animate-spin rounded-full border-2 border-gray-200`}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </div>
  )
}
