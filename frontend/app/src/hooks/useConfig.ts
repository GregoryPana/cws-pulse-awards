import { useCallback, useEffect, useState } from 'react'
import { fetchSubcategories, type Subcategory } from '../api/config'

type LoadState = 'idle' | 'loading' | 'success' | 'error'

interface UseSubcategoriesResult {
  subcategories: Subcategory[]
  state: LoadState
  error: string | null
  refetch: () => void
}

export function useSubcategories(awardType: string): UseSubcategoriesResult {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [state, setState] = useState<LoadState>('idle')
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setState('loading')
    setError(null)

    fetchSubcategories(awardType)
      .then((data) => {
        setSubcategories(data)
        setState('success')
      })
      .catch((err: Error) => {
        setError(err.message || 'Failed to load subcategories')
        setState('error')
      })
  }, [awardType])

  useEffect(() => {
    load()
  }, [load])

  return { subcategories, state, error, refetch: load }
}
