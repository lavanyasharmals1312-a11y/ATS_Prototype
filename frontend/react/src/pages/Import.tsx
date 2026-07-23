import { useState, useCallback, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { FileSpreadsheet, Upload, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { StatusBadge } from '@/components/candidates/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useImportBatches, useImportBatch, useUploadTracker } from '@/hooks/useImport'
import { formatDate, cn } from '@/lib/utils'

function ImportBatchDetail({ id }: { id: string }) {
  const { data: batch, isLoading } = useImportBatch(id)

  if (isLoading || !batch) {
    return (
      <div className="mt-2 rounded bg-surface-2 p-4">
        <Skeleton className="h-4 w-48" />
      </div>
    )
  }

  return (
    <div className="mt-2 rounded bg-surface-2 p-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <p className="text-xs text-text-3 uppercase tracking-widest">Total Rows</p>
          <p className="mt-0.5 text-lg font-bold text-text tabular-nums">{batch.total_rows}</p>
        </div>
        <div>
          <p className="text-xs text-text-3 uppercase tracking-widest">Successful</p>
          <p className="mt-0.5 text-lg font-bold text-success tabular-nums">{batch.successful_rows}</p>
        </div>
        <div>
          <p className="text-xs text-text-3 uppercase tracking-widest">Duplicates</p>
          <p className="mt-0.5 text-lg font-bold text-warning tabular-nums">{batch.duplicate_rows}</p>
        </div>
        <div>
          <p className="text-xs text-text-3 uppercase tracking-widest">Errors</p>
          <p className={cn('mt-0.5 text-lg font-bold tabular-nums', batch.error_rows > 0 ? 'text-error' : 'text-text-3')}>
            {batch.error_rows}
          </p>
        </div>
      </div>

      {batch.error_log && batch.error_log.length > 0 && (
        <div className="mt-3">
          <p className="mb-1 text-xs font-medium text-error flex items-center gap-1">
            <AlertCircle className="h-3 w-3" aria-hidden="true" />
            Error Log
          </p>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {batch.error_log.map((log: Record<string, unknown>, i: number) => (
              <p key={i} className="text-xs text-text-3">
                Row {String(log.row ?? '?')}: {String(log.error ?? 'Unknown error')}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Import() {
  const shouldReduceMotion = useReducedMotion()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const { data, isLoading, isError } = useImportBatches()
  const { mutate: uploadTracker, isPending: isUploading } = useUploadTracker()

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      uploadTracker(file)
      if (fileInputRef.current) fileInputRef.current.value = ''
    },
    [uploadTracker],
  )

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }, [])

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <PageHeader
        title="Import Tracker"
        description="Import historical Excel tracker files"
        actions={
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xls,.xlsx,.csv"
              onChange={handleFileChange}
              className="sr-only"
              aria-hidden="true"
            />
            <Button
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="h-4 w-4 mr-1.5" aria-hidden="true" />
              {isUploading ? 'Uploading...' : 'Upload Tracker'}
            </Button>
          </>
        }
      />

      <div className="rounded-lg border border-border bg-surface p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-info/10 p-2">
            <FileSpreadsheet className="h-5 w-5 text-info" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-text">Excel Tracker Import</h3>
            <p className="mt-1 text-xs text-text-3">
              Upload .xlsx or .xls files exported from candidate trackers.
              The system will parse rows and match against existing candidates.
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={FileSpreadsheet}
          title="Failed to load imports"
          description="Could not load import history."
        />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={FileSpreadsheet}
          title="No imports yet"
          description="Upload a tracker file to see import history here."
        />
      ) : (
        <div className="space-y-2">
          {data.items.map((batch) => (
            <div key={batch.id} className="rounded-lg border border-border bg-surface overflow-hidden">
              <button
                onClick={() => toggleExpand(batch.id)}
                className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-surface-2"
                aria-expanded={expandedId === batch.id}
              >
                {expandedId === batch.id ? (
                  <ChevronDown className="h-4 w-4 shrink-0 text-text-3" aria-hidden="true" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-text-3" aria-hidden="true" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text truncate">{batch.original_filename}</p>
                  <p className="text-xs text-text-3 tabular-nums">{formatDate(batch.created_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={batch.status} />
                  <span className="text-xs text-text-4 tabular-nums">{batch.total_rows} rows</span>
                </div>
              </button>
              {expandedId === batch.id && <ImportBatchDetail id={batch.id} />}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
