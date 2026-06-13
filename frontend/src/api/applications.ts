import { apiClient } from './client'
import type {
  ApplicationResponse,
  AutofillResponse,
  CreateApplicationRequest,
  PagedResponse,
  UpdateApplicationRequest,
  ApplicationStatus,
} from '@/types'

export interface ListApplicationsParams {
  status?: ApplicationStatus
  search?: string
  page?: number
  size?: number
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}

export function listApplications(params: ListApplicationsParams = {}) {
  const query = new URLSearchParams()
  if (params.status) query.set('status', params.status)
  if (params.search) query.set('search', params.search)
  if (params.page != null) query.set('page', String(params.page))
  if (params.size != null) query.set('size', String(params.size))
  if (params.sortBy) query.set('sortBy', params.sortBy)
  if (params.sortDir) query.set('sortDir', params.sortDir)
  const qs = query.toString()
  return apiClient.get<PagedResponse<ApplicationResponse>>(
    `/applications${qs ? `?${qs}` : ''}`,
  )
}

export function getApplication(id: string) {
  return apiClient.get<ApplicationResponse>(`/applications/${id}`)
}

export function createApplication(data: CreateApplicationRequest) {
  return apiClient.post<ApplicationResponse>('/applications', data)
}

export function updateApplication(id: string, data: UpdateApplicationRequest) {
  return apiClient.put<ApplicationResponse>(`/applications/${id}`, data)
}

export function deleteApplication(id: string) {
  return apiClient.delete(`/applications/${id}`)
}

export function autofillApplication(url: string) {
  return apiClient.get<AutofillResponse>(`/applications/autofill?url=${encodeURIComponent(url)}`)
}
