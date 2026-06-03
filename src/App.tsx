import { Routes, Route, Navigate } from 'react-router-dom'
import ClientList from './pages/ClientList'
import ClientForm from './pages/ClientForm'
import ClientDetail from './pages/ClientDetail'
import AccountSettings from './pages/AccountSettings'
import Login from './pages/Login'
import { useAuth } from './contexts/AuthContext'

function Spinner() {
  return (
    <div className="flex items-center justify-center h-full bg-[#F5F2ED]">
      <div className="w-7 h-7 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) return <Spinner />
  if (!user) return <Login />

  return (
    <div className="h-full bg-[#F5F2ED]">
      <Routes>
        <Route path="/" element={<ClientList />} />
        <Route path="/client/new" element={<ClientForm />} />
        <Route path="/client/:id/edit" element={<ClientForm />} />
        <Route path="/client/:id" element={<ClientDetail />} />
        <Route path="/account" element={<AccountSettings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
