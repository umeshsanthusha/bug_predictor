import { useRef, useState, type DragEvent } from 'react'

const ACCEPTED_EXTENSIONS = ['.cs', '.csharp', '.js', '.jsx', '.ts', '.tsx']

interface FileDropzoneProps {
  label: string
  file: File | null
  onFileSelected: (file: File | null) => void
}

function isAccepted(name: string): boolean {
  const lower = name.toLowerCase()
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export default function FileDropzone({ label, file, onFileSelected }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [rejected, setRejected] = useState(false)

  const handleFiles = (files: FileList | null) => {
    const selected = files?.[0]
    if (!selected) return
    if (!isAccepted(selected.name)) {
      setRejected(true)
      onFileSelected(null)
      return
    }
    setRejected(false)
    onFileSelected(selected)
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`flex min-h-[9.5rem] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-all duration-200 ${
        dragging
          ? 'dz-hot border-accent bg-accent/5 scale-[1.01]'
          : file
            ? 'border-good/60 bg-panel'
            : rejected
              ? 'border-accent-2/60 bg-panel'
              : 'border-line bg-panel hover:border-accent/50 hover:bg-accent/[0.03]'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(',')}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <span className="font-mono border-line bg-card text-muted rounded-md border px-2 py-0.5 text-[0.6rem] tracking-[0.22em] uppercase">
        {label}
      </span>

      {file ? (
        <>
          <span className="font-mono text-ink max-w-full truncate text-sm font-semibold">
            {file.name}
          </span>
          <span className="font-mono text-muted text-[0.65rem]">
            {formatSize(file.size)} · loaded
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onFileSelected(null)
              setRejected(false)
            }}
            className="font-mono text-muted hover:text-accent-2 hover:underline underline-offset-2 text-[0.65rem] tracking-[0.15em] uppercase transition-colors"
          >
            Remove file
          </button>
        </>
      ) : (
        <>
          <span className={rejected ? 'text-accent-2 text-sm' : 'text-ink text-sm'}>
            {rejected
              ? 'Only .cs / .js / .ts source files are supported'
              : 'Drop a source file or browse'}
          </span>
          <span className="font-mono text-muted text-[0.65rem] tracking-[0.2em] uppercase">
            .cs · .js · .ts
          </span>
        </>
      )}
    </div>
  )
}
