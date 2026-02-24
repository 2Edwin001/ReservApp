import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRestaurant } from '../../hooks/useRestaurant'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Loader2, Copy, Check, ExternalLink, CalendarDays, TrendingUp, Clock, Link2, Download } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'

const STATUS_LABELS = {
  confirmed: { label: 'Confirmada', cls: 'bg-indigo-50 text-indigo-700 border border-indigo-100' },
  completed: { label: 'Completada', cls: 'bg-green-50 text-green-700 border border-green-100' },
  cancelled: { label: 'Cancelada',  cls: 'bg-red-50 text-red-700 border border-red-100' },
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
    const today    = format(new Date(), 'yyyy-MM-dd')
    const nextWeek = format(new Date(Date.now() + 7 * 86400000), 'yyyy-MM-dd')

    const [
      { count: todayCount },
      { count: weekCount },
      { count: confirmedCount },
      { data: reservations },
    ] = await Promise.all([
      supabase.from('reservations').select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId).eq('date', today).neq('status', 'cancelled'),
      supabase.from('reservations').select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId).gte('date', today).lte('date', nextWeek).neq('status', 'cancelled'),
      supabase.from('reservations').select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId).eq('status', 'confirmed').gte('date', today),
      supabase.from('reservations').select('*')
        .eq('restaurant_id', restaurantId).eq('date', today).neq('status', 'cancelled').order('time').limit(10),
    ])

    setStats({ today: todayCount ?? 0, week: weekCount ?? 0, confirmed: confirmedCount ?? 0 })
    setTodayReservations(reservations ?? [])
    setLoadingData(false)
  }

  if (restaurantLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="text-sm text-gray-400">Cargando...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-10">

      {/* ── Header ── */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h2>
        <p className="text-gray-500 text-sm mt-1">
          {restaurant?.name ?? 'Tu restaurante'} · {format(new Date(), "d 'de' MMMM yyyy", { locale: es })}
        </p>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard icon={CalendarDays} label="Reservas hoy"    value={loadingData ? '—' : stats.today}     color="indigo" />
        <StatCard icon={TrendingUp}   label="Próximos 7 días" value={loadingData ? '—' : stats.week}      color="purple" />
        <StatCard icon={Clock}        label="Pendientes"      value={loadingData ? '—' : stats.confirmed} color="green"  />
      </div>

      {/* ── Reservation link ── */}
      {restaurant?.slug && <ReservationLink restaurant={restaurant} />}

      {/* ── Today's reservations ── */}
      <div className="mt-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
            <CalendarDays className="w-4 h-4 text-indigo-600" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900">Reservas de hoy</h3>
          {!loadingData && todayReservations.length > 0 && (
            <span className="ml-auto text-xs text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full">
              {todayReservations.length} reserva{todayReservations.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {loadingData ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm py-8 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" />
            Cargando reservas...
          </div>
        ) : todayReservations.length === 0 ? (
          <div className="text-center py-14 rounded-xl border-2 border-dashed border-gray-200">
            <CalendarDays className="w-9 h-9 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm font-medium">Sin reservas para hoy</p>
            <p className="text-gray-400 text-xs mt-1">Cuando lleguen aparecerán aquí.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[480px]">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                    <th className="px-4 py-3 text-left">Hora</th>
                    <th className="px-4 py-3 text-left">Cliente</th>
                    <th className="px-4 py-3 text-left">Personas</th>
                    <th className="px-4 py-3 text-left">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {todayReservations.map(r => {
                    const s = STATUS_LABELS[r.status] ?? STATUS_LABELS.confirmed
                    return (
                      <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-900 font-bold tabular-nums">{r.time?.slice(0, 5)}</td>
                        <td className="px-4 py-3 text-gray-700">{r.client_name}</td>
                        <td className="px-4 py-3 text-gray-500">{r.people}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${s.cls}`}>
                            {s.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

const STAT_COLORS = {
  indigo: { wrap: 'bg-indigo-50 border-indigo-100', icon: 'text-indigo-600' },
  purple: { wrap: 'bg-purple-50 border-purple-100', icon: 'text-purple-600' },
  green:  { wrap: 'bg-green-50  border-green-100',  icon: 'text-green-600'  },
}

function StatCard({ icon: Icon, label, value, color = 'indigo' }) {
  const c = STAT_COLORS[color]
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
      <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${c.wrap}`}>
        <Icon className={`w-6 h-6 ${c.icon}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium truncate">{label}</p>
        <p className="text-3xl font-bold text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  )
}

// ─── ReservationLink ──────────────────────────────────────────────────────────

function ReservationLink({ restaurant }) {
  const [copied, setCopied] = useState(false)
  const url = `${window.location.origin}/r/${restaurant.slug}`

  function copyLink() {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function downloadQR() {
    const canvas = document.getElementById('qr-reservapp')
    const link   = document.createElement('a')
    link.download = `qr-${restaurant.slug}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
          <Link2 className="w-4 h-4 text-indigo-600" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900">Link de reservas</h3>
      </div>

      <div className="p-5 flex flex-col sm:flex-row gap-6 items-start">

        {/* QR Code */}
        <div className="flex flex-col items-center gap-2.5 shrink-0">
          <div className="p-3 bg-white rounded-2xl shadow-md border border-gray-100">
            <QRCodeCanvas id="qr-reservapp" value={url} size={120} level="M" includeMargin={false} />
          </div>
          <button
            onClick={downloadQR}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Descargar QR
          </button>
        </div>

        {/* URL + actions */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          <p className="text-xs text-gray-400">
            Compartí este link o QR para que tus clientes puedan reservar.
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 truncate select-all font-mono min-w-0">
              {url}
            </div>
            <button
              onClick={copyLink}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors shrink-0 ${
                copied
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100 transition-colors shrink-0"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Abrir</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
