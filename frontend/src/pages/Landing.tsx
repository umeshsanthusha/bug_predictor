import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Brand from '../components/Brand'
import ThemeToggle from '../components/ThemeToggle'

const STEPS = [
  {
    index: '01',
    title: 'Upload source files',
    body: 'Drop two C# or JavaScript files into the predictor. Each is scanned independently.',
  },
  {
    index: '02',
    title: 'Select a model',
    body: 'Choose among five trained classifiers — Random Forest, KNN, Logistic Regression, Naïve Bayes or XGBoost.',
  },
  {
    index: '03',
    title: 'Read the verdict',
    body: 'Every file gets a buggy-probability reading on a calibrated 0–100 scale, plus its full 24-metric breakdown.',
  },
]

/** Illustrative readings from the demo files shipped in samples/. */
const SPECIMENS = [
  { file: 'UserService.cs', language: 'C#', prob: 87.42, verdict: 'Buggy' as const },
  { file: 'shoppingCart.js', language: 'JavaScript', prob: 12.36, verdict: 'Clean' as const },
]

/** Test-set scores from the trained models (backend/models). */
const BENCH = [
  { name: 'Random Forest', accuracy: '92.59', precision: '0.9189', recall: '1.0000', f1: '0.9577', top: true },
  { name: 'KNN', accuracy: '92.59', precision: '0.9306', recall: '0.9853', f1: '0.9571', top: false },
  { name: 'Logistic Regression', accuracy: '91.36', precision: '0.9178', recall: '0.9853', f1: '0.9504', top: false },
  { name: 'Naïve Bayes', accuracy: '92.59', precision: '0.9189', recall: '1.0000', f1: '0.9577', top: true },
  { name: 'XGBoost', accuracy: '91.36', precision: '0.9178', recall: '0.9853', f1: '0.9504', top: false },
]

const DECISIONS = [
  ['Random Forest', 'Grows many decision trees on resampled data and lets them vote.'],
  ['KNN', 'Judges a file by how close its metrics sit to the nearest labelled files.'],
  ['Logistic Regression', 'Finds one straight boundary through the twenty-four channels.'],
  ['Naïve Bayes', 'Applies Bayes’ rule, treating every metric as an independent witness.'],
  ['XGBoost', 'Rebuilds the answer in rounds, each one fixing the last round’s misses.'],
]

/** The 24 channels, grouped as the extractor groups them. */
const CHANNEL_GROUPS = [
  {
    title: 'Size and complexity',
    body: 'How much working code a file holds and how many paths run through it. Large, tangled files give defects more rooms to hide in.',
    metrics: ['LOC', 'WMC', 'RFC', 'MCC'],
  },
  {
    title: 'Inheritance and abstraction',
    body: 'How deep the type hierarchy runs and how much behaviour is inherited or hidden rather than written down directly.',
    metrics: ['DIT', 'NOC', 'DAM', 'MFA', 'ACC'],
  },
  {
    title: 'Coupling',
    body: 'How tied the file is to the rest of the system — dependencies flowing in, dependencies reaching out, and how much of it is structural.',
    metrics: ['CBO', 'Ca', 'Ce', 'IC', 'CBM', 'AMC'],
  },
  {
    title: 'Cohesion and design',
    body: 'Whether the parts of a class actually work together, or it is really several classes wearing one coat.',
    metrics: ['NPM', 'LCOM', 'CAM', 'MOA'],
  },
  {
    title: 'Code smell',
    body: 'Procedural habits inside object-oriented code — long responses, comment density, and resistance to clean OO extension.',
    metrics: ['Intensity', 'ANA', 'ARL', 'ACPD', 'ACM'],
  },
]

/** Fades a section in once, the first time it enters the viewport. */
function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [seen, setSeen] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || seen) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true)
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [seen])

  return (
    <div ref={ref} className={`${className} ${seen ? 'rise-in' : 'opacity-0'}`}>
      {children}
    </div>
  )
}

function Rule({ label }: { label: string }) {
  return (
    <div className="mb-7 flex items-center gap-4">
      <h2 className="font-display text-muted text-sm font-semibold tracking-[0.18em] uppercase">
        {label}
      </h2>
      <span className="bg-line h-px flex-1" aria-hidden="true" />
    </div>
  )
}

function SpecimenCard({ s }: { s: (typeof SPECIMENS)[number] }) {
  const buggy = s.verdict === 'Buggy'
  return (
    <div className="border-line bg-panel rounded-2xl border p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-muted text-[0.65rem] tracking-[0.2em] uppercase">
            {s.language}
          </p>
          <h3 className="font-display mt-1 max-w-[220px] truncate text-lg font-bold text-ink">
            {s.file}
          </h3>
        </div>
        <span
          className={`font-mono rounded-full border px-4 py-1 text-xs font-bold tracking-wider uppercase ${
            buggy
              ? 'pill-hazard border-accent-2/50 bg-accent-2/10 text-accent-2'
              : 'border-good/50 bg-good/10 text-good'
          }`}
        >
          {s.verdict}
        </span>
      </div>

      <div className="mt-6 flex items-baseline justify-between">
        <span className="font-mono text-muted text-[0.6rem] tracking-[0.18em] uppercase">
          Buggy probability
        </span>
        <span
          className={`font-mono text-xl font-semibold ${buggy ? 'text-accent-2' : 'text-good'}`}
        >
          {s.prob.toFixed(2)}%
        </span>
      </div>

      {/* Calibrated scale, verdict threshold at 50 */}
      <div className="relative mt-2 h-3">
        <span
          className="bg-accent absolute top-0 bottom-0 left-1/2 z-10 w-0.5 -translate-x-1/2 opacity-70"
          aria-hidden="true"
        />
        <div className="bg-card absolute inset-x-0 top-1/2 h-2.5 -translate-y-1/2 overflow-hidden rounded-full">
          <div
            className={`bar-grow h-full rounded-full ${
              buggy ? 'bg-accent-2 gauge-buggy' : 'bg-good gauge-clean'
            }`}
            style={{ width: `${s.prob}%` }}
          />
        </div>
      </div>
      <div className="font-mono text-muted mt-1.5 flex justify-between text-[0.6rem]">
        <span>0</span>
        <span className="text-accent">50 · verdict</span>
        <span>100</span>
      </div>
    </div>
  )
}

/** Floating "back to top" control that fades in after scrolling and eases slowly back up. */
function BackToTop() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToTop = () => {
    const start = window.scrollY
    if (start <= 0) return
    // Honour the OS "reduce motion" preference with an instant jump
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.scrollTo(0, 0)
      return
    }
    // Custom eased scroll so we can control the pace (native smooth ignores speed)
    const duration = 900
    const startTime = performance.now()
    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
    const step = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration)
      window.scrollTo(0, start * (1 - easeInOutCubic(t)))
      if (t < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      className={`border-line bg-panel text-muted hover:border-accent/60 hover:text-accent fixed right-5 bottom-5 z-30 flex h-11 w-11 items-center justify-center rounded-full border shadow-[var(--slab-shadow)] transition-all duration-300 sm:right-8 sm:bottom-8 ${
        show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
      }`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
  )
}

export default function Landing() {
  return (
    <div className="relative z-10 min-h-screen">
      {/* Top bar */}
      <div className="border-line bg-panel/95 sticky top-0 z-20 border-b backdrop-blur-md">
        <div className="flex w-full items-center justify-between gap-3 px-6 py-3">
          <Brand />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              to="/login"
              className="border-line text-ink hover:border-accent/60 hover:text-accent font-mono hidden items-center rounded-full border px-4 py-2 text-[0.65rem] font-semibold tracking-[0.18em] uppercase transition-colors sm:inline-flex"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="font-mono beam-btn rounded-full px-4 py-2 text-[0.65rem] font-bold tracking-[0.18em] uppercase"
            >
              Create account
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 pb-24">
        {/* Hero */}
        <header className="relative pt-16 pb-6">
          {/* Beam light: the instrument's own glow */}
          <div
            className="pointer-events-none absolute top-4 -left-24 -z-10 hidden h-72 w-72 rounded-full bg-accent/20 blur-[90px] sm:block"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute top-24 -right-20 -z-10 hidden h-64 w-64 rounded-full bg-good/15 blur-[90px] sm:block"
            aria-hidden="true"
          />
          <p className="font-mono text-accent mb-4 text-[0.65rem] tracking-[0.3em] uppercase">
            Research instrument · ML defect scoring
          </p>
          <h1 className="font-display text-5xl leading-[1.02] font-extrabold tracking-tight uppercase sm:text-6xl">
            Is this file
            <br />
            <span className="beam-text">bug-prone?</span>
          </h1>
          <p className="text-muted mt-5 max-w-xl text-sm leading-relaxed">
            CrossBugSense scores C# and JavaScript source files against twenty-four
            source-code and code-smell metrics, then calls the verdict with a
            machine-learning model trained on real defect data.
          </p>

          {/* Spec readout */}
          <dl className="border-line mt-9 grid max-w-xl grid-cols-2 gap-px overflow-hidden rounded-xl border sm:grid-cols-4">
            {[
              ['Languages', 'C# · JS'],
              ['Metrics / file', '24'],
              ['Models', '05'],
              ['Verdict', '0 / 1'],
            ].map(([term, detail]) => (
              <div key={term} className="bg-panel px-4 py-3 transition-colors hover:bg-card/70">
                <dt className="font-mono text-muted text-[0.6rem] tracking-[0.18em] uppercase">
                  {term}
                </dt>
                <dd className="font-mono text-ink mt-1 text-sm font-semibold">{detail}</dd>
              </div>
            ))}
          </dl>
        </header>

        {/* Sample readings */}
        <Reveal className="mt-16">
          <Rule label="Sample readings" />
          <p className="text-muted -mt-3 mb-6 max-w-xl text-sm leading-relaxed">
            This is what a verdict looks like — two files from the project’s own demo set,
            measured on twenty-four channels and scored above the threshold.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {SPECIMENS.map((s) => (
              <SpecimenCard key={s.file} s={s} />
            ))}
          </div>
          <p className="font-mono text-muted mt-3 text-[0.6rem] tracking-[0.18em] uppercase">
            Illustrative readings · demo files from samples/
          </p>
        </Reveal>

        {/* How it works */}
        <Reveal className="mt-16">
          <Rule label="How it works" />
          <ol className="grid gap-4 sm:grid-cols-3">
            {STEPS.map((step) => (
              <li
                key={step.index}
                className="border-line bg-panel rounded-xl border p-5 transition-transform duration-200 hover:-translate-y-0.5"
              >
                <span className="font-mono text-accent/25 bg-accent/10 float-right rounded-md px-1.5 text-lg font-bold">
                  {step.index}
                </span>
                <h3 className="font-display mt-3 text-sm font-bold text-ink">{step.title}</h3>
                <p className="text-muted mt-2 text-sm leading-relaxed">{step.body}</p>
              </li>
            ))}
          </ol>
        </Reveal>

        {/* Classifier bench */}
        <Reveal className="mt-16">
          <Rule label="The classifier bench" />
          <p className="text-muted -mt-3 mb-6 max-w-xl text-sm leading-relaxed">
            Five trained classifiers ship with the instrument. Scores are each model’s
            result on the held-out test split of the defect dataset.
          </p>
          <div className="border-line bg-panel overflow-hidden rounded-2xl border">
            <div className="overflow-x-auto">
              <table className="font-mono w-full min-w-[34rem] border-collapse text-xs">
                <thead>
                  <tr className="text-muted text-left text-[0.6rem] tracking-[0.18em] uppercase">
                    <th className="border-line border-b px-5 py-3 font-semibold">Model</th>
                    <th className="border-line border-b px-5 py-3 text-right font-semibold">Accuracy</th>
                    <th className="border-line border-b px-5 py-3 text-right font-semibold">Precision</th>
                    <th className="border-line border-b px-5 py-3 text-right font-semibold">Recall</th>
                    <th className="border-line border-b px-5 py-3 text-right font-semibold">F1</th>
                  </tr>
                </thead>
                <tbody>
                  {BENCH.map((m) => (
                    <tr
                      key={m.name}
                      className="hover:bg-card/60 border-line/70 border-b transition-colors last:border-b-0"
                    >
                      <td className="px-5 py-3 font-semibold text-ink">
                        {m.name}
                        {m.top && (
                          <span className="text-accent ml-2 text-[0.6rem] font-bold tracking-[0.15em] uppercase">
                            top reader
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">{m.accuracy}%</td>
                      <td className="text-muted px-5 py-3 text-right">{m.precision}</td>
                      <td className="text-muted px-5 py-3 text-right">{m.recall}</td>
                      <td className="text-muted px-5 py-3 text-right">{m.f1}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <dl className="border-line bg-card/40 grid gap-x-8 gap-y-2 border-t px-5 py-4 sm:grid-cols-2">
              {DECISIONS.map(([name, line]) => (
                <div key={name} className="flex flex-wrap items-baseline gap-x-2 text-[0.72rem]">
                  <dt className="text-accent font-semibold">{name}</dt>
                  <dd className="text-muted min-w-0 flex-1 leading-relaxed">{line}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Reveal>

        {/* The 24 channels */}
        <Reveal className="mt-16">
          <Rule label="Twenty-four channels" />
          <p className="text-muted -mt-3 mb-6 max-w-xl text-sm leading-relaxed">
            Before any model speaks, every file is measured on twenty-four channels —
            nineteen object-oriented metrics and five code-smell indices. They answer five
            plain questions about how a file is built.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {CHANNEL_GROUPS.map((g) => (
              <div
                key={g.title}
                className="border-line bg-panel rounded-xl border p-5 transition-transform duration-200 hover:-translate-y-0.5"
              >
                <h3 className="font-display text-sm font-bold text-ink">{g.title}</h3>
                <p className="text-muted mt-2 text-sm leading-relaxed">{g.body}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {g.metrics.map((m) => (
                    <span
                      key={m}
                      className="font-mono text-muted bg-card border-line hover:text-accent rounded-md border px-2 py-0.5 text-[0.62rem] font-semibold tracking-[0.08em] transition-colors"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            <div className="border-accent/40 bg-accent/5 flex flex-col justify-center rounded-xl border border-dashed p-5">
              <p className="font-display text-sm font-bold text-ink">One reading, twenty-four inputs</p>
              <p className="text-muted mt-2 text-sm leading-relaxed">
                All channels land in the same table the models were trained on — the
                breakdown under any verdict shows every value measured from your file.
              </p>
            </div>
          </div>
        </Reveal>

        {/* On this research */}
        <Reveal className="mt-16">
          <Rule label="On this research" />
          <div className="border-line bg-panel grid gap-8 rounded-2xl border p-7 sm:grid-cols-[3fr_2fr] sm:p-8">
            <div className="space-y-4 text-sm leading-relaxed text-muted">
              <p>
                CrossBugSense is a research project by{' '}
                <span className="text-ink font-semibold">A.U. Santhusha Sliate</span>. Its
                question is whether one set of metric channels can flag bug-prone files
                across two very different languages — the class metrics of C# and the
                procedural smell measures of JavaScript — without a bespoke model per language.
              </p>
              <p>
                The training data is a table of file-level records from real C# and
                JavaScript projects: one row per file, its twenty-four channel readings, the
                number of known bugs, and the buggy-or-clean label the models learn to call.
              </p>
            </div>
            <dl className="space-y-3 self-start">
              {[
                ['Languages', 'C# · JavaScript'],
                ['Record unit', 'One source file'],
                ['Channels / record', '24'],
                ['Label', 'Buggy / Clean'],
                ['Classifiers', '05 trained'],
              ].map(([term, detail]) => (
                <div key={term} className="border-line flex items-baseline justify-between gap-3 border-b pb-2 last:border-b-0">
                  <dt className="font-mono text-muted text-[0.6rem] tracking-[0.18em] uppercase">
                    {term}
                  </dt>
                  <dd className="font-mono text-ink text-xs font-semibold">{detail}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Reveal>

        {/* CTA */}
        <section className="border-line bg-panel relative mt-16 overflow-hidden rounded-2xl border p-8 text-center sm:p-10">
          <div
            className="pointer-events-none absolute -top-20 left-1/2 h-48 w-[36rem] -translate-x-1/2 rounded-full bg-accent/15 blur-[80px]"
            aria-hidden="true"
          />
          <h2 className="font-display text-2xl font-extrabold tracking-tight uppercase sm:text-3xl">
            Start predicting
          </h2>
          <p className="text-muted mx-auto mt-3 max-w-sm text-sm leading-relaxed">
            Create a free account to open the dashboard and score your first two files.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/register"
              className="font-display beam-btn rounded-xl px-8 py-3.5 text-sm font-bold tracking-[0.18em] uppercase"
            >
              Create account
            </Link>
            <Link
              to="/login"
              className="font-mono border-line text-ink hover:border-accent rounded-xl border px-8 py-3.5 text-sm font-semibold tracking-[0.18em] uppercase transition-colors"
            >
              Sign in
            </Link>
          </div>
        </section>

        <footer className="border-line text-muted mt-24 border-t pt-6 text-center font-mono text-[0.65rem] tracking-widest uppercase">
          CrossBugSense · Research Project · A.U. Santhusha Sliate
        </footer>
      </div>

      <BackToTop />
    </div>
  )
}
