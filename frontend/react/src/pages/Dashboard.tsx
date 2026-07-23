import { PageHeader } from '@/components/common/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'
import { useStats } from '@/hooks/useStats'

const statConfig = [
  { key: 'total_candidates', label: 'Total Candidates' },
  { key: 'candidates_this_month', label: 'This Month' },
  { key: 'pending_duplicates', label: 'Pending Duplicates' },
  { key: 'resumes_uploaded', label: 'Resumes Uploaded' },
  { key: 'failed_parse_jobs', label: 'Failed Parses' },
  { key: 'skills_indexed', label: 'Skills Indexed' },
] as const

export default function Dashboard() {
  const { data: stats, isLoading, isError } = useStats()

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your talent pipeline"
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {statConfig.map(({ key, label }) => (
          <div
            key={key}
            className="rounded-lg border border-border bg-surface p-5 transition-colors hover:bg-surface-2"
          >
            <p className="text-sm font-medium text-text-3 uppercase tracking-widest">
              {label}
            </p>
            {isLoading ? (
              <Skeleton className="mt-2 h-9 w-16" />
            ) : isError ? (
              <p className="mt-2 text-3xl font-bold text-text-4 tabular-nums">—</p>
            ) : (
              <p className="mt-2 text-3xl font-bold text-text tabular-nums">
                {stats?.[key]?.toLocaleString() ?? 0}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-lg border border-border bg-surface p-8 text-center">
        <p className="text-sm text-text-3">
          Recent candidates and activity feed — coming in Phase 10
        </p>
      </div>
    </div>
  )
}
