import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children }) {
  const { isAuth, loading } = useAuth()
  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" />
      <span>Loading...</span>
    </div>
  )
  if (!isAuth) return <Navigate to="/login" replace />
  return children
}
