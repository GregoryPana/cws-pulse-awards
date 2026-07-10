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
    // redirectUri is fixed to the app root to match what's registered in Entra, so
    // without redirectStartPage the post-login bounce lands on "/" — which the
    // router's catch-all then sends to /charter-champions, silently losing the
    // admin page the user was actually trying to sign in from.
    void instance.loginRedirect({ ...loginRequest, redirectStartPage: window.location.href })
  }, [devAuthEnabled, instance])

  const getAccessToken = useCallback(async () => {
    if (devAuthEnabled) return DEV_ACCESS_TOKEN

    if (!account) {
      await instance.loginRedirect({ ...loginRequest, redirectStartPage: window.location.href })
      throw new Error('Redirecting to sign in')
    }

    try {
      const result = await instance.acquireTokenSilent({ ...loginRequest, account })
      return result.accessToken
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        await instance.acquireTokenRedirect({
          ...loginRequest,
          account,
          redirectStartPage: window.location.href,
        })
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
