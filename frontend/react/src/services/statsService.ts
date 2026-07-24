import { api } from './api'
import type { Stats } from '@/types'

export const statsService = {
  get: () => api.get<Stats>('/stats').then((r) => r.data),
}
