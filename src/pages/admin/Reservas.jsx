import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRestaurant } from '../../hooks/useRestaurant'
import { Toast, useToast } from '../../components/admin/Toast'
import { format } from 'date-fns'
import { Search, CheckCheck, X, Loader2, CalendarDays, Users, LayoutGrid, MessageSquare } from 'lucide-react'
import { unitLabel } from '../../lib/businessTypes'

const STATUS = {
  pending:   { label: 'Pendiente',  cls: 'bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' },
  confirmed: { label: 'Confirmada', cls: 'bg-indigo-50 text-indigo-700 border border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20' },
  completed: { label: 'Completada', cls: 'bg-green-50 text-green-700 border border-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20' },
  cancelled: { label: 'Cancelada',  cls: 'bg-red-50 text-red-700 border border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' },
}

const STATUS_FILTERS = [
  { value: 'all',       label: 'Todas' },
  { value: 'pending',   label: 'Pendientes' },
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
      .select('*, resources(name, number)')
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
    const msg = { confirmed: 'Reserva confirmada', completed: 'Reserva completada', cancelled: 'Reserva cancelada' }
    show('success', msg[newStatus] ?? 'Actualizado')
  }

  const filtered = reservations
    .filter(r => statusFilter === 'all' || r.status === statusFilter)
    .filter(r => !search.trim() || r.client_name?.toLowerCase().includes(search.toLowerCase()))

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
    <>
      <Toast toast={toast} />

      <div className="p-6 md:p-10">

        {/* ── Header ── */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Reservas</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{restaurant?.name}</p>
        </div>

        {/* ── Filters ── */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 mb-6 space-y-3 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Date */}
            <div className="relative w-full sm:w-auto">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="input pl-9 w-full"
              />
            </div>

            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nombre..."
                className="input pl-9 w-full"
              />
            </div>
          </div>

          {/* Status filters */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  statusFilter === f.value
                    ? 'bg-indigo-500 text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-600'
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
            <span className="text-sm text-gray-400 dark:text-gray-500">Cargando reservas...</span>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState date={date} hasFilters={statusFilter !== 'all' || !!search} />
        ) : (
          <>
            {/* Result count */}
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 px-1">
              {filtered.length} reserva{filtered.length !== 1 ? 's' : ''} encontrada{filtered.length !== 1 ? 's' : ''}
            </p>

            {/* ── Desktop: table ── */}
            <div className="hidden md:block overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                    <th className="px-4 py-3 text-left">Hora</th>
                    <th className="px-4 py-3 text-left">Cliente</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Teléfono</th>
                    <th className="px-4 py-3 text-left">Personas</th>
                    <th className="px-4 py-3 text-left">{unitLabel(restaurant?.business_type, 'singular')}</th>
                    <th className="px-4 py-3 text-left">Estado</th>
                    <th className="px-4 py-3 text-left">Nota</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                  {filtered.map(r => {
                    const s = STATUS[r.status] ?? STATUS.pending
                    return (
                      <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-4 py-3 text-gray-900 dark:text-white font-bold tabular-nums">
                          {r.time?.slice(0, 5)}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-medium">{r.client_name}</td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-[160px] truncate">{r.client_email}</td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{r.client_phone ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{r.people}</td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                          {r.resources?.name || (r.resources?.number != null ? `${unitLabel(restaurant?.business_type, 'singular')} ${r.resources.number}` : '—')}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${s.cls}`}>
                            {s.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {r.notes ? (
                            <span title={r.notes} className="cursor-help inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 px-2 py-1 rounded-lg max-w-[140px]">
                              <MessageSquare className="w-3 h-3 shrink-0" />
                              <span className="truncate">{r.notes}</span>
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500 text-xs">—</span>
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
                const s = STATUS[r.status] ?? STATUS.pending
                return (
                  <div key={r.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 space-y-3 shadow-sm">
                    {/* Top row: time + name + status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center shrink-0">
                          <span className="text-gray-900 dark:text-white font-bold text-sm tabular-nums leading-none">
                            {r.time?.slice(0, 5)}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-gray-900 dark:text-white font-semibold text-sm truncate">{r.client_name}</p>
                          <p className="text-gray-500 dark:text-gray-400 text-xs truncate">{r.client_email}</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${s.cls}`}>
                        {s.label}
                      </span>
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700 flex-wrap">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                        {r.people} persona{r.people !== 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <LayoutGrid className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                        {r.resources?.name || (r.resources?.number != null ? `${unitLabel(restaurant?.business_type, 'singular')} ${r.resources.number}` : `Sin ${unitLabel(restaurant?.business_type, 'singular').toLowerCase()}`)}
                      </span>
                      {r.client_phone && (
                        <span className="text-gray-400 dark:text-gray-500">{r.client_phone}</span>
                      )}
                    </div>

                    {/* Nota */}
                    {r.notes && (
                      <div className="flex items-start gap-2 px-3 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl">
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-indigo-700 dark:text-indigo-400 leading-relaxed">{r.notes}</p>
                      </div>
                    )}

                    {/* Actions */}
                    {r.status !== 'cancelled' && r.status !== 'completed' && (
                      <div className="flex gap-2 pt-1">
                        {r.status === 'pending' && (
                          <button
                            onClick={() => updateStatus(r.id, 'confirmed')}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-100 dark:border-indigo-500/20 transition-colors"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            Confirmar
                          </button>
                        )}
                        {r.status === 'confirmed' && (
                          <button
                            onClick={() => updateStatus(r.id, 'completed')}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-500/20 border border-green-100 dark:border-green-500/20 transition-colors"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            Completar
                          </button>
                        )}
                        <button
                          onClick={() => updateStatus(r.id, 'cancelled')}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-100 dark:border-red-500/20 transition-colors"
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
  if (status === 'cancelled' || status === 'completed') return <span className="text-gray-400 dark:text-gray-500 text-xs">—</span>

  return (
    <div className="flex items-center justify-end gap-1.5">
      {status === 'pending' && (
        <button
          onClick={() => onUpdate(id, 'confirmed')}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-100 dark:border-indigo-500/20 transition-colors"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          Confirmar
        </button>
      )}
      {status === 'confirmed' && (
        <button
          onClick={() => onUpdate(id, 'completed')}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-500/20 border border-green-100 dark:border-green-500/20 transition-colors"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          Completar
        </button>
      )}
      <button
        onClick={() => onUpdate(id, 'cancelled')}
        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-100 dark:border-red-500/20 transition-colors"
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
      <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center mb-4">
        <CalendarDays className="w-7 h-7 text-gray-300 dark:text-gray-600" />
      </div>
      <p className="text-gray-700 dark:text-gray-300 font-semibold text-sm">
        {hasFilters ? 'Sin resultados' : 'Sin reservas para este día'}
      </p>
      <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
        {hasFilters ? 'Prueba cambiando los filtros.' : date}
      </p>
    </div>
  )
}
