import { useState, useCallback, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { FileSpreadsheet, Upload, ChevronDown, ChevronRight, AlertCircle, Info } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { StatusBadge } from '@/components/candidates/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useImportBatches, useImportBatch, useUploadTracker } from '@/hooks/useImport'
import { formatDate } from '@/lib/utils'

function ErrorLogPanel({ id }: { id: string }) {
  const { data: batch, isLoading } = useImportBatch(id)
  if (isLoading) {
    return (
      <tr>
        <td colSpan={7} className="bg-surface-2 px-4 py-3">
          <Skeleton className="h-4 w-48" />
        </td>
      </tr>
    )
  }
  if (!batch?.error_log || batch.error_log.length === 0) {
    return (
      <tr>
        <td colSpan={7} className="bg-surface-2 px-4 py-3 text-xs text-text-3">
          No error details available.
        </td>
      </tr>
    )
  }
  return (
    <tr>
      <td colSpan={7} className="bg-surface-2 px-4 py-3">
        <p className="mb-1.5 flex items-center gap-1 text-xs font-medium text-error">
          <AlertCircle className="h-3 w-3" aria-hidden="true" />
          Error Log
        </p>
        <div className="max-h-32 overflow-y-auto space-y-0.5">
          {batch.error_log.map((log, i) => (
            <p key={i} className="text-xs text-text-3">
              Row {String(log.row ?? '?')}: {String(log.error ?? 'Unknown error')}
            </p>
          ))}
        </div>
      </td>
    </tr>
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
              tabIndex={-1}
            />
            <Button
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {isUploading ? 'Uploading…' : 'Upload Tracker'}
            </Button>
          </>
        }
      />

      {/* Info callout */}
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-info/20 bg-info/5 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium text-text">Excel Tracker Import</p>
          <p className="mt-0.5 text-xs text-text-3">
            Upload .xlsx or .xls files exported from candidate trackers. The system will parse rows and match against existing candidates.
          </p>
        </div>
      </div>

      {/* Import history table */}
      {isLoading ? (
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="divide-y divide-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-5 w-20 rounded-sm" />
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
      ) : isError ? (
        <EmptyState
          icon={FileSpreadsheet}
          title="Failed to load imports"
          description="Could not load import history. Please try again."
        />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={FileSpreadsheet}
          title="No imports yet"
          description="Upload a tracker file above to see import history here."
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Import history">
              <thead>
                <tr className="border-b border-border bg-surface-2/60">
                  <th scope="col" className="w-8 px-4 py-2.5" aria-label="Expand" />
                  <th scope="col" className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-text-3">
                    File
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-text-3">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-widest text-text-3">
                    Total
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-widest text-text-3">
                    Success
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-widest text-text-3">
                    Dupes
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-widest text-text-3">
                    Errors
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-widest text-text-3">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {data.items.map((batch) => (
                  <>
                    <tr
                      key={batch.id}
                      className="cursor-pointer transition-colors hover:bg-surface-2"
                      onClick={() => toggleExpand(batch.id)}
                    >
                      <td className="px-4 py-2.5 text-text-4">
                        <button
                          aria-expanded={expandedId === batch.id}
                          aria-label={expandedId === batch.id ? 'Collapse error log' : 'Expand error log'}
                          className="flex items-center justify-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded"
                          tabIndex={-1}
                        >
                          {expandedId === batch.id ? (
                            <ChevronDown className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            <ChevronRight className="h-4 w-4" aria-hidden="true" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-2.5">
                        <p className="truncate text-sm font-medium text-text max-w-[200px]" title={batch.original_filename}>
                          {batch.original_filename}
                        </p>
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={batch.status} />
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs tabular-nums text-text-2">
                        {batch.total_rows}
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs tabular-nums">
                        <span className={batch.successful_rows > 0 ? 'text-success font-medium' : 'text-text-4'}>
                          {batch.successful_rows}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs tabular-nums">
                        <span className={batch.duplicate_rows > 0 ? 'text-warning font-medium' : 'text-text-4'}>
                          {batch.duplicate_rows}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs tabular-nums">
                        <span className={batch.error_rows > 0 ? 'text-error font-medium' : 'text-text-4'}>
                          {batch.error_rows}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs tabular-nums text-text-4">
                        {formatDate(batch.created_at)}
                      </td>
                    </tr>
                    {expandedId === batch.id && (
                      <ErrorLogPanel key={`${batch.id}-detail`} id={batch.id} />
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  )
}
