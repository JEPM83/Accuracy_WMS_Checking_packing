import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { login } from '../services/authService'
import toast from 'react-hot-toast'
import type { Sociedad } from '../types'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [sociedad, setSociedad] = useState<Sociedad>('SBO_OPERACIONES')
  const [loading, setLoading] = useState(false)
  const { setSession } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!username || !password) {
      toast.error('Por favor ingrese usuario y contraseña')
      return
    }

    setLoading(true)

    try {
      const session = await login(username, password, sociedad)
      setSession(session)
      toast.success(`Bienvenido ${session.user.fullName}`)
      navigate('/outbound')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-accuracy-light via-accuracy-medium-light to-accuracy-medium flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <img
              src="/images/logo-accuracy.png"
              alt="Accuracy Supply Chain Solutions"
              className="h-16 mx-auto mb-6"
            />
            <h1 className="text-2xl font-bold text-accuracy-navy mb-2">
              WMS Checking & Packing
            </h1>
            <p className="text-accuracy-gray">Ingrese sus credenciales</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-accuracy-navy mb-2">
                Usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-accuracy-gray border-opacity-30 rounded-lg focus:ring-2 focus:ring-accuracy-medium focus:border-transparent transition"
                placeholder="Ingrese su usuario"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-accuracy-navy mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-accuracy-gray border-opacity-30 rounded-lg focus:ring-2 focus:ring-accuracy-medium focus:border-transparent transition"
                placeholder="Ingrese su contraseña"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-accuracy-navy mb-2">
                Sociedad
              </label>
              <select
                value={sociedad}
                onChange={(e) => setSociedad(e.target.value as Sociedad)}
                className="w-full px-4 py-3 border border-accuracy-gray border-opacity-30 rounded-lg focus:ring-2 focus:ring-accuracy-medium focus:border-transparent transition"
                disabled={loading}
              >
                <option value="SBO_OPERACIONES">SBO_OPERACIONES</option>
                <option value="SBO_AMBAR">SBO_AMBAR</option>
                <option value="SBO_ACCURACY">SBO_ACCURACY</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-accuracy-medium to-accuracy-medium-light hover:from-accuracy-navy hover:to-accuracy-medium text-white font-semibold py-3 px-4 rounded-lg transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-accuracy-gray border-opacity-20">
            <p className="text-sm text-accuracy-navy text-center mb-2 font-medium">
              Usuarios de demostración:
            </p>
            <div className="space-y-1 text-xs text-accuracy-gray">
              <p>• operario1 / 1234 (OPERARIO)</p>
              <p>• supervisor1 / 1234 (SUPERVISOR)</p>
              <p>• admin1 / 1234 (ADMIN)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
