import { useState, useEffect, useCallback } from 'react'
import { fetchWinners, type WinnerPublic } from '../api/winners'

type LoadState = 'idle' | 'loading' | 'success' | 'error'

interface UseWinnersResult {
  winners: WinnerPublic[]
  state: LoadState
  error: string | null
  refetch: () => void
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

function currentMonthLabel(): string {
  const now = new Date()
  return `${MONTHS[now.getMonth()]} ${now.getFullYear()}`
}

export function useWinners(
  awardType: string,
  month?: string,
  year?: number,
): UseWinnersResult {
  const [winners, setWinners] = useState<WinnerPublic[]>([])
  const [state, setState] = useState<LoadState>('idle')
  const [error, setError] = useState<string | null>(null)

  const effectiveMonth = month ?? currentMonthLabel()
  const effectiveYear = year

  const load = useCallback(() => {
    setState('loading')
    setError(null)

    fetchWinners(awardType, effectiveMonth, effectiveYear)
      .then((data) => {
        setWinners(data.winners ?? [])
        setState('success')
      })
      .catch((err: Error) => {
        setError(err.message || 'Failed to load winners')
        setState('error')
      })
  }, [awardType, effectiveMonth, effectiveYear])

  useEffect(() => {
    load()
  }, [load])

  return { winners, state, error, refetch: load }
}
