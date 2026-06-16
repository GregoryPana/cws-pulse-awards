import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import CharterChampions from './pages/CharterChampions'
import InstantImpact from './pages/InstantImpact'
import AdminEntry from './pages/admin/AdminEntry'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/charter-champions" element={<CharterChampions />} />
        <Route path="/instant-impact" element={<InstantImpact />} />
        <Route path="/admin/entry" element={<AdminEntry />} />
        <Route path="*" element={<Navigate to="/charter-champions" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
