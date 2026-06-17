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
  golden_ticket_ceo_message: string | null
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

export interface EmailSendResponse {
  email_sent: boolean
  recipients: string[]
  subject: string
}

export interface EmailRecipient {
  id: number
  email: string
  name: string | null
  active: boolean
  created_by: string | null
}

export interface EmailRecipientCreatePayload {
  email: string
  name?: string | null
  active?: boolean
}

export interface GoldenTicketUpdatePayload {
  occasion_label: string
  ceo_message: string
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

export async function updateWinner(
  winnerId: number,
  payload: WinnerCreatePayload,
  accessToken: string,
): Promise<WinnerAdmin> {
  const response = await fetch(`${API_BASE_URL}/admin/winners/${winnerId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return handle<WinnerAdmin>(response)
}

export async function archiveWinner(
  winnerId: number,
  accessToken: string,
): Promise<WinnerAdmin> {
  const response = await fetch(`${API_BASE_URL}/admin/winners/${winnerId}/archive`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return handle<WinnerAdmin>(response)
}

export async function fetchAdminWinners(
  accessToken: string,
  params: { award_type?: string; status?: string; month?: string; year?: number; golden_ticket?: boolean } = {},
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

export async function sendAwardEmail(
  winnerId: number,
  accessToken: string,
): Promise<EmailSendResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/winners/${winnerId}/email-send`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return handle<EmailSendResponse>(response)
}

export async function markGoldenTicket(
  winnerId: number,
  payload: GoldenTicketUpdatePayload,
  accessToken: string,
): Promise<WinnerAdmin> {
  const response = await fetch(`${API_BASE_URL}/admin/winners/${winnerId}/golden-ticket`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return handle<WinnerAdmin>(response)
}

export async function fetchGoldenTicketEmailPreview(
  winnerId: number,
  accessToken: string,
): Promise<EmailPreviewResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/winners/${winnerId}/golden-ticket/email-preview`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return handle<EmailPreviewResponse>(response)
}

export async function sendGoldenTicketEmail(
  winnerId: number,
  accessToken: string,
): Promise<EmailSendResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/winners/${winnerId}/golden-ticket/email-send`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return handle<EmailSendResponse>(response)
}

export async function fetchEmailRecipients(accessToken: string): Promise<EmailRecipient[]> {
  const response = await fetch(`${API_BASE_URL}/admin/config/recipients`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return handle<EmailRecipient[]>(response)
}

export async function createEmailRecipient(
  payload: EmailRecipientCreatePayload,
  accessToken: string,
): Promise<EmailRecipient> {
  const response = await fetch(`${API_BASE_URL}/admin/config/recipients`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return handle<EmailRecipient>(response)
}

export async function toggleEmailRecipient(
  recipientId: number,
  accessToken: string,
): Promise<EmailRecipient> {
  const response = await fetch(`${API_BASE_URL}/admin/config/recipients/${recipientId}/toggle`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return handle<EmailRecipient>(response)
}

export async function deleteEmailRecipient(
  recipientId: number,
  accessToken: string,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/config/recipients/${recipientId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(body || response.statusText)
  }
}
