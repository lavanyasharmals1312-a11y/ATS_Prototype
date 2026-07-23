import { useCallback, useRef, useState } from 'react'
import { Upload, FileText, AlertCircle } from 'lucide-react'
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

export function ResumeDropzone({ onFileSelect, isUploading, disabled }: ResumeDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateAndSet = useCallback(
    (file: File) => {
      setError(null)

      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError('Unsupported file type. Accepted: PDF, DOC, DOCX, XLS, XLSX, TXT')
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
    <div
      className={cn(
        'relative rounded-lg border-2 border-dashed p-12 text-center transition-colors cursor-pointer',
        isDragOver
          ? 'border-accent bg-accent/5'
          : error
            ? 'border-error/50 bg-error/5'
            : 'border-border hover:border-accent/50 hover:bg-surface-2',
        (disabled || isUploading) && 'pointer-events-none opacity-60',
      )}
      onClick={() => inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      role="button"
      tabIndex={0}
      aria-label="Upload resume file"
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
      />

      {isUploading ? (
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
            <div className="h-5 w-5 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
          </div>
          <p className="text-sm font-medium text-text-2">Uploading and parsing...</p>
          <p className="text-xs text-text-4">This may take a moment</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
            {error ? (
              <AlertCircle className="h-5 w-5 text-error" aria-hidden="true" />
            ) : (
              <Upload className="h-5 w-5 text-accent" aria-hidden="true" />
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-text-2">
              <span className="text-accent">Click to upload</span> or drag and drop
            </p>
            <p className="mt-1 text-xs text-text-4">
              PDF, DOC, DOCX, XLS, XLSX, or TXT — up to 10MB
            </p>
          </div>

          {error && (
            <p className="text-sm text-error flex items-center gap-1.5" role="alert">
              <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
