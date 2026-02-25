import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import {
  CheckCircle, Zap, Mail, ArrowRight, CalendarCheck,
} from 'lucide-react'

const BUSINESS_TYPES = [
  { id: 'restaurant', icon: '🍽️', name: 'Restaurante',   desc: 'Mesas y turnos' },
  { id: 'parking',    icon: '🅿️', name: 'Parqueadero',   desc: 'Puestos por hora' },
  { id: 'carwash',    icon: '🚗', name: 'Lavadero',       desc: 'Turnos de lavado' },
  { id: 'salon',      icon: '✂️', name: 'Peluquería',     desc: 'Citas por servicio' },
  { id: 'court',      icon: '🏆', name: 'Cancha',         desc: 'Reservas por hora' },
  { id: 'office',     icon: '🏢', name: 'Consultorio',    desc: 'Agenda de citas' },
]

const BENEFITS = [
  {
    icon: CheckCircle,
    color: 'text-green-400',
    bg: 'bg-green-400/10 border-green-400/20',
    title: 'Sin comisiones',
    desc: 'Cada reserva es tuya al 100%. No cobramos por transacción ni por cliente.',
  },
  {
    icon: Zap,
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10 border-yellow-400/20',
    title: 'Listo en 5 minutos',
    desc: 'Crea tu cuenta, configura tu negocio y comparte tu link. Así de simple.',
  },
  {
    icon: Mail,
    color: 'text-indigo-400',
    bg: 'bg-indigo-400/10 border-indigo-400/20',
    title: 'Emails automáticos',
    desc: 'Tus clientes reciben confirmación al instante. Tú recibes notificación de cada reserva.',
  },
]

export default function LandingPage() {
  useEffect(() => { document.title = 'ReservApp — Reservas online para tu negocio' }, [])

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 border-b border-gray-800/60 bg-gray-950/90 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="ReservApp" className="w-7 h-7 object-contain rounded-lg" />
            <span className="text-sm font-semibold text-white">ReservApp</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/admin/login"
              className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5"
            >
              Iniciar sesión
            </Link>
            <Link
              to="/register"
              className="text-sm font-medium bg-indigo-500 hover:bg-indigo-600 text-white px-3.5 py-1.5 rounded-lg transition-colors"
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 pt-16 pb-20 sm:pt-24 sm:pb-28 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3.5 py-1.5 mb-6">
            <CalendarCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs font-medium text-indigo-400">100% gratis para empezar</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight tracking-tight mb-4">
            Reservas online para<br className="hidden sm:block" />{' '}
            <span className="text-indigo-400">tu negocio</span> en 5 minutos
          </h1>

          <p className="text-gray-400 text-base sm:text-lg max-w-xl mx-auto mb-8 leading-relaxed">
            Sin comisiones, sin complicaciones. Tus clientes reservan,
            tú te enfocas en atenderlos.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm shadow-lg shadow-indigo-500/25"
            >
              Crear cuenta gratis
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/r/mi-restaurante"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium px-6 py-3 rounded-xl transition-colors text-sm"
            >
              Ver demo
            </Link>
          </div>
        </div>
      </section>

      {/* ── Tipos de negocio ── */}
      <section className="py-16 sm:py-20 border-t border-gray-800/60">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Funciona para cualquier negocio
            </h2>
            <p className="text-gray-500 text-sm sm:text-base max-w-md mx-auto">
              Restaurantes, canchas, parqueaderos y más. Configura tu tipo de negocio y listo.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {BUSINESS_TYPES.map(bt => (
              <div
                key={bt.id}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-5 hover:border-gray-700 transition-colors group"
              >
                <span className="text-3xl sm:text-4xl block mb-3">{bt.icon}</span>
                <p className="text-sm font-semibold text-white leading-tight">{bt.name}</p>
                <p className="text-xs text-gray-500 mt-1">{bt.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Beneficios ── */}
      <section className="py-16 sm:py-20 border-t border-gray-800/60">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Todo lo que necesitas
            </h2>
            <p className="text-gray-500 text-sm sm:text-base">
              Sin tecnicismos. Sin configuraciones complicadas.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {BENEFITS.map(b => {
              const Icon = b.icon
              return (
                <div key={b.title} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 sm:p-6">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4 ${b.bg}`}>
                    <Icon className={`w-5 h-5 ${b.color}`} />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">{b.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{b.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="py-16 sm:py-20 border-t border-gray-800/60">
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Empieza gratis hoy
            </h2>
            <p className="text-gray-400 text-sm sm:text-base mb-8 max-w-sm mx-auto">
              Crea tu cuenta en segundos y empieza a recibir reservas hoy mismo.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors text-sm shadow-lg shadow-indigo-500/25 w-full sm:w-auto"
            >
              Crear cuenta gratis
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-800/60 py-6">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="ReservApp" className="w-5 h-5 object-contain rounded" />
            <span className="text-xs text-gray-600">ReservApp</span>
          </div>
          <p className="text-xs text-gray-700">© {new Date().getFullYear()} ReservApp. Todos los derechos reservados.</p>
        </div>
      </footer>

    </div>
  )
}
