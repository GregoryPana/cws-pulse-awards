import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import CharterChampions from './pages/CharterChampions'
import InstantImpact from './pages/InstantImpact'
import AdminEntry from './pages/admin/AdminEntry'

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
        <Route path="*" element={<Navigate to="/charter-champions" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
