export type ApplicationStatus =
  | 'APPLIED'
  | 'PHONE_SCREEN'
  | 'INTERVIEW'
  | 'TECHNICAL_TEST'
  | 'OFFER'
  | 'REJECTED'
  | 'WITHDRAWN'

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  'APPLIED',
  'PHONE_SCREEN',
  'INTERVIEW',
  'TECHNICAL_TEST',
  'OFFER',
  'REJECTED',
  'WITHDRAWN',
]

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  APPLIED: 'Applied',
  PHONE_SCREEN: 'Phone Screen',
  INTERVIEW: 'Interview',
  TECHNICAL_TEST: 'Technical Test',
  OFFER: 'Offer',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
}

export interface ApplicationResponse {
  id: string
  companyName: string
  jobTitle: string
  jobUrl?: string
  status: ApplicationStatus
  appliedDate: string
  deadlineDate?: string
  createdAt: string
  updatedAt: string
  noteCount: number
  attachmentCount: number
}

export interface PagedResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export interface NoteResponse {
  id: string
  content: string
  createdAt: string
}

export interface AttachmentResponse {
  id: string
  originalFileName: string
  contentType: string
  fileSizeBytes: number
  createdAt: string
}

export interface StatsResponse {
  total: number
  byStatus: Record<ApplicationStatus, number>
  activeCount: number
  offerCount: number
  rejectedCount: number
}

export interface CreateApplicationRequest {
  companyName: string
  jobTitle: string
  jobUrl?: string
  status: ApplicationStatus
  appliedDate: string
  deadlineDate?: string
}

export type UpdateApplicationRequest = CreateApplicationRequest

export interface CreateNoteRequest {
  content: string
}

export interface AutofillResponse {
  companyName: string
  jobTitle: string
  jobUrl: string
}
