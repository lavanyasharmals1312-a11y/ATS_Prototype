import { useState, useCallback } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { toast } from 'sonner'
import { PageHeader } from '@/components/common/PageHeader'
import { ResumeDropzone } from '@/components/upload/ResumeDropzone'
import { ParseStatusPoller } from '@/components/upload/ParseStatusPoller'
import { resumeService } from '@/services/resumeService'
import { getApiErrorMessage } from '@/lib/utils'

export default function Upload() {
  const shouldReduceMotion = useReducedMotion()
  const [parseJobId, setParseJobId] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileSelect = useCallback(async (file: File) => {
    setIsUploading(true)
    setParseJobId(null)
    try {
      const response = await resumeService.upload(file)
      setParseJobId(response.parse_job_id)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Upload failed. Please try again.'))
    } finally {
      setIsUploading(false)
    }
  }, [])

  const handleRetry = useCallback(() => {
    setParseJobId(null)
  }, [])

  // onComplete is handled inside ParseStatusPoller now (navigates to candidate)

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <PageHeader
        title="Upload Resume"
        description="Upload a resume file to parse and create a candidate profile"
      />

      <div className="mx-auto max-w-2xl">
        {!parseJobId && (
          <ResumeDropzone
            onFileSelect={handleFileSelect}
            isUploading={isUploading}
          />
        )}

        {parseJobId && (
          <ParseStatusPoller
            parseJobId={parseJobId}
            onRetry={handleRetry}
          />
        )}
      </div>
    </motion.div>
  )
}
