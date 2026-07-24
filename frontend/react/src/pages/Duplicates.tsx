import { useState, useCallback } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Copy, Search } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { DuplicateComparison } from '@/components/duplicates/DuplicateComparison'
import { useDuplicates, useResolveDuplicate, useScanDuplicates } from '@/hooks/useDuplicates'
import { cn } from '@/lib/utils'

type StatusFilter = 'pending' | 'confirmed' | 'dismissed'
const TABS: { value: StatusFilter; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'dismissed', label: 'Dismissed' },
]

export default function Duplicates() {
  const shouldReduceMotion = useReducedMotion()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending')

  const { data, isLoading, isError } = useDuplicates({ status: statusFilter, page_size: 50 })
  const { data: pendingData } = useDuplicates({ status: 'pending', page_size: 1 })
  const { mutate: resolveDuplicate, isPending: isResolving } = useResolveDuplicate()
  const { mutate: scanDuplicates, isPending: isScanning } = useScanDuplicates()

  const handleResolve = useCallback(
    (id: string, status: 'confirmed' | 'dismissed') => {
      resolveDuplicate({ id, data: { status } })
    },
    [resolveDuplicate],
  )

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <PageHeader
        title="Duplicates"
        description="Review and resolve duplicate candidates in your pipeline"
        actions={
          <Button size="sm" onClick={() => scanDuplicates()} disabled={isScanning}>
            <Search className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {isScanning ? 'Scanning…' : 'Scan for duplicates'}
          </Button>
        }
      />

      {/* Segmented tab control */}
      <div className="mb-5">
        <div
          className="inline-flex rounded-lg bg-surface-2 p-0.5"
          role="tablist"
          aria-label="Duplicate status filter"
        >
          {TABS.map((tab) => (
            <button
              key={tab.value}
              role="tab"
              aria-selected={statusFilter === tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                'relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent',
                statusFilter === tab.value
                  ? 'bg-surface-3 text-text shadow-sm'
                  : 'text-text-3 hover:text-text-2',
              )}
            >
              {tab.label}
              {tab.value === 'pending' &&
                pendingData &&
                pendingData.total > 0 && (
                  <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-warning/20 px-1 text-[10px] font-semibold text-warning">
                    {pendingData.total}
                  </span>
                )}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-surface p-5">
              <div className="mb-4">
                <Skeleton className="h-3 w-48" />
              </div>
              <div className="flex gap-5">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-44" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="flex items-center px-5">
                  <div className="h-12 w-px bg-border" />
                </div>
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-44" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={Copy}
          title="Failed to load duplicates"
          description="There was an error loading duplicate flags. Please try again."
        />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={Copy}
          title={
            statusFilter === 'pending'
              ? 'No pending duplicates'
              : `No ${statusFilter} duplicates`
          }
          description={
            statusFilter === 'pending'
              ? 'All clear — no pending duplicates to review. Run a scan to check for new matches.'
              : `No duplicates have been ${statusFilter} yet.`
          }
          action={
            statusFilter === 'pending' ? (
              <Button size="sm" onClick={() => scanDuplicates()} disabled={isScanning}>
                <Search className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                {isScanning ? 'Scanning…' : 'Scan now'}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-text-3 tabular-nums">
            {data.total} result{data.total !== 1 ? 's' : ''}
          </p>
          {data.items.map((duplicate) => (
            <DuplicateComparison
              key={duplicate.id}
              duplicate={duplicate}
              onResolve={(status) => handleResolve(duplicate.id, status)}
              isResolving={isResolving}
            />
          ))}
          {data.pages > 1 && (
            <p className="text-center text-xs text-text-3 tabular-nums">
              Page {data.page} of {data.pages}
            </p>
          )}
        </div>
      )}
    </motion.div>
  )
}
