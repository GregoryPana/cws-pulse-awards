import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useMsal } from '@azure/msal-react'
import { InteractionStatus } from '@azure/msal-browser'
import CharterChampions from './pages/CharterChampions'
import InstantImpact from './pages/InstantImpact'
import AdminEntry from './pages/admin/AdminEntry'

/**
 * MSAL's post-login redirect lands the browser back on the app root before
 * `handleRedirectPromise()` has finished restoring the originating page
 * (`redirectStartPage`). Without this guard, the catch-all fires immediately
 * on mount and wins the race, bouncing signed-in admin users to the public
 * wall of fame instead of back to /admin/entry.
 */
function CatchAll() {
  const { inProgress } = useMsal()
  if (inProgress === InteractionStatus.Startup || inProgress === InteractionStatus.HandleRedirect) {
    return null
  }
  return <Navigate to="/charter-champions" replace />
}

export default function App() {
  // import.meta.env.BASE_URL mirrors vite.config.ts's `base` (e.g. "/pulse-awards/"
  // when deployed under a shared VM's path prefix, "/" for local dev) — trailing
  // slash stripped since React Router expects a bare prefix, not "" vs "/" ambiguity.
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '')
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/charter-champions" element={<CharterChampions />} />
        <Route path="/instant-impact" element={<InstantImpact />} />
        <Route path="/admin/entry" element={<AdminEntry />} />
        <Route path="*" element={<CatchAll />} />
      </Routes>
    </BrowserRouter>
  )
}
