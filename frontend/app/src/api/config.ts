import { get } from './client'

export interface Pillar {
  id: number
  name: string
  description: string | null
  sort_order: number
  active: boolean
}

export interface CompanyValue {
  id: number
  name: string
  description: string | null
  sort_order: number
  active: boolean
}

export interface Subcategory {
  id: number
  name: string
  award_type: string
  description: string | null
  active: boolean
}

export function fetchPillars(): Promise<Pillar[]> {
  return get<Pillar[]>('/config/pillars')
}

export function fetchValues(): Promise<CompanyValue[]> {
  return get<CompanyValue[]>('/config/values')
}

export function fetchSubcategories(awardType?: string): Promise<Subcategory[]> {
  const path = awardType
    ? `/config/subcategories?award_type=${encodeURIComponent(awardType)}`
    : '/config/subcategories'
  return get<Subcategory[]>(path)
}
