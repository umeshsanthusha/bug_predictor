import { useEffect, useState } from 'react'
import { METRIC_ORDER, type FilePrediction } from '../types'

const SOURCE_METRICS = new Set<string>(METRIC_ORDER.slice(0, 19))

function groupLabel(key: string): string {
  return SOURCE_METRICS.has(key) ? 'Source / OO metrics' : 'Code smell metrics'
}

/** Calibrated 0–100 gauge with tick marks and a verdict threshold at 50. */
function Gauge({ prob, buggy }: { prob: number; buggy: boolean }) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    // Double rAF so the transition starts from 0 after first paint
    let inner = 0
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setWidth(prob))
    })
    return () => {
      cancelAnimationFrame(outer)
      cancelAnimationFrame(inner)
    }
  }, [prob])

  return (
    <div className="mt-1">
      <div className="relative h-3">
        {/* verdict threshold marker at 50 */}
        <span
          className="bg-accent absolute top-0 bottom-0 left-1/2 z-10 w-0.5 -translate-x-1/2 opacity-70"
          aria-hidden="true"
        />
        {/* track + fill */}
        <div className="bg-card absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 overflow-hidden rounded-full">
          <div
            className={`h-full rounded-full transition-[width] duration-1000 ease-out ${
              buggy ? 'bg-accent-2 gauge-buggy' : 'bg-good gauge-clean'
            }`}
            style={{ width: `${width}%` }}
          />
        </div>
        {/* tick marks every 10% */}
        <div
          className="pointer-events-none absolute inset-x-0 top-1/2 h-2 -translate-y-1/2"
          style={{
            backgroundImage:
              'repeating-linear-gradient(to right, var(--bg) 0 1px, transparent 1px 10%)',
            opacity: 0.55,
          }}
          aria-hidden="true"
        />
      </div>
      <div className="font-mono text-muted mt-1.5 flex justify-between text-[0.6rem]">
        <span>0</span>
        <span>25</span>
        <span className="text-accent">50 · verdict</span>
        <span>75</span>
        <span>100</span>
      </div>
    </div>
  )
}

export default function ResultCard({ result }: { result: FilePrediction }) {
  const [showMetrics, setShowMetrics] = useState(false)
  const buggy = result.prediction === 1
  const prob = result.buggy_probability

  return (
    <div className="rise-in border-line bg-panel rounded-2xl border p-6">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-muted text-[0.65rem] tracking-[0.2em] uppercase">
            {result.language}
          </p>
          <h3 className="font-display mt-1 max-w-[240px] truncate text-lg font-bold text-ink">
            {result.filename}
          </h3>
        </div>
        <span
          className={`font-mono rounded-full border px-4 py-1 text-xs font-bold tracking-wider uppercase ${
            buggy
              ? 'pill-hazard border-accent-2/50 bg-accent-2/10 text-accent-2'
              : 'border-good/50 bg-good/10 text-good'
          }`}
        >
          {buggy ? 'Buggy' : 'Clean'}
        </span>
      </div>

      {/* Calibrated probability gauge */}
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-mono text-muted tracking-[0.15em] uppercase">
          Buggy probability
        </span>
        <span className="font-mono text-ink text-sm font-semibold">{prob.toFixed(2)}%</span>
      </div>
      <Gauge prob={prob} buggy={buggy} />

      {/* Metrics toggle */}
      <button
        type="button"
        onClick={() => setShowMetrics((v) => !v)}
        className="font-mono text-accent mt-5 text-xs font-semibold tracking-[0.1em] uppercase underline-offset-4 hover:underline"
      >
        {showMetrics ? '− Hide' : '+ Show'} extracted metrics (24)
      </button>

      {showMetrics && (
        <div className="bg-card mt-4 grid grid-cols-2 gap-x-6 gap-y-1 rounded-xl p-4 sm:grid-cols-3">
          {METRIC_ORDER.map((key) => (
            <div
              key={key}
              className="border-line/60 flex items-baseline justify-between gap-2 border-b py-1 last:border-0"
              title={groupLabel(key)}
            >
              <span className="font-mono text-muted text-xs">{key}</span>
              <span className="font-mono text-ink text-xs">{result.metrics[key]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
