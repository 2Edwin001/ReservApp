import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRestaurant } from '../../hooks/useRestaurant'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Loader2, Copy, Check, ExternalLink, CalendarDays, TrendingUp, Clock, Link2, Download } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'

const STATUS_LABELS = {
  confirmed: { label: 'Confirmada', cls: 'bg-indigo-50 text-indigo-700 border border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20' },
  completed: { label: 'Completada', cls: 'bg-green-50 text-green-700 border border-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20' },
  cancelled: { label: 'Cancelada',  cls: 'bg-red-50 text-red-700 border border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' },
}

export default function Dashboard() {
  useEffect(() => { document.title = 'Dashboard · ReservApp' }, [])

  const navigate = useNavigate()
  const { restaurant, settings, loading: restaurantLoading } = useRestaurant()
  const [stats, setStats] = useState({ today: 0, week: 0, confirmed: 0 })
  const [todayReservations, setTodayReservations] = useState([])
  const [loadingData, setLoadingData] = useState(false)

  // Redirigir al onboarding si no tiene configuración
  useEffect(() => {
    if (!restaurantLoading && restaurant && !settings) {
      navigate('/admin/onboarding', { replace: true })
    }
  }, [restaurantLoading, restaurant, settings])

  useEffect(() => {
    if (!restaurant) return
    loadDashboardData(restaurant.id)
  }, [restaurant])

  async function loadDashboardData(restaurantId) {
    setLoadingData(true)
    try {
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
    } catch (err) {
      console.error('[Dashboard] error cargando datos:', err)
    } finally {
      setLoadingData(false)
    }
  }

  if (restaurantLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="text-sm text-gray-400 dark:text-gray-500">Cargando...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-10">

      {/* ── Header ── */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Dashboard</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
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
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center shrink-0">
            <CalendarDays className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Reservas de hoy</h3>
          {!loadingData && todayReservations.length > 0 && (
            <span className="ml-auto text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-2.5 py-1 rounded-full">
              {todayReservations.length} reserva{todayReservations.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {loadingData ? (
          <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 text-sm py-8 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" />
            Cargando reservas...
          </div>
        ) : todayReservations.length === 0 ? (
          <div className="text-center py-14 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
            <CalendarDays className="w-9 h-9 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Sin reservas para hoy</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Cuando lleguen aparecerán aquí.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[480px]">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                    <th className="px-4 py-3 text-left">Hora</th>
                    <th className="px-4 py-3 text-left">Cliente</th>
                    <th className="px-4 py-3 text-left">Personas</th>
                    <th className="px-4 py-3 text-left">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {todayReservations.map(r => {
                    const s = STATUS_LABELS[r.status] ?? STATUS_LABELS.confirmed
                    return (
                      <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-4 py-3 text-gray-900 dark:text-white font-bold tabular-nums">{r.time?.slice(0, 5)}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{r.client_name}</td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{r.people}</td>
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
  indigo: { wrap: 'bg-indigo-50 border-indigo-100 dark:bg-indigo-500/10 dark:border-indigo-500/20', icon: 'text-indigo-600 dark:text-indigo-400' },
  purple: { wrap: 'bg-purple-50 border-purple-100 dark:bg-purple-500/10 dark:border-purple-500/20', icon: 'text-purple-600 dark:text-purple-400' },
  green:  { wrap: 'bg-green-50  border-green-100  dark:bg-green-500/10  dark:border-green-500/20',  icon: 'text-green-600  dark:text-green-400'  },
}

function StatCard({ icon: Icon, label, value, color = 'indigo' }) {
  const c = STAT_COLORS[color]
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
      <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${c.wrap}`}>
        <Icon className={`w-6 h-6 ${c.icon}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate">{label}</p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-0.5">{value}</p>
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
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center shrink-0">
          <Link2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Link de reservas</h3>
      </div>

      <div className="p-5 flex flex-col sm:flex-row gap-6 items-start">

        {/* QR Code */}
        <div className="flex flex-col items-center gap-2.5 shrink-0">
          <div className="p-3 bg-white rounded-2xl shadow-md border border-gray-100 dark:border-gray-700">
            <QRCodeCanvas id="qr-reservapp" value={url} size={120} level="M" includeMargin={false} />
          </div>
          <button
            onClick={downloadQR}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Descargar QR
          </button>
        </div>

        {/* URL + actions */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Comparte este link o QR con tus clientes para que puedan reservar.
          </p>
          <div className="flex flex-col gap-2">
            <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-600 dark:text-gray-300 truncate select-all font-mono min-w-0">
              {url}
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyLink}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  copied
                    ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20'
                    : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-100 dark:border-indigo-500/20 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Abrir
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
