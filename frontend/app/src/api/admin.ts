import { API_BASE_URL, buildQuery } from './client'
import type { WinnerPublic } from './winners'

export interface WinnerCreatePayload {
  award_type: 'CHARTER_CHAMPION' | 'INSTANT_IMPACT'
  first_name: string
  last_name: string
  job_title: string
  department: string
  subcategory: string
  charter_pillar: string
  company_value: string
  story: string
  nominated_by?: string | null
  award_month: string
  award_year: number
  photo_url?: string | null
  status?: 'PUBLISHED' | 'ARCHIVED' | 'REMOVED'
}

export interface WinnerAdmin extends WinnerPublic {
  created_by: string
  updated_by: string | null
}

export interface WinnerAdminListResponse {
  winners: WinnerAdmin[]
  total: number
}

export interface EmailPreviewResponse {
  html: string
  subject: string
}

async function handle<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(body || response.statusText)
  }
  return response.json() as Promise<T>
}

export async function createWinner(
  payload: WinnerCreatePayload,
  accessToken: string,
): Promise<WinnerAdmin> {
  const response = await fetch(`${API_BASE_URL}/admin/winners`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return handle<WinnerAdmin>(response)
}

export async function fetchAdminWinners(
  accessToken: string,
  params: { award_type?: string; status?: string; year?: number } = {},
): Promise<WinnerAdminListResponse> {
  const query = buildQuery(params)
  const response = await fetch(`${API_BASE_URL}/admin/winners${query}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return handle<WinnerAdminListResponse>(response)
}

export async function fetchAwardEmailPreview(
  winnerId: number,
  accessToken: string,
): Promise<EmailPreviewResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/winners/${winnerId}/email-preview`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return handle<EmailPreviewResponse>(response)
}
