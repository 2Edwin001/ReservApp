import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { CheckCircle, Calendar, Clock, Users, Hash } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export default function Confirmacion() {
  const { slug } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()

  // Redirect if accessed directly without booking state
  useEffect(() => {
    if (!state?.reservation) {
      navigate(`/r/${slug}`, { replace: true })
    }
  }, [state, slug, navigate])

  if (!state?.reservation) return null

  const { reservation, restaurant } = state
  const dateFormatted = format(parseISO(reservation.date), "EEEE d 'de' MMMM yyyy", { locale: es })
  const timeFormatted = reservation.time.slice(0, 5)
  const code = reservation.id.slice(0, 8).toUpperCase()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-md p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 mb-4">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>

        <h1 className="text-2xl font-semibold text-gray-900 mb-1">¡Reserva confirmada!</h1>
        <p className="text-gray-500 text-sm mb-6">
          Te esperamos en <span className="font-medium text-gray-700">{restaurant?.name ?? slug}</span>
        </p>

        {/* Details */}
        <div className="bg-gray-50 rounded-xl p-5 text-left space-y-3 mb-6">
          <DetailRow icon={<Calendar className="w-4 h-4 text-indigo-400" />} label="Fecha" value={dateFormatted} />
          <DetailRow icon={<Clock className="w-4 h-4 text-indigo-400" />} label="Hora" value={timeFormatted} />
          <DetailRow icon={<Users className="w-4 h-4 text-indigo-400" />} label="Personas" value={reservation.people} />
          <DetailRow icon={<Hash className="w-4 h-4 text-indigo-400" />} label="A nombre de" value={reservation.client_name} />
        </div>

        {/* Booking code */}
        <div className="border border-dashed border-indigo-200 rounded-xl p-4 mb-6">
          <p className="text-xs text-gray-400 mb-1">Código de reserva</p>
          <p className="text-2xl font-mono font-bold text-indigo-600 tracking-widest">{code}</p>
        </div>

        <button
          onClick={() => navigate(`/r/${slug}`)}
          className="w-full py-2.5 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors"
        >
          Hacer otra reserva
        </button>
      </div>
    </div>
  )
}

function DetailRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="shrink-0">{icon}</div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-800 capitalize">{value}</p>
      </div>
    </div>
  )
}
