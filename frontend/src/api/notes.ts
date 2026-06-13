import { apiClient } from './client'
import type { NoteResponse, CreateNoteRequest, GeneratedNoteResponse } from '@/types'

export function listNotes(applicationId: string) {
  return apiClient.get<NoteResponse[]>(`/applications/${applicationId}/notes`)
}

export function createNote(applicationId: string, data: CreateNoteRequest) {
  return apiClient.post<NoteResponse>(`/applications/${applicationId}/notes`, data)
}

export function deleteNote(applicationId: string, noteId: string) {
  return apiClient.delete(`/applications/${applicationId}/notes/${noteId}`)
}

export function generateNote(applicationId: string) {
  return apiClient.post<GeneratedNoteResponse>(`/applications/${applicationId}/notes/generate`, {})
}
