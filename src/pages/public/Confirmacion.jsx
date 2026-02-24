import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { CheckCircle, Calendar, Clock, Users, User, UtensilsCrossed } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export default function Confirmacion() {
  const { slug } = useParams()
  const { state } = useLocation()
  const navigate  = useNavigate()

  useEffect(() => {
    if (!state?.reservation) navigate(`/r/${slug}`, { replace: true })
  }, [state, slug, navigate])

  if (!state?.reservation) return null

  const { reservation, restaurant } = state
  const dateFormatted = format(parseISO(reservation.date), "EEEE d 'de' MMMM yyyy", { locale: es })
  const timeFormatted = reservation.time.slice(0, 5)
  const code          = reservation.id.slice(0, 8).toUpperCase()

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50/40 flex items-start justify-center px-4 py-12">
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/80 border border-gray-100 w-full max-w-md overflow-hidden">

        {/* Success header */}
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 px-7 pt-8 pb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-4">
            <CheckCircle className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">¡Reserva confirmada!</h1>
          <p className="text-indigo-200 text-sm">
            Te esperamos en <span className="text-white font-semibold">{restaurant?.name ?? slug}</span>
          </p>
        </div>

        <div className="px-7 py-7 space-y-5">

          {/* Booking code */}
          <div className="relative bg-indigo-50 rounded-2xl border border-indigo-100 overflow-hidden">
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-8 bg-white rounded-r-full border-r border-y border-indigo-100" />
            <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-8 bg-white rounded-l-full border-l border-y border-indigo-100" />
            <div className="px-6 py-5 text-center">
              <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-2">
                Código de reserva
              </p>
              <p className="text-3xl font-mono font-bold text-indigo-600 tracking-[0.25em]">
                {code}
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2">
            <DetailRow
              icon={Calendar}
              color="indigo"
              label="Fecha"
              value={<span className="capitalize">{dateFormatted}</span>}
            />
            <DetailRow
              icon={Clock}
              color="purple"
              label="Hora"
              value={timeFormatted}
            />
            <DetailRow
              icon={Users}
              color="green"
              label="Personas"
              value={`${reservation.people} ${reservation.people === 1 ? 'persona' : 'personas'}`}
            />
            <DetailRow
              icon={User}
              color="orange"
              label="A nombre de"
              value={reservation.client_name}
            />
          </div>

          {/* CTA */}
          <button
            onClick={() => navigate(`/r/${slug}`)}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-indigo-100"
          >
            Hacer otra reserva
          </button>
        </div>

        {/* Footer attribution */}
        <div className="pb-5 text-center">
          <p className="text-xs text-gray-300">Powered by ReservApp</p>
        </div>

      </div>
    </div>
  )
}

// ─── DetailRow ────────────────────────────────────────────────────────────────

const ROW_COLORS = {
  indigo: 'bg-indigo-50 border-indigo-100 text-indigo-500',
  purple: 'bg-purple-50 border-purple-100 text-purple-500',
  green:  'bg-green-50  border-green-100  text-green-500',
  orange: 'bg-orange-50 border-orange-100 text-orange-500',
}

function DetailRow({ icon: Icon, color = 'indigo', label, value }) {
  const c = ROW_COLORS[color]
  return (
    <div className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${c}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-sm font-semibold text-gray-800 truncate">{value}</p>
      </div>
    </div>
  )
}
