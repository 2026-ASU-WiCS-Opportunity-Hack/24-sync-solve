'use client'

/**
 * Shared primitive form components for block editors.
 * Lightweight wrappers — no HeroUI dependency here to keep bundle small.
 */

interface FieldProps {
  id: string
  label: string
  error?: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}

export function Field({ id, label, error, hint, required = false, children }: FieldProps) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
        {required && (
          <span className="ms-0.5 text-red-500" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string
  error?: boolean
}

export function Input({ id, error, className = '', ...rest }: InputProps) {
  return (
    <input
      id={id}
      aria-describedby={error ? `${id}-error` : undefined}
      aria-invalid={error ? 'true' : undefined}
      className={[
        'w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none',
        error
          ? 'border-red-300 focus:border-red-400 focus:ring-red-300'
          : 'border-gray-300 focus:border-blue-400 focus:ring-blue-300',
        className,
      ].join(' ')}
      {...rest}
    />
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  id: string
  error?: boolean
}

export function Textarea({ id, error, className = '', ...rest }: TextareaProps) {
  return (
    <textarea
      id={id}
      aria-describedby={error ? `${id}-error` : undefined}
      aria-invalid={error ? 'true' : undefined}
      className={[
        'w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none',
        error
          ? 'border-red-300 focus:border-red-400 focus:ring-red-300'
          : 'border-gray-300 focus:border-blue-400 focus:ring-blue-300',
        className,
      ].join(' ')}
      {...rest}
    />
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  id: string
  error?: boolean
}

export function Select({ id, error, className = '', children, ...rest }: SelectProps) {
  return (
    <select
      id={id}
      aria-describedby={error ? `${id}-error` : undefined}
      aria-invalid={error ? 'true' : undefined}
      className={[
        'w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none',
        error
          ? 'border-red-300 focus:border-red-400 focus:ring-red-300'
          : 'border-gray-300 focus:border-blue-400 focus:ring-blue-300',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </select>
  )
}

interface EditorActionsProps {
  onCancel: () => void
  isSaving: boolean
  saveLabel?: string
}

export function EditorActions({
  onCancel,
  isSaving,
  saveLabel = 'Save changes',
}: EditorActionsProps) {
  return (
    <div className="mt-4 flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
      <button
        type="button"
        onClick={onCancel}
        disabled={isSaving}
        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-300 focus:outline-none disabled:opacity-60"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={isSaving}
        aria-busy={isSaving}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 focus:outline-none disabled:opacity-60"
      >
        {isSaving ? 'Saving…' : saveLabel}
      </button>
    </div>
  )
}

interface ArrayEditorProps<T> {
  items: T[]
  onChange: (items: T[]) => void
  renderItem: (
    item: T,
    index: number,
    onChange: (updated: T) => void,
    onRemove: () => void
  ) => React.ReactNode
  createEmpty: () => T
  addLabel?: string
  maxItems?: number
}

export function ArrayEditor<T>({
  items,
  onChange,
  renderItem,
  createEmpty,
  addLabel = 'Add item',
  maxItems = 20,
}: ArrayEditorProps<T>) {
  function handleChange(index: number, updated: T) {
    const next = [...items]
    next[index] = updated
    onChange(next)
  }

  function handleRemove(index: number) {
    onChange(items.filter((_, i) => i !== index))
  }

  function handleAdd() {
    if (items.length >= maxItems) return
    onChange([...items, createEmpty()])
  }

  return (
    <div className="space-y-3">
      {items.map((item, i) =>
        renderItem(
          item,
          i,
          (updated) => handleChange(i, updated),
          () => handleRemove(i)
        )
      )}
      {items.length < maxItems && (
        <button
          type="button"
          onClick={handleAdd}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 py-2 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 focus:ring-2 focus:ring-blue-300 focus:outline-none"
        >
          + {addLabel}
        </button>
      )}
    </div>
  )
}
