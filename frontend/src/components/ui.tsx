import { useEffect, type ReactNode } from 'react'
import { cn } from 'cn'
import { Inbox } from 'lucide-react'
import { animate, motion, useMotionValue, useTransform } from 'motion/react'
import { Button as ShadButton, buttonVariants } from './ui/button'
import { Input as ShadInput } from './ui/input'
import { Textarea as ShadTextarea } from './ui/textarea'
import { Label as ShadLabel } from './ui/label'
import { Badge } from './ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import type { LucideIcon } from 'lucide-react'
import type { VariantProps } from 'class-variance-authority'

export function Card({
  children,
  className = '',
  hoverable = false,
}: {
  children: ReactNode
  className?: string
  hoverable?: boolean
}) {
  return (
    <motion.div
      className={cn(
        'rounded-2xl border border-white/60 bg-card/70 text-card-foreground shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_-8px_rgba(16,24,40,0.12)] backdrop-blur-xl p-5',
        className,
      )}
      whileHover={hoverable ? { y: -3, boxShadow: '0 16px 36px -8px rgba(16,24,40,0.18)' } : undefined}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

/** A number that smoothly counts up/down to its new value instead of
 * snapping — small detail, but it's the difference between a dashboard that
 * feels alive and one that just displays data. */
export function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const motionValue = useMotionValue(0)
  const rounded = useTransform(motionValue, (latest) => Math.round(latest).toLocaleString())

  useEffect(() => {
    const controls = animate(motionValue, value, { duration: 0.7, ease: [0.22, 1, 0.36, 1] })
    return controls.stop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <motion.span className={cn('tabular-nums', className)}>{rounded}</motion.span>
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
        <span className="flex items-center justify-center h-11 w-11 shrink-0 rounded-xl bg-primary/10 text-primary backdrop-blur-xl border border-white/40">
          <Icon className="h-5 w-5" strokeWidth={2} />
        </span>
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">{title}</h1>
          {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}

export function Button({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<'button'> & VariantProps<typeof buttonVariants>) {
  return (
    <ShadButton
      variant={variant}
      size={size ?? 'lg'}
      className={cn('shadow-sm shadow-primary/20', className)}
      {...props}
    />
  )
}

export function SecondaryButton({
  className,
  size,
  ...props
}: React.ComponentProps<'button'> & Pick<VariantProps<typeof buttonVariants>, 'size'>) {
  return (
    <ShadButton variant="outline" size={size ?? 'lg'} className={cn('bg-white/60 backdrop-blur-xl', className)} {...props} />
  )
}

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ShadLabel className={cn('text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5', className)}>
      {children}
    </ShadLabel>
  )
}

export function Input(props: React.ComponentProps<'input'>) {
  return <ShadInput {...props} className={cn('h-10 rounded-xl bg-white/60 backdrop-blur-sm', props.className)} />
}

export function Textarea(props: React.ComponentProps<'textarea'>) {
  return <ShadTextarea {...props} className={cn('rounded-xl bg-white/60 backdrop-blur-sm', props.className)} />
}

export interface SelectFieldOption {
  value: string
  label: string
}

const SELECT_ALL_SENTINEL = '__all__'

/** A simplified, single-component wrapper around Radix Select (via shadcn),
 * so call sites can pass a plain options array instead of hand-writing the
 * full multi-part JSX every time. When `options` includes an explicit
 * `value: ""` entry (e.g. "All vehicles"), empty string is a real, selected,
 * displayable option, translated to/from a reserved sentinel since Radix
 * forbids empty item values. Otherwise `value: ""` means "nothing picked
 * yet" and is passed through as `undefined` so Radix shows the placeholder
 * instead of appearing blank. */
export function SelectField({
  value,
  onValueChange,
  placeholder,
  options,
  className,
}: {
  value: string
  onValueChange: (value: string) => void
  placeholder: string
  options: SelectFieldOption[]
  className?: string
}) {
  const hasEmptyOption = options.some((o) => o.value === '')
  const radixValue = value === '' ? (hasEmptyOption ? SELECT_ALL_SENTINEL : undefined) : value

  return (
    <Select value={radixValue} onValueChange={(v) => onValueChange(v === SELECT_ALL_SENTINEL ? '' : v)}>
      <SelectTrigger className={cn('w-full h-10 rounded-xl bg-white/60 backdrop-blur-sm', className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="backdrop-blur-xl bg-popover/95">
        {options.map((o) => (
          <SelectItem key={o.value || SELECT_ALL_SENTINEL} value={o.value === '' ? SELECT_ALL_SENTINEL : o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
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

/** A shimmering placeholder block for content still loading. Swap in for
 * Spinner wherever a page's overall shape is already known (tables, lists,
 * stat cards) — it reads as "this is about to appear" rather than "please
 * wait," which feels substantially more premium for the same wait time. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg bg-muted/70',
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.6s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/50 before:to-transparent",
        className,
      )}
    />
  )
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3">
      {message}
    </div>
  )
}

export function SuccessBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl bg-green-500/10 border border-green-500/20 text-green-700 text-sm px-4 py-3">{message}</div>
  )
}

export function EmptyState({ message, icon: Icon = Inbox }: { message: string; icon?: LucideIcon }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 text-muted-foreground">
      <Icon className="h-8 w-8 mb-2.5 text-muted-foreground/50" strokeWidth={1.5} />
      <p className="text-sm max-w-[220px]">{message}</p>
    </div>
  )
}

const CATEGORY_STYLES: Record<string, string> = {
  delivery_zone: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  restricted_zone: 'bg-red-500/10 text-red-700 border-red-500/20',
  toll_zone: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
  customer_area: 'bg-green-500/10 text-green-700 border-green-500/20',
}

const CATEGORY_DOT: Record<string, string> = {
  delivery_zone: 'bg-blue-500',
  restricted_zone: 'bg-red-500',
  toll_zone: 'bg-amber-500',
  customer_area: 'bg-green-500',
}

export function CategoryBadge({ category }: { category: string }) {
  return (
    <Badge
      variant="outline"
      className={cn('gap-1.5 font-medium', CATEGORY_STYLES[category] ?? 'bg-muted text-muted-foreground border-border')}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${CATEGORY_DOT[category] ?? 'bg-gray-400'}`} />
      {category.replace(/_/g, ' ')}
    </Badge>
  )
}

export function EventTypeBadge({ eventType }: { eventType: string }) {
  const isEntry = eventType === 'entry'
  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1.5 font-medium',
        isEntry ? 'bg-amber-500/10 text-amber-700 border-amber-500/20' : 'bg-slate-500/10 text-slate-700 border-slate-500/20',
      )}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isEntry ? 'bg-amber-500' : 'bg-slate-500'}`} />
      {eventType}
    </Badge>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const isActive = status === 'active'
  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1.5 font-medium',
        isActive ? 'bg-green-500/10 text-green-700 border-green-500/20' : 'bg-muted text-muted-foreground border-border',
      )}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
      {status}
    </Badge>
  )
}
