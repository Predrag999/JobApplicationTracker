import { apiClient } from './client'
import type { AttachmentResponse } from '@/types'

export function listAttachments(applicationId: string) {
  return apiClient.get<AttachmentResponse[]>(`/applications/${applicationId}/attachments`)
}

export function uploadAttachment(applicationId: string, file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return apiClient.upload<AttachmentResponse>(`/applications/${applicationId}/attachments`, formData)
}

export function deleteAttachment(attachmentId: string) {
  return apiClient.delete(`/attachments/${attachmentId}`)
}

export function getDownloadUrl(attachmentId: string) {
  return `http://localhost:8080/api/attachments/${attachmentId}/download`
}
