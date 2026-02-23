import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRestaurant } from '../../hooks/useRestaurant'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Loader2, Copy, Check, ExternalLink } from 'lucide-react'

const STATUS_LABELS = {
  confirmed: { label: 'Confirmada', cls: 'bg-indigo-500/10 text-indigo-400' },
  completed: { label: 'Completada', cls: 'bg-green-500/10 text-green-400' },
  cancelled: { label: 'Cancelada', cls: 'bg-red-500/10 text-red-400' },
}

export default function Dashboard() {
  useEffect(() => { document.title = 'Dashboard · ReservApp' }, [])

  const { restaurant, loading: restaurantLoading } = useRestaurant()
  const [stats, setStats] = useState({ today: 0, week: 0, confirmed: 0 })
  const [todayReservations, setTodayReservations] = useState([])
  const [loadingData, setLoadingData] = useState(false)

  useEffect(() => {
    if (!restaurant) return
    loadDashboardData(restaurant.id)
  }, [restaurant])

  async function loadDashboardData(restaurantId) {
    setLoadingData(true)
    const today = format(new Date(), 'yyyy-MM-dd')
    const nextWeek = format(new Date(Date.now() + 7 * 86400000), 'yyyy-MM-dd')

    const [
      { count: todayCount },
      { count: weekCount },
      { count: confirmedCount },
      { data: reservations },
    ] = await Promise.all([
      supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId)
        .eq('date', today)
        .neq('status', 'cancelled'),
      supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId)
        .gte('date', today)
        .lte('date', nextWeek)
        .neq('status', 'cancelled'),
      supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId)
        .eq('status', 'confirmed')
        .gte('date', today),
      supabase
        .from('reservations')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('date', today)
        .neq('status', 'cancelled')
        .order('time')
        .limit(10),
    ])

    setStats({
      today: todayCount ?? 0,
      week: weekCount ?? 0,
      confirmed: confirmedCount ?? 0,
    })
    setTodayReservations(reservations ?? [])
    setLoadingData(false)
  }

  if (restaurantLoading) {
    return (
      <div className="p-8 flex items-center gap-3 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        Cargando...
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8">
      <h2 className="text-2xl font-semibold text-white mb-1">Dashboard</h2>
      <p className="text-gray-500 text-sm">
        {restaurant?.name ?? 'Tu restaurante'} · {format(new Date(), "d 'de' MMMM yyyy", { locale: es })}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <StatCard label="Reservas hoy" value={loadingData ? '—' : stats.today} />
        <StatCard label="Reservas (7 días)" value={loadingData ? '—' : stats.week} />
        <StatCard label="Pendientes (confirmadas)" value={loadingData ? '—' : stats.confirmed} />
      </div>

      {/* Reservation link */}
      {restaurant?.slug && <ReservationLink restaurant={restaurant} />}

      {/* Today's reservations */}
      <div className="mt-8">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Reservas de hoy
        </h3>

        {loadingData ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Cargando...
          </div>
        ) : todayReservations.length === 0 ? (
          <p className="text-gray-600 text-sm">Sin reservas para hoy.</p>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="text-gray-500 text-xs uppercase tracking-wider border-b border-gray-800">
                  <th className="px-4 py-3 text-left">Hora</th>
                  <th className="px-4 py-3 text-left">Cliente</th>
                  <th className="px-4 py-3 text-left">Personas</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {todayReservations.map(r => {
                  const s = STATUS_LABELS[r.status] ?? STATUS_LABELS.confirmed
                  return (
                    <tr key={r.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3 text-white font-medium tabular-nums">{r.time?.slice(0, 5)}</td>
                      <td className="px-4 py-3 text-gray-300">{r.client_name}</td>
                      <td className="px-4 py-3 text-gray-400">{r.people}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${s.cls}`}>
                          {s.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-bold text-white mt-2">{value}</p>
    </div>
  )
}

function ReservationLink({ restaurant }) {
  const [copied, setCopied] = useState(false)
  const url = `${window.location.origin}/r/${restaurant.slug}`

  function copyLink() {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mt-6">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Link de reservas
      </h3>
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 truncate select-all">
          {url}
        </div>
        <button
          onClick={copyLink}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors shrink-0 ${
            copied
              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
          }`}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 transition-colors shrink-0"
        >
          <ExternalLink className="w-4 h-4" />
          Abrir
        </a>
      </div>
    </div>
  )
}
