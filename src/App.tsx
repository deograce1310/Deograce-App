import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import ClientList from './pages/ClientList'
import ClientForm from './pages/ClientForm'
import ClientDetail from './pages/ClientDetail'
import { requestNotificationPermission, checkAndNotify } from './notifications/notificationService'

export default function App() {
  useEffect(() => {
    requestNotificationPermission().then(granted => {
      if (granted) checkAndNotify()
    })
  }, [])

  return (
    <div className="h-full bg-gray-50">
      <Routes>
        <Route path="/" element={<ClientList />} />
        <Route path="/client/new" element={<ClientForm />} />
        <Route path="/client/:id/edit" element={<ClientForm />} />
        <Route path="/client/:id" element={<ClientDetail />} />
      </Routes>
    </div>
  )
}
