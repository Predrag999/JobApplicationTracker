import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listApplications,
  getApplication,
  createApplication,
  updateApplication,
  deleteApplication,
  autofillApplication,
  type ListApplicationsParams,
} from '@/api/applications'
import type { CreateApplicationRequest, UpdateApplicationRequest } from '@/types'

export function useApplications(params: ListApplicationsParams = {}) {
  return useQuery({
    queryKey: ['applications', params],
    queryFn: () => listApplications(params),
  })
}

export function useApplication(id: string) {
  return useQuery({
    queryKey: ['applications', id],
    queryFn: () => getApplication(id),
    enabled: !!id,
  })
}

export function useCreateApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateApplicationRequest) => createApplication(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['applications'] }),
  })
}

export function useUpdateApplication(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateApplicationRequest) => updateApplication(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
  })
}

export function useDeleteApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteApplication(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['applications'] }),
  })
}

export function useAutofill() {
  return useMutation({
    mutationFn: (url: string) => autofillApplication(url),
  })
}
