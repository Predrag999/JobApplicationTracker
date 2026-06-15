import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getCurrentUser, logout as apiLogout } from '@/api/auth'

export function useAuth() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })

  const logout = () => {
    queryClient.setQueryData(['auth', 'me'], null)
    apiLogout()
  }

  return {
    user: query.data ?? null,
    isLoading: query.isLoading,
    logout,
  }
}
