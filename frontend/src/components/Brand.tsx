export default function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="beacon inline-block h-2 w-2 rounded-full" aria-hidden="true" />
      <span
        className={`font-mono text-ink font-semibold tracking-[0.22em] uppercase ${
          compact ? 'text-[0.7rem]' : 'text-xs'
        }`}
      >
        Cross<span className="text-accent">Bug</span>Sense
      </span>
    </span>
  )
}
