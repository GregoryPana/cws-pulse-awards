import { useCallback } from 'react'
import { InteractionRequiredAuthError } from '@azure/msal-browser'
import { useMsal } from '@azure/msal-react'
import { loginRequest } from '../msalConfig'

export function useAuth() {
  const { instance, accounts } = useMsal()
  const account = accounts[0]

  const signIn = useCallback(() => {
    void instance.loginRedirect(loginRequest)
  }, [instance])

  const getAccessToken = useCallback(async () => {
    if (!account) {
      await instance.loginRedirect(loginRequest)
      throw new Error('Redirecting to sign in')
    }

    try {
      const result = await instance.acquireTokenSilent({ ...loginRequest, account })
      return result.accessToken
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        await instance.acquireTokenRedirect({ ...loginRequest, account })
        throw new Error('Redirecting for token consent')
      }
      throw error
    }
  }, [account, instance])

  return {
    account,
    isSignedIn: Boolean(account),
    signIn,
    getAccessToken,
  }
}
