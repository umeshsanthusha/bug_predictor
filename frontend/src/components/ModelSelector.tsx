import type { ModelInfo } from '../types'

interface ModelSelectorProps {
  models: ModelInfo[]
  selected: string
  onSelect: (key: string) => void
}

export default function ModelSelector({ models, selected, onSelect }: ModelSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {models.map((model) => {
        const active = model.key === selected
        return (
          <button
            key={model.key}
            type="button"
            onClick={() => onSelect(model.key)}
            aria-pressed={active}
            className={`flex flex-col items-start gap-1 rounded-xl border px-4 py-3 text-left transition-all duration-200 ${
              active
                ? 'border-accent bg-accent/10 -translate-y-0.5 shadow-[0_10px_28px_-16px_var(--glow-accent)]'
                : 'border-line bg-panel hover:border-accent/50 hover:-translate-y-0.5'
            }`}
          >
            <span className="flex w-full items-center justify-between gap-2">
              <span className={`text-sm font-semibold ${active ? 'text-accent' : 'text-ink'}`}>
                {model.name}
              </span>
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${
                  active ? 'beacon' : 'bg-line'
                }`}
                aria-hidden="true"
              />
            </span>
            <span className="font-mono text-xs text-muted">
              acc {model.accuracy.toFixed(2)}%
            </span>
          </button>
        )
      })}
    </div>
  )
}
