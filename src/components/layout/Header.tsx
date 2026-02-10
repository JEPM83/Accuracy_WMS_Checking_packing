import { useAuth } from '../../hooks/useAuth'
import ResetDataButton from '../common/ResetDataButton'

interface HeaderProps {
  toggleSidebar: () => void
  sidebarOpen: boolean
}

export default function Header({ toggleSidebar, sidebarOpen }: HeaderProps) {
  const { session, logout } = useAuth()

  if (!session) return null

  return (
    <header className="bg-gradient-to-r from-accuracy-navy to-accuracy-medium shadow-lg border-b border-accuracy-medium sticky top-0 z-10">
      <div className="px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-3 md:space-x-4">
            <button
              onClick={toggleSidebar}
              className="p-2 text-white hover:bg-white hover:bg-opacity-10 rounded-lg transition"
              title={sidebarOpen ? 'Ocultar menú' : 'Mostrar menú'}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {sidebarOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
            <img
              src="/images/isotipo-accuracy.png"
              alt="Accuracy"
              className="h-8 md:h-10 w-auto"
            />
            <div className="flex flex-col">
              <h1 className="text-base md:text-lg font-bold text-white">
                WMS Checking & Packing
              </h1>
              <span className="text-xs text-accuracy-light">Accuracy Supply Chain Solutions</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-2 md:px-3 py-1 bg-accuracy-light bg-opacity-20 text-white text-xs md:text-sm font-medium rounded-full border border-accuracy-light">
                {session.sociedad}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="hidden md:block">
              <ResetDataButton />
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white">
                {session.user.fullName}
              </p>
              <p className="text-xs text-accuracy-light">{session.user.role}</p>
            </div>
            <button
              onClick={logout}
              className="px-3 md:px-4 py-2 text-sm font-medium text-white bg-white bg-opacity-10 hover:bg-opacity-20 rounded-lg transition border border-white border-opacity-30"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
