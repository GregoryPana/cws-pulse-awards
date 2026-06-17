export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new ApiError(res.status, body || res.statusText)
  }
  return res.json() as Promise<T>
}

export function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const entries = Object.entries(params).filter(
    (e): e is [string, string | number | boolean] => e[1] !== undefined,
  )
  if (entries.length === 0) return ''
  return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')
}

export async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`)
  return handleResponse<T>(res)
}

export async function getWithParams<T>(
  path: string,
  params: Record<string, string | number | undefined>,
): Promise<T> {
  const query = buildQuery(params)
  const res = await fetch(`${API_BASE_URL}${path}${query}`)
  return handleResponse<T>(res)
}
