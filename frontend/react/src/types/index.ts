// ─── Auth ───────────────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  full_name: string
  role: string
  is_active: boolean
}

export interface LoginRequest {
  email: string
  password: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  user: User
}

// ─── API Envelopes ──────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pages: number
  page_size: number
}

// ─── Candidates ─────────────────────────────────────────────────────────────

export interface CandidateFilters {
  search?: string
  skills?: string
  location?: string
  experience_min?: number
  experience_max?: number
  notice_period?: string
  source?: string
  page?: number
  page_size?: number
}

export interface CandidateListItem {
  id: string
  candidate_name: string | null
  candidate_email: string | null
  candidate_phone: string | null
  current_designation: string | null
  current_company: string | null
  experience_years: number | null
  current_location: string | null
  notice_period: string | null
  skills: string[] | null
  source: string | null
  duplicate_status: string | null
  created_at: string
}

export interface ResumeInfo {
  id: string
  original_filename: string
  uploaded_at: string
}

export interface Candidate extends CandidateListItem {
  preferred_location: string | null
  current_ctc: string | null
  expected_ctc: string | null
  highest_qualification: string | null
  university: string | null
  tags: string[] | null
  notes: string | null
  is_active: boolean
  updated_at: string
  resumes: ResumeInfo[]
}

export interface CandidateUpdate {
  candidate_name?: string
  candidate_email?: string
  candidate_phone?: string
  current_designation?: string
  current_company?: string
  experience_years?: number
  current_location?: string
  preferred_location?: string
  notice_period?: string
  current_ctc?: string
  expected_ctc?: string
  highest_qualification?: string
  university?: string
  skills?: string[]
  tags?: string[]
  notes?: string
}

// ─── Resumes & Parse Jobs ───────────────────────────────────────────────────

export type ParseJobStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface ResumeUploadResponse {
  resume_id: string
  parse_job_id: string
  status: string
  message: string
}

export interface ParseJob {
  id: string
  resume_id: string
  status: ParseJobStatus
  parser_used: string | null
  error_message: string | null
  parsed_data: Record<string, unknown> | null
  candidate_id: string | null
  created_at: string
  started_at: string | null
  completed_at: string | null
}

// ─── Duplicates ─────────────────────────────────────────────────────────────

export type DuplicateStatus = 'pending' | 'confirmed' | 'dismissed'

export interface DuplicateFlag {
  id: string
  candidate_a: CandidateListItem
  candidate_b: CandidateListItem
  reason: string
  confidence: number
  status: DuplicateStatus
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

export interface ResolveDuplicateRequest {
  status: 'confirmed' | 'dismissed'
}

// ─── Imports ────────────────────────────────────────────────────────────────

export interface ImportBatch {
  id: string
  original_filename: string
  total_rows: number
  successful_rows: number
  duplicate_rows: number
  error_rows: number
  status: string
  error_log: Record<string, unknown>[] | null
  created_at: string
  completed_at: string | null
}

export interface ImportUploadResponse {
  import_batch_id: string
  status: string
  message: string
}

// ─── Stats ──────────────────────────────────────────────────────────────────

export interface Stats {
  total_candidates: number
  candidates_this_month: number
  pending_duplicates: number
  resumes_uploaded: number
  failed_parse_jobs: number
  skills_indexed: number
}

// ─── Nav ────────────────────────────────────────────────────────────────────

export interface NavItem {
  label: string
  href: string
  icon: string
}
