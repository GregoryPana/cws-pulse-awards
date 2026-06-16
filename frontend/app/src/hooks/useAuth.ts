import { useCallback } from 'react'
import { InteractionRequiredAuthError } from '@azure/msal-browser'
import { useMsal } from '@azure/msal-react'
import { isDevAuthEnabled, loginRequest } from '../msalConfig'

const DEV_ACCESS_TOKEN = 'local-dev-admin'

export function useAuth() {
  const { instance, accounts } = useMsal()
  const account = accounts[0]
  const devAuthEnabled = isDevAuthEnabled()

  const signIn = useCallback(() => {
    if (devAuthEnabled) return
    void instance.loginRedirect(loginRequest)
  }, [devAuthEnabled, instance])

  const getAccessToken = useCallback(async () => {
    if (devAuthEnabled) return DEV_ACCESS_TOKEN

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
  }, [account, devAuthEnabled, instance])

  return {
    account,
    isSignedIn: devAuthEnabled || Boolean(account),
    isDevAuthEnabled: devAuthEnabled,
    signIn,
    getAccessToken,
  }
}
