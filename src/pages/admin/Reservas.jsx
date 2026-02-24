import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRestaurant } from '../../hooks/useRestaurant'
import { Toast, useToast } from '../../components/admin/Toast'
import { format } from 'date-fns'
import { Search, CheckCheck, X, Loader2, CalendarDays, Users, LayoutGrid, MessageSquare } from 'lucide-react'

const STATUS = {
  confirmed: { label: 'Confirmada', cls: 'bg-indigo-50 text-indigo-700 border border-indigo-100' },
  completed: { label: 'Completada', cls: 'bg-green-50 text-green-700 border border-green-100' },
  cancelled: { label: 'Cancelada',  cls: 'bg-red-50 text-red-700 border border-red-100' },
}

const STATUS_FILTERS = [
  { value: 'all',       label: 'Todas' },
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="text-sm text-gray-400">Cargando...</span>
        </div>
      </div>
    )
  }

  return (
    <>
      <Toast toast={toast} />

      <div className="p-6 md:p-10">

        {/* ── Header ── */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Reservas</h2>
          <p className="text-gray-500 text-sm mt-1">{restaurant?.name}</p>
        </div>

        {/* ── Filters ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-6 space-y-3 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Date */}
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="input pl-9 w-full sm:w-auto"
              />
            </div>

            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nombre..."
                className="input pl-9 w-full"
              />
            </div>
          </div>

          {/* Status filters */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  statusFilter === f.value
                    ? 'bg-indigo-500 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
            <span className="text-sm text-gray-400">Cargando reservas...</span>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState date={date} hasFilters={statusFilter !== 'all' || !!search} />
        ) : (
          <>
            {/* Result count */}
            <p className="text-xs text-gray-500 mb-3 px-1">
              {filtered.length} reserva{filtered.length !== 1 ? 's' : ''} encontrada{filtered.length !== 1 ? 's' : ''}
            </p>

            {/* ── Desktop: table ── */}
            <div className="hidden md:block overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                    <th className="px-4 py-3 text-left">Hora</th>
                    <th className="px-4 py-3 text-left">Cliente</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Teléfono</th>
                    <th className="px-4 py-3 text-left">Personas</th>
                    <th className="px-4 py-3 text-left">Mesa</th>
                    <th className="px-4 py-3 text-left">Estado</th>
                    <th className="px-4 py-3 text-left">Nota</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filtered.map(r => {
                    const s = STATUS[r.status] ?? STATUS.confirmed
                    return (
                      <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-900 font-bold tabular-nums">
                          {r.time?.slice(0, 5)}
                        </td>
                        <td className="px-4 py-3 text-gray-700 font-medium">{r.client_name}</td>
                        <td className="px-4 py-3 text-gray-500 max-w-[160px] truncate">{r.client_email}</td>
                        <td className="px-4 py-3 text-gray-500">{r.client_phone ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-500">{r.people}</td>
                        <td className="px-4 py-3 text-gray-500">
                          {r.tables?.number != null ? `Mesa ${r.tables.number}` : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${s.cls}`}>
                            {s.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {r.notes ? (
                            <span title={r.notes} className="cursor-help inline-flex items-center gap-1.5 text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-lg max-w-[140px]">
                              <MessageSquare className="w-3 h-3 shrink-0" />
                              <span className="truncate">{r.notes}</span>
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
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

            {/* ── Mobile: cards ── */}
            <div className="md:hidden space-y-3">
              {filtered.map(r => {
                const s = STATUS[r.status] ?? STATUS.confirmed
                return (
                  <div key={r.id} className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3 shadow-sm">
                    {/* Top row: time + name + status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                          <span className="text-gray-900 font-bold text-sm tabular-nums leading-none">
                            {r.time?.slice(0, 5)}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-gray-900 font-semibold text-sm truncate">{r.client_name}</p>
                          <p className="text-gray-500 text-xs truncate">{r.client_email}</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${s.cls}`}>
                        {s.label}
                      </span>
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100 flex-wrap">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        {r.people} persona{r.people !== 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <LayoutGrid className="w-3.5 h-3.5 text-gray-400" />
                        {r.tables?.number != null ? `Mesa ${r.tables.number}` : 'Sin mesa'}
                      </span>
                      {r.client_phone && (
                        <span className="text-gray-400">{r.client_phone}</span>
                      )}
                    </div>

                    {/* Nota */}
                    {r.notes && (
                      <div className="flex items-start gap-2 px-3 py-2.5 bg-indigo-50 border border-indigo-100 rounded-xl">
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-indigo-700 leading-relaxed">{r.notes}</p>
                      </div>
                    )}

                    {/* Actions */}
                    {r.status !== 'cancelled' && (
                      <div className="flex gap-2 pt-1">
                        {r.status === 'confirmed' && (
                          <button
                            onClick={() => updateStatus(r.id, 'completed')}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 border border-green-100 transition-colors"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            Completar
                          </button>
                        )}
                        <button
                          onClick={() => updateStatus(r.id, 'cancelled')}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 border border-red-100 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </>
  )
}

// ─── Action buttons (desktop) ─────────────────────────────────────────────────

function ActionButtons({ reservation, onUpdate }) {
  const { status, id } = reservation
  if (status === 'cancelled') return <span className="text-gray-400 text-xs">—</span>

  return (
    <div className="flex items-center justify-end gap-1.5">
      {status === 'confirmed' && (
        <button
          onClick={() => onUpdate(id, 'completed')}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 border border-green-100 transition-colors"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          Completar
        </button>
      )}
      <button
        onClick={() => onUpdate(id, 'cancelled')}
        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 border border-red-100 transition-colors"
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
      <div className="w-14 h-14 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center mb-4">
        <CalendarDays className="w-7 h-7 text-gray-300" />
      </div>
      <p className="text-gray-700 font-semibold text-sm">
        {hasFilters ? 'Sin resultados' : 'Sin reservas para este día'}
      </p>
      <p className="text-gray-400 text-xs mt-1">
        {hasFilters ? 'Prueba cambiando los filtros.' : date}
      </p>
    </div>
  )
}
