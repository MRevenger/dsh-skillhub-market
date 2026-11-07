/** Small UI primitives rendered inside the panel (no portals, no global DOM). */
import React from 'react'

export type IconName =
  | 'search' | 'close' | 'download' | 'github' | 'external' | 'folder' | 'refresh'
  | 'alert' | 'package' | 'spark' | 'check' | 'chevron-left' | 'chevron-right'
  | 'info' | 'tag' | 'layers' | 'note' | 'clock'

const PATHS: Record<IconName, React.ReactNode> = {
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></>,
  close: <><path d="M6 6l12 12M18 6 6 18" /></>,
  download: <><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M4 19h16" /></>,
  github: <path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 4.5-1.4 4.5-5a4.4 4.4 0 0 0-1.2-3.1 4.1 4.1 0 0 0-.1-3.1s-1-.3-3.3 1.2a11.4 11.4 0 0 0-6 0C6.6 2.7 5.6 3 5.6 3a4.1 4.1 0 0 0-.1 3.1A4.4 4.4 0 0 0 4.3 9.2c0 3.6 1.7 4.7 4.5 5-.5.5-.5 1.1-.5 2V20" />,
  external: <><path d="M14 4h6v6" /><path d="m20 4-9 9" /><path d="M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5" /></>,
  folder: <path d="M3 7a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />,
  refresh: <><path d="M20 11a8 8 0 1 0-2.3 5.7" /><path d="M20 4v7h-7" /></>,
  alert: <><path d="M12 3 2.7 20h18.6z" /><path d="M12 9v5" /><path d="M12 17.5h.01" /></>,
  package: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z" /><path d="m4 7.5 8 4.5 8-4.5" /><path d="M12 12v9" /></>,
  spark: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4" /><path d="m6 6 2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" /></>,
  check: <path d="m5 12 4.5 4.5L19 7" />,
  'chevron-left': <path d="m14 6-6 6 6 6" />,
  'chevron-right': <path d="m10 6 6 6-6 6" />,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 8h.01" /></>,
  tag: <><path d="M3 11V4h7l10 10-7 7z" /><circle cx="7.5" cy="7.5" r="1.2" /></>,
  layers: <><path d="m12 3 9 5-9 5-9-5z" /><path d="m3 13 9 5 9-5" /></>,
  note: <><path d="M5 3h10l4 4v14H5z" /><path d="M15 3v5h5M8 12h8M8 16h6" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
}

/** Inline icon that follows the current text color. */
export function Icon({ name, size = 16, className }: { name: IconName; size?: number; className?: string }): React.ReactElement {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  )
}

/** Inline loading spinner. */
export function Spinner({ size = 14 }: { size?: number }): React.ReactElement {
  return <span className="shm-spinner" style={{ width: size, height: size }} aria-hidden="true" />
}

/** A themed badge. */
export function Badge({ children, tone = 'neutral', title }: {
  children: React.ReactNode
  tone?: 'neutral' | 'blue' | 'green' | 'warn' | 'danger'
  title?: string
}): React.ReactElement {
  return <span className={`shm-badge${tone === 'neutral' ? '' : ` shm-badge-${tone}`}`} title={title}>{children}</span>
}

/** A button with a loading state. */
export function Button({
  children,
  variant = 'default',
  size = 'sm',
  loading = false,
  icon,
  className = '',
  disabled,
  type = 'button',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'primary' | 'soft' | 'ghost' | 'danger'
  size?: 'sm' | 'lg'
  loading?: boolean
  icon?: IconName
}): React.ReactElement {
  const classes = [
    'shm-btn',
    variant === 'default' ? '' : `shm-btn-${variant}`,
    size === 'lg' ? 'shm-btn-lg' : '',
    className,
  ].filter(Boolean).join(' ')
  return (
    <button {...rest} type={type} className={classes} disabled={disabled === true || loading} aria-busy={loading || undefined}>
      {loading ? <Spinner /> : icon === undefined ? null : <Icon name={icon} size={14} />}
      {children}
    </button>
  )
}

/** A modal confined to the panel tree; Escape and backdrop close it. */
export function Modal({
  title,
  subtitle,
  onClose,
  children,
  footer,
  size = 'md',
}: {
  title: React.ReactNode
  subtitle?: React.ReactNode
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'wide'
}): React.ReactElement {
  React.useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="shm-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div className={`shm-modal${size === 'sm' ? ' shm-modal-sm' : size === 'wide' ? ' shm-modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined}>
        <div className="shm-modal-head">
          <div style={{ minWidth: 0, flex: 1 }}>
            <h2 className="shm-modal-title">{title}</h2>
            {subtitle === undefined ? null : <p className="shm-modal-sub">{subtitle}</p>}
          </div>
          <button type="button" className="shm-iconbtn" onClick={onClose} aria-label="close">
            <Icon name="close" size={17} />
          </button>
        </div>
        <div className="shm-modal-body">{children}</div>
        {footer === undefined ? null : <div className="shm-modal-foot">{footer}</div>}
      </div>
    </div>
  )
}

/** Inline toast displayed at the bottom of the panel. */
export function Toast({ message, tone = 'info' }: { message: string; tone?: 'info' | 'success' | 'error' }): React.ReactElement {
  return (
    <div className={`shm-toast${tone === 'info' ? '' : ` shm-toast-${tone}`}`} role="status">
      <Icon name={tone === 'success' ? 'check' : tone === 'error' ? 'alert' : 'info'} size={15} />
      <span>{message}</span>
    </div>
  )
}
