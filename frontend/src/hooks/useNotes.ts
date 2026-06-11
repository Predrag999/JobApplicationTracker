import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listNotes, createNote, deleteNote } from '@/api/notes'
import type { CreateNoteRequest } from '@/types'

export function useNotes(applicationId: string) {
  return useQuery({
    queryKey: ['notes', applicationId],
    queryFn: () => listNotes(applicationId),
    enabled: !!applicationId,
  })
}

export function useCreateNote(applicationId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateNoteRequest) => createNote(applicationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', applicationId] })
      queryClient.invalidateQueries({ queryKey: ['applications', applicationId] })
    },
  })
}

export function useDeleteNote(applicationId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (noteId: string) => deleteNote(applicationId, noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', applicationId] })
      queryClient.invalidateQueries({ queryKey: ['applications', applicationId] })
    },
  })
}
