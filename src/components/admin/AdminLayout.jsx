import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, CalendarDays, Settings, LogOut, UtensilsCrossed, BarChart2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useRestaurant } from '../../hooks/useRestaurant'

const NAV_ITEMS = [
  { href: '/admin/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/reservas',      icon: CalendarDays,    label: 'Reservas' },
  { href: '/admin/reportes',      icon: BarChart2,       label: 'Reportes' },
  { href: '/admin/configuracion', icon: Settings,        label: 'Configuración' },
]

export default function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { restaurant } = useRestaurant()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/admin/login')
  }

  const restaurantName = restaurant?.name ?? 'Mi restaurante'
  const logoUrl        = restaurant?.logo_url ?? null

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 flex">

      {/* ── Sidebar — desktop ── */}
      <aside className="hidden md:flex w-64 bg-gray-900 border-r border-gray-800 flex-col shrink-0">

        {/* Restaurant identity */}
        <div className="px-5 pt-6 pb-5 border-b border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={restaurantName}
                className="w-11 h-11 rounded-xl object-contain bg-gray-800 border border-gray-700 p-1 shrink-0"
              />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-indigo-500 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/30">
                <UtensilsCrossed className="w-5 h-5 text-white" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-white leading-tight truncate">{restaurantName}</h1>
              <p className="text-xs text-gray-500 mt-0.5">Panel admin</p>
            </div>
          </div>

          {/* ReservApp badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-800/60 border border-gray-700/50 rounded-lg w-fit">
            <div className="w-3.5 h-3.5 rounded bg-indigo-500 flex items-center justify-center shrink-0">
              <UtensilsCrossed className="w-2 h-2 text-white" />
            </div>
            <span className="text-[10px] text-gray-500 font-medium tracking-wide">ReservApp</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <p className="px-3 pb-2 text-[10px] font-semibold text-gray-600 uppercase tracking-widest">
            Menú
          </p>
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = location.pathname === href
            return (
              <Link
                key={href}
                to={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-indigo-500/10 text-indigo-400'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                  active ? 'bg-indigo-500/20' : 'bg-gray-800/80'
                }`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                {label}
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all group"
          >
            <div className="w-7 h-7 rounded-lg bg-gray-800/80 flex items-center justify-center shrink-0 group-hover:bg-red-400/10 transition-colors">
              <LogOut className="w-3.5 h-3.5" />
            </div>
            Cerrar sesión
          </button>
        </div>

      </aside>

      {/* ── Content area ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar — mobile only */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={restaurantName}
                className="w-8 h-8 rounded-xl object-contain bg-gray-800 border border-gray-700 p-0.5 shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/30">
                <UtensilsCrossed className="w-[15px] h-[15px] text-white" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-bold text-white leading-none truncate">{restaurantName}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Panel admin</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-colors rounded-xl shrink-0"
            title="Cerrar sesión"
          >
            <LogOut className="w-[18px] h-[18px]" />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
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
                className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors relative ${
                  active ? 'text-indigo-400' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-indigo-500 rounded-full" />
                )}
                <div className={`p-1.5 rounded-xl transition-all ${active ? 'bg-indigo-500/15' : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>
                {label}
              </Link>
            )
          })}
        </nav>

      </div>
    </div>
  )
}
