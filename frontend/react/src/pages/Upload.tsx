import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { UploadCloud } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { ResumeDropzone } from '@/components/upload/ResumeDropzone'
import { ParseStatusPoller } from '@/components/upload/ParseStatusPoller'
import { resumeService } from '@/services/resumeService'

export default function Upload() {
  const navigate = useNavigate()
  const shouldReduceMotion = useReducedMotion()
  const [parseJobId, setParseJobId] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileSelect = useCallback(async (file: File) => {
    setIsUploading(true)
    setParseJobId(null)
    try {
      const response = await resumeService.upload(file)
      setParseJobId(response.parse_job_id)
    } catch {
      setIsUploading(false)
    } finally {
      setIsUploading(false)
    }
  }, [])

  const handleRetry = useCallback(() => {
    setParseJobId(null)
  }, [])

  const handleComplete = useCallback(
    (candidateId: string | null) => {
      if (candidateId) {
        navigate(`/candidates/${candidateId}`)
      }
    },
    [navigate],
  )

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <PageHeader
        title="Upload Resume"
        description="Upload and parse candidate resumes"
      />

      <div className="mx-auto max-w-2xl">
        <ResumeDropzone
          onFileSelect={handleFileSelect}
          isUploading={isUploading}
        />

        {parseJobId && (
          <ParseStatusPoller
            parseJobId={parseJobId}
            onRetry={handleRetry}
            onComplete={handleComplete}
          />
        )}

        {!parseJobId && !isUploading && (
          <div className="mt-8 rounded-lg border border-border bg-surface p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-info/10 p-2">
                <UploadCloud className="h-5 w-5 text-info" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-text">Supported formats</h3>
                <ul className="mt-2 space-y-1 text-xs text-text-3">
                  <li>PDF, DOC, DOCX — standard resumes</li>
                  <li>XLS, XLSX — structured spreadsheets</li>
                  <li>TXT — plain text resumes</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
