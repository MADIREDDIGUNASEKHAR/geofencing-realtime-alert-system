import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { Inbox, type LucideIcon } from 'lucide-react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] border border-gray-100 p-5 ${className}`}
    >
      {children}
    </div>
  )
}

export function PageHeader({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="flex items-start gap-3.5">
        <span className="flex items-center justify-center h-11 w-11 shrink-0 rounded-xl bg-blue-50 text-blue-600">
          <Icon className="h-5 w-5" strokeWidth={2} />
        </span>
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h1>
          {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}

export function Button({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all
        bg-blue-600 text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/25
        active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${className}`}
      {...props}
    />
  )
}

export function SecondaryButton({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all
        bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300
        active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${className}`}
      {...props}
    />
  )
}

export function Label({ children }: { children: ReactNode }) {
  return <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">{children}</label>
}

const fieldBase =
  'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400'

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${fieldBase} ${props.className ?? ''}`} />
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${fieldBase} resize-none ${props.className ?? ''}`} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${fieldBase} bg-white ${props.className ?? ''}`} />
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
    <div className="rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 flex items-start gap-2">
      {message}
    </div>
  )
}

export function SuccessBanner({ message }: { message: string }) {
  return <div className="rounded-xl bg-green-50 border border-green-100 text-green-700 text-sm px-4 py-3">{message}</div>
}

export function EmptyState({ message, icon: Icon = Inbox }: { message: string; icon?: LucideIcon }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 text-gray-400">
      <Icon className="h-8 w-8 mb-2.5 text-gray-300" strokeWidth={1.5} />
      <p className="text-sm max-w-[220px]">{message}</p>
    </div>
  )
}

const CATEGORY_STYLES: Record<string, string> = {
  delivery_zone: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200',
  restricted_zone: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200',
  toll_zone: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
  customer_area: 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-200',
}

const CATEGORY_DOT: Record<string, string> = {
  delivery_zone: 'bg-blue-500',
  restricted_zone: 'bg-red-500',
  toll_zone: 'bg-amber-500',
  customer_area: 'bg-green-500',
}

export function CategoryBadge({ category }: { category: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        CATEGORY_STYLES[category] ?? 'bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${CATEGORY_DOT[category] ?? 'bg-gray-400'}`} />
      {category.replace(/_/g, ' ')}
    </span>
  )
}

export function EventTypeBadge({ eventType }: { eventType: string }) {
  const isEntry = eventType === 'entry'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isEntry
          ? 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200'
          : 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isEntry ? 'bg-amber-500' : 'bg-slate-500'}`} />
      {eventType}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const isActive = status === 'active'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isActive
          ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-200'
          : 'bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
      {status}
    </span>
  )
}
