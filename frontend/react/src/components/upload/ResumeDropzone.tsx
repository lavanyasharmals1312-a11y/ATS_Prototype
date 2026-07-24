import { useCallback, useRef, useState } from 'react'
import { Upload, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ResumeDropzoneProps {
  onFileSelect: (file: File) => void
  isUploading: boolean
  disabled?: boolean
}

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
]

const MAX_SIZE = 10 * 1024 * 1024 // 10MB

const FORMAT_CHIPS = ['PDF', 'DOC', 'DOCX', 'TXT']

export function ResumeDropzone({ onFileSelect, isUploading, disabled }: ResumeDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateAndSet = useCallback(
    (file: File) => {
      setError(null)
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError('Unsupported file type. Accepted: PDF, DOC, DOCX, TXT')
        return
      }
      if (file.size > MAX_SIZE) {
        setError('File too large. Maximum size is 10MB')
        return
      }
      onFileSelect(file)
    },
    [onFileSelect],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) validateAndSet(file)
    },
    [validateAndSet],
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) validateAndSet(file)
    },
    [validateAndSet],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  return (
    <div className="space-y-3">
      <div
        className={cn(
          'relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-14 text-center transition-all',
          isDragOver
            ? 'border-accent bg-accent/5'
            : error
              ? 'border-error/40 bg-error/5'
              : 'border-border hover:border-accent/50 hover:bg-surface-2',
          (disabled || isUploading) && 'pointer-events-none opacity-60',
        )}
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        role="button"
        tabIndex={disabled || isUploading ? -1 : 0}
        aria-label="Upload resume file. Click or drag and drop."
        aria-disabled={disabled || isUploading}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
          onChange={handleChange}
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
        />

        {isUploading ? (
          <>
            <div
              className="mb-4 h-10 w-10 rounded-full border-2 border-accent/30 border-t-accent animate-spin"
              aria-hidden="true"
            />
            <p className="text-sm font-medium text-text">Uploading…</p>
            <p className="mt-1 text-xs text-text-3">Processing your resume</p>
          </>
        ) : (
          <>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-2">
              {error ? (
                <AlertCircle className="h-6 w-6 text-error" aria-hidden="true" />
              ) : (
                <Upload className="h-6 w-6 text-text-3" aria-hidden="true" />
              )}
            </div>
            <p className="text-sm font-medium text-text">
              {isDragOver ? 'Drop it here' : 'Drop your resume here'}
            </p>
            <p className="mt-1 text-xs text-text-3">
              or{' '}
              <span className="font-medium text-accent">click to browse</span>
            </p>
            {error && (
              <p className="mt-3 text-xs text-error" role="alert">
                {error}
              </p>
            )}
          </>
        )}
      </div>

      {/* Format chips */}
      <div className="flex items-center justify-center gap-2">
        <p className="text-xs text-text-4">Accepted formats:</p>
        <div className="flex gap-1.5">
          {FORMAT_CHIPS.map((fmt) => (
            <span
              key={fmt}
              className="rounded border border-border bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-text-3"
            >
              {fmt}
            </span>
          ))}
        </div>
        <p className="text-xs text-text-4">up to 10MB</p>
      </div>
    </div>
  )
}
