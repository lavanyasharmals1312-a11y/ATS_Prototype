import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

export function formatExperience(years: number | null | undefined): string {
  if (years == null) return '—'
  if (years < 1) return '< 1 yr'
  return `${years} yr${years === 1 ? '' : 's'}`
}

export function formatConfidence(value: number): string {
  return `${Math.round(value * 100)}%`
}

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { detail?: string | { msg: string }[] } } }).response
    const detail = response?.data?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}
