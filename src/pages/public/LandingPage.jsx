import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import {
  ArrowRight, CalendarCheck, CheckCircle, Mail, Zap,
  UserPlus, Share2, Bell, Smartphone, Globe, CreditCard,
} from 'lucide-react'

// ─── Data ─────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    n: '1',
    icon: UserPlus,
    title: 'Crea tu cuenta y configura tu negocio',
    desc: 'Elegí el tipo de negocio, definí tus horarios y agregá tus espacios disponibles. Todo en menos de 5 minutos.',
  },
  {
    n: '2',
    icon: Share2,
    title: 'Compartí tu link o QR con tus clientes',
    desc: 'Recibís un link único: reservapp.space/r/tu-negocio. También podés imprimir tu QR y ponerlo en la entrada.',
  },
  {
    n: '3',
    icon: Bell,
    title: 'Los clientes reservan, vos recibís la notificación',
    desc: 'El cliente completa la reserva en 3 pasos sin crear cuenta. Vos recibís un email con todos los datos.',
  },
]

const BENEFITS = [
  {
    icon: CheckCircle,
    color: 'text-green-400',
    bg: 'bg-green-400/10 border-green-400/20',
    title: 'Sin comisiones por reserva',
    desc: 'Cada reserva es tuya al 100%. No cobramos por transacción ni por cliente.',
  },
  {
    icon: Mail,
    color: 'text-indigo-400',
    bg: 'bg-indigo-400/10 border-indigo-400/20',
    title: 'Emails automáticos',
    desc: 'Confirmación al cliente y notificación a vos en cada reserva. Sin hacer nada.',
  },
  {
    icon: CreditCard,
    color: 'text-amber-400',
    bg: 'bg-amber-400/10 border-amber-400/20',
    title: 'Pago anticipado configurable',
    desc: 'Activá un porcentaje de depósito para asegurar las reservas de tus clientes.',
  },
  {
    icon: Smartphone,
    color: 'text-sky-400',
    bg: 'bg-sky-400/10 border-sky-400/20',
    title: 'Panel admin desde el celular',
    desc: 'Gestioná tus reservas, horarios y recursos desde cualquier dispositivo.',
  },
  {
    icon: Globe,
    color: 'text-purple-400',
    bg: 'bg-purple-400/10 border-purple-400/20',
    title: 'Tu link propio',
    desc: 'reservapp.space/r/tu-negocio listo para compartir por WhatsApp, Instagram o donde quieras.',
  },
  {
    icon: Zap,
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10 border-yellow-400/20',
    title: 'Listo en 5 minutos',
    desc: 'Sin conocimientos técnicos. Solo configurá tu negocio y empezá a recibir reservas.',
  },
]

const FOR_WHO = [
  {
    icon: '🍽️',
    name: 'Restaurantes',
    desc: 'Gestiona mesas y turnos por horario. Tus clientes eligen su mesa sin necesidad de llamar.',
  },
  {
    icon: '🅿️',
    name: 'Parqueaderos',
    desc: 'Asigna puestos disponibles en tiempo real. Ideal para reserva anticipada de espacios.',
  },
  {
    icon: '🚗',
    name: 'Lavaderos',
    desc: 'Organiza turnos por bahía. Evitá aglomeraciones y tiempos de espera innecesarios.',
  },
  {
    icon: '✂️',
    name: 'Peluquerías',
    desc: 'Agenda citas por silla o estilista. Tus clientes reservan cuando quieran, 24/7.',
  },
  {
    icon: '🏆',
    name: 'Canchas deportivas',
    desc: 'Reservas por hora para fútbol, tenis, pádel y más. Controlá el aforo fácilmente.',
  },
  {
    icon: '🏢',
    name: 'Consultorios',
    desc: 'Gestioná tu agenda de citas de forma profesional. Sin llamadas, sin cruces de horarios.',
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

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
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 pt-16 pb-20 sm:pt-24 sm:pb-28 text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3.5 py-1.5 mb-6">
            <CalendarCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs font-medium text-indigo-400">100% gratis para empezar</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight tracking-tight mb-4">
            Reservas online para<br className="hidden sm:block" />{' '}
            <span className="text-indigo-400">tu negocio</span> en 5 minutos
          </h1>

          <p className="text-gray-400 text-base sm:text-lg max-w-xl mx-auto mb-8 leading-relaxed">
            Sin comisiones, sin complicaciones. Tus clientes reservan en 3 pasos,
            tú te enfocás en atenderlos.
          </p>

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

      {/* ── Cómo funciona ── */}
      <section className="py-16 sm:py-20 border-t border-gray-800/60">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Cómo funciona
            </h2>
            <p className="text-gray-500 text-sm sm:text-base max-w-md mx-auto">
              Tres pasos y tu negocio ya está recibiendo reservas.
            </p>
          </div>

          <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Connecting line on desktop */}
            <div className="hidden sm:block absolute top-8 left-[calc(16.67%+16px)] right-[calc(16.67%+16px)] h-px bg-gray-800" />

            {STEPS.map((s) => {
              const Icon = s.icon
              return (
                <div key={s.n} className="relative flex flex-col items-center text-center sm:items-center">
                  <div className="relative z-10 w-16 h-16 rounded-2xl bg-gray-900 border border-gray-700 flex items-center justify-center mb-4 shadow-lg">
                    <Icon className="w-7 h-7 text-indigo-400" />
                    <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-indigo-500 text-white text-xs font-bold flex items-center justify-center">
                      {s.n}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-2 leading-snug">{s.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed max-w-[220px]">{s.desc}</p>
                </div>
              )
            })}
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
              Restaurantes, canchas, parqueaderos y más. Configurá tu tipo de negocio y listo.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {FOR_WHO.map(bt => (
              <div
                key={bt.name}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-5 hover:border-gray-700 transition-colors"
              >
                <span className="text-3xl sm:text-4xl block mb-3">{bt.icon}</span>
                <p className="text-sm font-semibold text-white leading-tight mb-1">{bt.name}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{bt.desc}</p>
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
              Todo lo que necesitás
            </h2>
            <p className="text-gray-500 text-sm sm:text-base">
              Sin tecnicismos. Sin configuraciones complicadas.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BENEFITS.map(b => {
              const Icon = b.icon
              return (
                <div key={b.title} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4 ${b.bg}`}>
                    <Icon className={`w-5 h-5 ${b.color}`} />
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1.5">{b.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{b.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="py-16 sm:py-20 border-t border-gray-800/60">
        <div className="max-w-5xl mx-auto px-4">
          <div className="relative overflow-hidden bg-indigo-600/10 border border-indigo-500/20 rounded-2xl sm:rounded-3xl p-8 sm:p-14 text-center">
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 via-transparent to-purple-600/5 pointer-events-none" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3.5 py-1.5 mb-5">
                <CalendarCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-xs font-medium text-indigo-400">Sin tarjeta de crédito</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3 leading-tight">
                Empieza gratis hoy
              </h2>
              <p className="text-gray-400 text-sm sm:text-base mb-8 max-w-sm mx-auto leading-relaxed">
                Configura tu negocio en 5 minutos y empezá a recibir reservas hoy mismo.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  to="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors text-sm shadow-lg shadow-indigo-500/25"
                >
                  Crear cuenta gratis
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/r/mi-restaurante"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium px-6 py-3.5 rounded-xl transition-colors text-sm"
                >
                  Ver demo primero
                </Link>
              </div>

              <p className="text-gray-700 text-xs mt-6">
                Sin compromisos · Sin tarjeta de crédito · Sin comisiones
              </p>
            </div>
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
