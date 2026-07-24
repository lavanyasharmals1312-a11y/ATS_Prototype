import { useNavigate } from 'react-router-dom'
import {
  Users,
  TrendingUp,
  Copy,
  FileText,
  AlertCircle,
  Tag,
  Upload,
  FileSpreadsheet,
  ArrowRight,
} from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { StatCard } from '@/components/common/StatCard'
import { useStats } from '@/hooks/useStats'
import { useCandidates } from '@/hooks/useCandidates'
import { formatDate, formatExperience } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export default function Dashboard() {
  const navigate = useNavigate()
  const { data: stats, isLoading, isError } = useStats()
  const { data: recentData, isLoading: recentLoading } = useCandidates({ page_size: 5, page: 1 })

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your talent pipeline"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Total Candidates"
          value={stats?.total_candidates}
          icon={Users}
          isLoading={isLoading}
          isError={isError}
        />
        <StatCard
          label="This Month"
          value={stats?.candidates_this_month}
          icon={TrendingUp}
          isLoading={isLoading}
          isError={isError}
        />
        <StatCard
          label="Pending Duplicates"
          value={stats?.pending_duplicates}
          icon={Copy}
          isLoading={isLoading}
          isError={isError}
          attentionColor="warning"
        />
        <StatCard
          label="Resumes Uploaded"
          value={stats?.resumes_uploaded}
          icon={FileText}
          isLoading={isLoading}
          isError={isError}
        />
        <StatCard
          label="Failed Parses"
          value={stats?.failed_parse_jobs}
          icon={AlertCircle}
          isLoading={isLoading}
          isError={isError}
          attentionColor="error"
        />
        <StatCard
          label="Skills Indexed"
          value={stats?.skills_indexed}
          icon={Tag}
          isLoading={isLoading}
          isError={isError}
        />
      </div>

      {/* Quick Actions + Recent Candidates */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-text-3">
            Quick Actions
          </p>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/upload')}
              className="flex w-full items-center gap-3 rounded-lg border border-border bg-surface p-4 text-left transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent/10">
                <Upload className="h-4 w-4 text-accent" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-medium text-text">Upload Resume</p>
                <p className="text-xs text-text-3">Parse and add a single candidate</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/import')}
              className="flex w-full items-center gap-3 rounded-lg border border-border bg-surface p-4 text-left transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent/10">
                <FileSpreadsheet className="h-4 w-4 text-accent" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-medium text-text">Import Tracker</p>
                <p className="text-xs text-text-3">Bulk import from Excel spreadsheet</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/duplicates')}
              className="flex w-full items-center gap-3 rounded-lg border border-border bg-surface p-4 text-left transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent/10">
                <Copy className="h-4 w-4 text-accent" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-text">Review Duplicates</p>
                  {stats && stats.pending_duplicates > 0 && (
                    <span className="inline-flex items-center rounded-full bg-warning/10 px-1.5 py-0.5 text-[10px] font-semibold text-warning">
                      {stats.pending_duplicates}
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-3">Resolve potential duplicate entries</p>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Candidates */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-text-3">
              Recent Candidates
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/candidates')}
              className="text-xs text-text-3 hover:text-text"
            >
              View all
              <ArrowRight className="ml-1 h-3 w-3" aria-hidden="true" />
            </Button>
          </div>

          <div className="rounded-lg border border-border bg-surface overflow-hidden">
            {recentLoading ? (
              <div className="divide-y divide-border/50">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20 ml-auto" />
                  </div>
                ))}
              </div>
            ) : !recentData || recentData.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Users className="h-5 w-5 text-text-4 mb-2" aria-hidden="true" />
                <p className="text-sm text-text-3">No candidates yet</p>
                <p className="text-xs text-text-4">Upload a resume to get started</p>
              </div>
            ) : (
              <table className="w-full text-sm" aria-label="Recent candidates">
                <thead>
                  <tr className="border-b border-border bg-surface-2/60">
                    <th scope="col" className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-text-3">
                      Name
                    </th>
                    <th scope="col" className="hidden px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-text-3 sm:table-cell">
                      Role
                    </th>
                    <th scope="col" className="hidden px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-text-3 md:table-cell">
                      Exp
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-widest text-text-3">
                      Added
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {recentData.items.map((c) => (
                    <tr
                      key={c.id}
                      className="cursor-pointer transition-colors hover:bg-surface-2"
                      onClick={() => navigate(`/candidates/${c.id}`)}
                    >
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-text">{c.candidate_name ?? '—'}</p>
                        <p className="text-xs text-text-3">{c.candidate_email ?? ''}</p>
                      </td>
                      <td className="hidden px-4 py-2.5 sm:table-cell">
                        <p className="text-text-2">{c.current_designation ?? '—'}</p>
                        <p className="text-xs text-text-4">{c.current_company ?? ''}</p>
                      </td>
                      <td className="hidden px-4 py-2.5 text-text-2 md:table-cell">
                        {formatExperience(c.experience_years)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs text-text-4 tabular-nums">
                        {formatDate(c.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
