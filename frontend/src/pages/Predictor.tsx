import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchModels, predict } from '../api'
import { useAuth } from '../auth/AuthContext'
import { useChats } from '../chat/ChatContext'
import FileDropzone from '../components/FileDropzone'
import ModelSelector from '../components/ModelSelector'
import ResultCard from '../components/ResultCard'
import SectionHeading from '../components/SectionHeading'
import { getDefaultModel } from '../settings'
import type { FilePrediction, ModelInfo, PredictResponse } from '../types'

export default function Predictor() {
  const { user } = useAuth()
  const { saveChat } = useChats()
  const navigate = useNavigate()
  const [models, setModels] = useState<ModelInfo[]>([])
  const [selectedModel, setSelectedModel] = useState(() => getDefaultModel() || 'random_forest')
  const [file1, setFile1] = useState<File | null>(null)
  const [file2, setFile2] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<PredictResponse | null>(null)

  useEffect(() => {
    fetchModels()
      .then((data) => {
        setModels(data.models)
        if (data.models.length > 0 && !data.models.some((m) => m.key === selectedModel)) {
          setSelectedModel(data.models[0].key)
        }
      })
      .catch((err: Error) => setError(err.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const canAnalyse = Boolean(file1 && file2 && selectedModel) && !loading

  const handleAnalyse = async () => {
    if (!file1 || !file2) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await predict(file1, file2, selectedModel)
      setResult(data)
      // Store the run as a chat so it appears in the sidebar...
      const created = await saveChat(`${file1.name} vs ${file2.name}`, data.model, data)
      // ...and jump into that chat, giving a beat to see the results land here first
      if (created) {
        window.setTimeout(() => navigate(`/dashboard/chat/${created.id}`), 900)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const summary = (files: FilePrediction[]) => {
    const buggy = files.filter((f) => f.prediction === 1).length
    return { buggy, total: files.length }
  }

  return (
    <div className="pb-16">
      {/* Page header */}
      <div className="mb-10">
        <p className="font-mono text-accent mb-2 text-[0.65rem] tracking-[0.3em] uppercase">
          Bug Predictor
        </p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight uppercase sm:text-4xl">
          {user ? `Hello, ${user.name.split(' ')[0]}` : 'Score two files'}
        </h1>
        <p className="text-muted mt-3 max-w-xl text-sm leading-relaxed">
          Upload two C# or JavaScript source files. Twenty-four source-code and code-smell
          metrics are extracted from each file and scored by a machine-learning model to
          predict whether the file is bug-prone.
        </p>
      </div>

      {/* Upload section */}
      <section>
        <SectionHeading index="01" title="Upload source files" />
        <div className="grid gap-4 sm:grid-cols-2">
          <FileDropzone label="File A" file={file1} onFileSelected={setFile1} />
          <FileDropzone label="File B" file={file2} onFileSelected={setFile2} />
        </div>
      </section>

      {/* Model section */}
      <section className="mt-12">
        <SectionHeading index="02" title="Select model" />
        {models.length > 0 ? (
          <ModelSelector models={models} selected={selectedModel} onSelect={setSelectedModel} />
        ) : (
          <p className="font-mono text-muted text-xs">
            Loading models from backend
            <span className="load-dot"> ·</span>
            <span className="load-dot"> ·</span>
            <span className="load-dot"> ·</span>
          </p>
        )}
      </section>

      {/* Analyse button */}
      <section className="mt-12 flex justify-center">
        <button
          type="button"
          onClick={handleAnalyse}
          disabled={!canAnalyse}
          className={`font-display rounded-xl px-12 py-4 text-sm font-bold tracking-[0.18em] uppercase transition-colors ${
            canAnalyse ? 'beam-btn' : 'bg-card text-muted cursor-not-allowed'
          }`}
        >
          {loading ? (
            <span className="inline-flex items-baseline gap-1">
              Analysing
              <span className="load-dot">·</span>
              <span className="load-dot">·</span>
              <span className="load-dot">·</span>
            </span>
          ) : (
            'Analyse & Predict'
          )}
        </button>
      </section>

      {/* Error */}
      {error && (
        <div className="border-accent-2/40 bg-accent-2/10 text-accent-2 rise-in mt-8 rounded-xl border px-5 py-4 text-sm">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <section className="mt-14">
          <SectionHeading index="03" title="Prediction results" />
          <div className="text-muted mb-6 flex flex-wrap items-center justify-between gap-3 text-xs">
            <p>
              Model{' '}
              <span className="font-mono text-ink font-semibold">{result.model}</span> · test
              accuracy{' '}
              <span className="font-mono text-ink">{result.model_accuracy.toFixed(2)}%</span>
            </p>
            <p className="font-mono">
              <span className="text-accent-2 font-semibold">
                {summary(result.files).buggy}/{summary(result.files).total}
              </span>{' '}
              files flagged buggy
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {result.files.map((f) => (
              <ResultCard key={`${f.filename}-${f.language}`} result={f} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
