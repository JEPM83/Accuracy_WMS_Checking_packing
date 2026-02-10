import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useEffect, useState } from 'react'
import { AuthProvider } from './hooks/useAuth'
import { initializeDatabase } from './services/seedService'
import ProtectedRoute from './components/common/ProtectedRoute'
import MainLayout from './components/layout/MainLayout'
import Login from './pages/Login'
import OutboundList from './pages/OutboundList'
import OutboundDetail from './pages/OutboundDetail'
import ProgressDashboard from './pages/ProgressDashboard'
import IncidentsReport from './pages/IncidentsReport'

function AppContent() {
  const [dbInitialized, setDbInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    initializeDatabase()
      .then(() => setDbInitialized(true))
      .catch((err) => {
        console.error('Error inicializando DB:', err)
        setError('Error al inicializar la base de datos')
      })
  }, [])

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!dbInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Inicializando aplicación...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/outbound" element={<OutboundList />} />
        <Route path="/outbound/:orderId" element={<OutboundDetail />} />
        <Route path="/dashboard" element={<ProgressDashboard />} />
        <Route path="/incidents" element={<IncidentsReport />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
