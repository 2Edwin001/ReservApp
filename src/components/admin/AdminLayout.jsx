import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, CalendarDays, Settings, LogOut } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const NAV_ITEMS = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/reservas', icon: CalendarDays, label: 'Reservas' },
  { href: '/admin/configuracion', icon: Settings, label: 'Configuración' },
]

export default function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">

      {/* ── Sidebar — desktop ── */}
      <aside className="hidden md:flex w-60 bg-gray-900 border-r border-gray-800 flex-col shrink-0">
        <div className="px-6 py-5 border-b border-gray-800">
          <h1 className="text-lg font-semibold text-white">ReservApp</h1>
          <p className="text-xs text-gray-500 mt-0.5">Panel admin</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = location.pathname === href
            return (
              <Link
                key={href}
                to={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-indigo-500/10 text-indigo-400 font-medium'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="px-3 py-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Content area ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar — mobile only */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800 shrink-0">
          <div>
            <p className="text-base font-semibold text-white">ReservApp</p>
            <p className="text-xs text-gray-500">Panel admin</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-red-400 transition-colors rounded-lg"
            title="Cerrar sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <Outlet />
        </main>

        {/* Bottom nav — mobile only */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex z-10">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = location.pathname === href
            return (
              <Link
                key={href}
                to={href}
                className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors ${
                  active ? 'text-indigo-400' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            )
          })}
        </nav>

      </div>
    </div>
  )
}
