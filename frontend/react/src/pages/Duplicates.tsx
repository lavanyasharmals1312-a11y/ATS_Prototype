import { useState, useCallback } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Copy, Search } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { DuplicateComparison } from '@/components/duplicates/DuplicateComparison'
import { useDuplicates, useResolveDuplicate, useScanDuplicates } from '@/hooks/useDuplicates'

export default function Duplicates() {
  const shouldReduceMotion = useReducedMotion()
  const [statusFilter, setStatusFilter] = useState<string>('pending')

  const { data, isLoading, isError } = useDuplicates({ status: statusFilter, page_size: 50 })
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
        description="Review and resolve duplicate candidates"
        actions={
          <Button size="sm" onClick={() => scanDuplicates()} disabled={isScanning}>
            <Search className="h-4 w-4 mr-1.5" aria-hidden="true" />
            {isScanning ? 'Scanning...' : 'Scan for duplicates'}
          </Button>
        }
      />

      <div className="mb-4 flex items-center gap-2">
        {['pending', 'confirmed', 'dismissed'].map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setStatusFilter(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-surface p-8">
              <div className="flex gap-4">
                <div className="flex-1 space-y-3">
                  <div className="h-4 w-32 animate-pulse rounded bg-surface-2" />
                  <div className="h-3 w-48 animate-pulse rounded bg-surface-2" />
                  <div className="h-3 w-24 animate-pulse rounded bg-surface-2" />
                </div>
                <div className="flex items-center">
                  <div className="h-6 w-6 animate-pulse rounded bg-surface-2" />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="h-4 w-32 animate-pulse rounded bg-surface-2" />
                  <div className="h-3 w-48 animate-pulse rounded bg-surface-2" />
                  <div className="h-3 w-24 animate-pulse rounded bg-surface-2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={Copy}
          title="Failed to load duplicates"
          description="There was an error loading duplicate flags."
        />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={Copy}
          title="No duplicates found"
          description={
            statusFilter === 'pending'
              ? 'No pending duplicates to review. Run a scan to check for new matches.'
              : `No ${statusFilter} duplicates.`
          }
        />
      ) : (
        <div className="space-y-4">
          {data.items.map((duplicate) => (
            <DuplicateComparison
              key={duplicate.id}
              duplicate={duplicate}
              onResolve={(status) => handleResolve(duplicate.id, status)}
              isResolving={isResolving}
            />
          ))}
          {data.pages > 1 && (
            <p className="text-center text-sm text-text-3 tabular-nums">
              Page {data.page} of {data.pages}
            </p>
          )}
        </div>
      )}
    </motion.div>
  )
}
