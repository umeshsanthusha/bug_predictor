import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface ConfirmDialogProps {
  title: string
  message: ReactNode
  confirmLabel?: string
  onConfirm: () => void
  onClose: () => void
}

/**
 * Modal confirmation dialog for destructive actions.
 * Rendered in a portal so transformed ancestors (e.g. the sliding sidebar)
 * can't trap the fixed overlay.
 */
export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null)

  // Focus the destructive action and allow Escape to dismiss
  useEffect(() => {
    confirmRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div
      className="bg-ink/40 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-[2px]"
      onMouseDown={(e) => {
        // Clicks on the backdrop (but not the dialog itself) cancel
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="border-line bg-panel rise-in w-full max-w-sm rounded-2xl border p-6"
      >
        <p className="font-mono text-accent-2 mb-2 text-[0.6rem] font-semibold tracking-[0.22em] uppercase">
          Confirm action
        </p>
        <h2 className="font-display text-lg font-extrabold tracking-tight">{title}</h2>
        <p className="text-muted mt-2 text-sm leading-relaxed">{message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="border-line font-mono text-muted hover:border-accent/60 hover:text-ink rounded-lg border px-4 py-2 text-[0.65rem] font-semibold tracking-[0.15em] uppercase transition-colors"
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className="font-mono rounded-lg bg-accent-2 px-4 py-2 text-[0.65rem] font-semibold tracking-[0.15em] text-white uppercase transition-opacity hover:opacity-90"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
