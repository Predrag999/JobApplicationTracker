import { apiClient } from './client'
import type { StatsResponse } from '@/types'

export function getStats() {
  return apiClient.get<StatsResponse>('/stats')
}
