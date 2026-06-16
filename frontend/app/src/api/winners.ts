import { getWithParams } from './client'

export interface WinnerPublic {
  id: number
  first_name: string
  last_name: string
  job_title: string
  department: string
  award_type: string
  subcategory: string
  charter_pillar: string
  company_value: string
  story: string
  nominated_by: string | null
  award_month: string
  award_year: number
  golden_ticket: boolean
  golden_ticket_occasion: string | null
  is_top_five: boolean
  top_five_rank: number | null
  top_five_year: number | null
  photo_url: string | null
  status: string
}

export interface WinnersResponse {
  winners: WinnerPublic[]
  total: number
}

export function fetchWinners(
  awardType: string,
  month?: string,
  year?: number,
): Promise<WinnersResponse> {
  return getWithParams<WinnersResponse>('/winners', {
    award_type: awardType,
    month,
    year,
  })
}

export function fetchWinner(id: number): Promise<WinnerPublic> {
  return getWithParams<WinnerPublic>(`/winners/${id}`, {})
}
