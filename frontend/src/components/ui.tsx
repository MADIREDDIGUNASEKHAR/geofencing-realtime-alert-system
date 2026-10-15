import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 ${className}`}>{children}</div>
}

export function Button({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors
        bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    />
  )
}

export function SecondaryButton({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors
        bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    />
  )
}

export function Label({ children }: { children: ReactNode }) {
  return <label className="block text-sm font-medium text-gray-700 mb-1">{children}</label>
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${props.className ?? ''}`}
    />
  )
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${props.className ?? ''}`}
    />
  )
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${props.className ?? ''}`}
    />
  )
}

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg className={`animate-spin h-4 w-4 ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">{message}</div>
  )
}

export function SuccessBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3">{message}</div>
  )
}

export function EmptyState({ message }: { message: string }) {
  return <div className="text-center text-gray-400 text-sm py-10">{message}</div>
}

const CATEGORY_STYLES: Record<string, string> = {
  delivery_zone: 'bg-blue-100 text-blue-700',
  restricted_zone: 'bg-red-100 text-red-700',
  toll_zone: 'bg-amber-100 text-amber-700',
  customer_area: 'bg-green-100 text-green-700',
}

export function CategoryBadge({ category }: { category: string }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_STYLES[category] ?? 'bg-gray-100 text-gray-700'}`}>
      {category.replace(/_/g, ' ')}
    </span>
  )
}

export function EventTypeBadge({ eventType }: { eventType: string }) {
  const isEntry = eventType === 'entry'
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isEntry ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
      }`}
    >
      {eventType}
    </span>
  )
}
