export default function SectionHeading({ index, title }: { index: string; title: string }) {
  return (
    <div className="mb-5 flex items-center gap-4">
      <span className="border-accent/40 bg-accent/10 text-accent font-mono flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-xs font-semibold shadow-[0_0_16px_-6px_var(--glow-accent)]">
        {index}
      </span>
      <h2 className="font-display text-muted text-sm font-semibold tracking-[0.18em] uppercase">
        {title}
      </h2>
      <span className="bg-line h-px flex-1" aria-hidden="true" />
    </div>
  )
}
