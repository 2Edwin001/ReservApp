import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRestaurant } from '../../hooks/useRestaurant'
import { Toast, useToast } from '../../components/admin/Toast'
import { format } from 'date-fns'
import { Search, CheckCheck, X, Loader2, CalendarDays } from 'lucide-react'

const STATUS = {
  confirmed: { label: 'Confirmada', cls: 'bg-indigo-500/10 text-indigo-400' },
  completed: { label: 'Completada', cls: 'bg-green-500/10 text-green-400' },
  cancelled: { label: 'Cancelada', cls: 'bg-red-500/10 text-red-400' },
}

const STATUS_FILTERS = [
  { value: 'all', label: 'Todas' },
  { value: 'confirmed', label: 'Confirmadas' },
  { value: 'completed', label: 'Completadas' },
  { value: 'cancelled', label: 'Canceladas' },
]

export default function Reservas() {
  useEffect(() => { document.title = 'Reservas · ReservApp' }, [])

  const { restaurant, loading: restaurantLoading } = useRestaurant()
  const { toast, show } = useToast()

  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(false)
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (restaurant) loadReservations()
  }, [restaurant, date])

  async function loadReservations() {
    setLoading(true)
    const { data, error } = await supabase
      .from('reservations')
      .select('*, tables(number)')
      .eq('restaurant_id', restaurant.id)
      .eq('date', date)
      .order('time')
    if (error) console.error('[Reservas]', error)
    setReservations(data ?? [])
    setLoading(false)
  }

  async function updateStatus(id, newStatus) {
    if (newStatus === 'cancelled' && !window.confirm('¿Cancelar esta reserva?')) return
    const { error } = await supabase
      .from('reservations')
      .update({ status: newStatus })
      .eq('id', id)
    if (error) { show('error', error.message); return }
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r))
    show('success', newStatus === 'completed' ? 'Reserva completada' : 'Reserva cancelada')
  }

  const filtered = reservations
    .filter(r => statusFilter === 'all' || r.status === statusFilter)
    .filter(r => !search.trim() || r.client_name?.toLowerCase().includes(search.toLowerCase()))

  if (restaurantLoading) {
    return (
      <div className="p-8 flex items-center gap-3 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        Cargando...
      </div>
    )
  }

  return (
    <>
      <Toast toast={toast} />

      <div className="p-4 sm:p-8">
        <h2 className="text-2xl font-semibold text-white mb-1">Reservas</h2>
        <p className="text-gray-500 text-sm mb-6">{restaurant?.name}</p>

        {/* ── Filters ── */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* Date */}
          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="bg-gray-900 border border-gray-800 text-white text-sm rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Status tabs */}
          <div className="flex bg-gray-900 border border-gray-800 rounded-lg p-1 gap-1">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  statusFilter === f.value
                    ? 'bg-indigo-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre..."
              className="w-full bg-gray-900 border border-gray-800 text-white text-sm rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-600"
            />
          </div>
        </div>

        {/* ── Table ── */}
        {loading ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm py-12 justify-center">
            <Loader2 className="w-5 h-5 animate-spin" />
            Cargando reservas...
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState date={date} hasFilters={statusFilter !== 'all' || !!search} />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-800">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="text-gray-500 text-xs uppercase tracking-wider border-b border-gray-800 bg-gray-900/50">
                  <th className="px-4 py-3 text-left">Hora</th>
                  <th className="px-4 py-3 text-left">Cliente</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Teléfono</th>
                  <th className="px-4 py-3 text-left">Personas</th>
                  <th className="px-4 py-3 text-left">Mesa</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filtered.map(r => {
                  const s = STATUS[r.status] ?? STATUS.confirmed
                  return (
                    <tr key={r.id} className="bg-gray-900 hover:bg-gray-800/60 transition-colors">
                      <td className="px-4 py-3 text-white font-medium tabular-nums">
                        {r.time?.slice(0, 5)}
                      </td>
                      <td className="px-4 py-3 text-gray-200">{r.client_name}</td>
                      <td className="px-4 py-3 text-gray-400 max-w-[180px] truncate">{r.client_email}</td>
                      <td className="px-4 py-3 text-gray-400">{r.client_phone ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-400">{r.people}</td>
                      <td className="px-4 py-3 text-gray-400">
                        {r.tables?.number != null ? `Mesa ${r.tables.number}` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>
                          {s.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ActionButtons reservation={r} onUpdate={updateStatus} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

// ─── Action buttons ───────────────────────────────────────────────────────────

function ActionButtons({ reservation, onUpdate }) {
  const { status, id } = reservation
  if (status === 'cancelled') return <span className="text-gray-700 text-xs">—</span>

  return (
    <div className="flex items-center justify-end gap-1.5">
      {status === 'confirmed' && (
        <button
          onClick={() => onUpdate(id, 'completed')}
          title="Completar"
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          Completar
        </button>
      )}
      <button
        onClick={() => onUpdate(id, 'cancelled')}
        title="Cancelar"
        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
        Cancelar
      </button>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ date, hasFilters }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center mb-4">
        <CalendarDays className="w-7 h-7 text-gray-600" />
      </div>
      <p className="text-gray-400 font-medium">
        {hasFilters ? 'Sin resultados para los filtros aplicados' : 'Sin reservas para este día'}
      </p>
      <p className="text-gray-600 text-sm mt-1">{date}</p>
    </div>
  )
}
