import { apiClient } from './client'
import type { UserResponse } from '@/types'

export async function getCurrentUser(): Promise<UserResponse | null> {
  try {
    return await apiClient.get<UserResponse>('/auth/me')
  } catch {
    return null
  }
}

export async function logout(): Promise<void> {
  try {
    await apiClient.post<void>('/auth/logout', {})
  } catch {
    // session was already invalidated or backend unreachable — proceed
  }
}
