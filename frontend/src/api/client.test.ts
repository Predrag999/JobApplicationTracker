import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { apiClient } from '@/api/client'

describe('apiClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function mockFetch(status: number, jsonBody: unknown, ok = true): void {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok,
      status,
      statusText: ok ? 'OK' : 'Error',
      json: () => Promise.resolve(jsonBody),
      blob: () => Promise.resolve(new Blob()),
    } as Response)
  }

  it('get — returns parsed JSON on 200', async () => {
    mockFetch(200, { id: 1 })
    const result = await apiClient.get<{ id: number }>('/test')
    expect(result).toEqual({ id: 1 })
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/test',
      expect.objectContaining({ credentials: 'include' }),
    )
  })

  it('get — throws with error message from response body on non-ok', async () => {
    mockFetch(404, { message: 'Application not found' }, false)
    await expect(apiClient.get('/missing')).rejects.toThrow('Application not found')
  })

  it('get — falls back to statusText when response body has no message', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: () => Promise.reject(new Error('no json')),
    } as Response)
    await expect(apiClient.get('/crash')).rejects.toThrow('Internal Server Error')
  })

  it('post — sends JSON body with POST method', async () => {
    mockFetch(200, { created: true })
    const result = await apiClient.post<{ created: boolean }>('/items', { name: 'foo' })
    expect(result).toEqual({ created: true })
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/items',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ name: 'foo' }) }),
    )
  })

  it('put — sends JSON body with PUT method', async () => {
    mockFetch(200, { updated: true })
    await apiClient.put('/items/1', { name: 'bar' })
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/items/1',
      expect.objectContaining({ method: 'PUT', body: JSON.stringify({ name: 'bar' }) }),
    )
  })

  it('delete — resolves undefined on 204', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 204,
      statusText: 'No Content',
      json: () => Promise.resolve(undefined),
      blob: () => Promise.resolve(new Blob()),
    } as Response)
    const result = await apiClient.delete('/items/1')
    expect(result).toBeUndefined()
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/items/1',
      expect.objectContaining({ method: 'DELETE' }),
    )
  })

  it('downloadBlob — returns Blob on success', async () => {
    const blob = new Blob(['csv,data'], { type: 'text/csv' })
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      blob: () => Promise.resolve(blob),
    } as Response)
    const result = await apiClient.downloadBlob('/applications/export?format=csv')
    expect(result).toBe(blob)
  })

  it('downloadBlob — throws on non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      json: () => Promise.resolve({ message: 'Access denied' }),
    } as Response)
    await expect(apiClient.downloadBlob('/export')).rejects.toThrow('Access denied')
  })

  it('upload — sends FormData via POST with credentials', async () => {
    mockFetch(201, { id: 'abc123' })
    const fd = new FormData()
    fd.append('file', new Blob(['content']), 'cv.pdf')
    const result = await apiClient.upload<{ id: string }>('/uploads', fd)
    expect(result).toEqual({ id: 'abc123' })
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/uploads',
      expect.objectContaining({ method: 'POST', body: fd, credentials: 'include' }),
    )
  })
})
