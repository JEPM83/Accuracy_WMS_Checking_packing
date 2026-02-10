import { NavLink } from 'react-router-dom'

interface NavItem {
  to: string
  label: string
  icon: string
}

interface SidebarProps {
  isOpen: boolean
}

const navItems: NavItem[] = [
  { to: '/outbound', label: 'Pedidos', icon: '📦' },
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/incidents', label: 'Incidencias', icon: '⚠️' },
]

export default function Sidebar({ isOpen }: SidebarProps) {
  return (
    <aside
      className={`
        bg-white border-r border-accuracy-gray border-opacity-20
        transition-all duration-300 ease-in-out
        ${
          isOpen
            ? 'w-full md:w-64'
            : 'w-0 md:w-0 overflow-hidden'
        }
        md:min-h-[calc(100vh-73px)]
      `}
    >
      <nav className={`p-2 md:p-4 space-y-1 md:space-y-2 flex md:block overflow-x-auto md:overflow-x-visible ${!isOpen ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center space-x-2 md:space-x-3 px-3 md:px-4 py-2 md:py-3 rounded-lg transition whitespace-nowrap ${
                isActive
                  ? 'bg-gradient-to-r from-accuracy-medium to-accuracy-medium-light text-white font-semibold shadow-md'
                  : 'text-accuracy-navy hover:bg-accuracy-light hover:bg-opacity-20'
              }`
            }
          >
            <span className="text-lg md:text-xl">{item.icon}</span>
            <span className="text-sm md:text-base">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
