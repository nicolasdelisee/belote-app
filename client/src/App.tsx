import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import LobbyPage from './pages/LobbyPage'
import GamePage from './pages/GamePage'
import ProfilePage from './pages/ProfilePage'
import HistoryPage from './pages/HistoryPage'
import PublicProfilePage from './pages/PublicProfilePage'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/" element={user ? <HomePage /> : <Navigate to="/login" />} />
      <Route path="/game/:id" element={user ? <LobbyPage /> : <Navigate to="/login" />} />
      <Route path="/game/:id/play" element={user ? <GamePage /> : <Navigate to="/login" />} />
      <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/login" />} />
      <Route path="/history" element={user ? <HistoryPage /> : <Navigate to="/login" />} />
      <Route path="/profile/:id" element={user ? <PublicProfilePage /> : <Navigate to="/login" />} />
    </Routes>
  )
}
