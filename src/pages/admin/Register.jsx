import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import {
  Mail, Lock, AlertCircle, Loader2, Building2,
  ChevronLeft, Check,
} from 'lucide-react'

// ─── Slug generator ──────────────────────────────────────────────────────────
function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// ─── Stepper ─────────────────────────────────────────────────────────────────
function Stepper({ step }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {[1, 2].map((n) => (
        <div key={n} className="flex items-center gap-2 flex-1 last:flex-none">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-all ${
            n < step
              ? 'bg-indigo-500 text-white'
              : n === step
              ? 'bg-indigo-500/20 border border-indigo-500/50 text-indigo-400'
              : 'bg-gray-800 border border-gray-700 text-gray-600'
          }`}>
            {n < step ? <Check className="w-3.5 h-3.5" /> : n}
          </div>
          {n < 2 && (
            <div className={`flex-1 h-px transition-colors ${n < step ? 'bg-indigo-500' : 'bg-gray-800'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Register() {
  useEffect(() => { document.title = 'Crear cuenta · ReservApp' }, [])

  const navigate = useNavigate()
  const [step, setStep] = useState(1)

  // Step 1
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')

  // Step 2
  const [businessName, setBusinessName]   = useState('')
  const [selectedType, setSelectedType]   = useState(null)
  const [businessTypes, setBusinessTypes] = useState([])
  const [loadingTypes, setLoadingTypes]   = useState(false)

  const [error, setError]       = useState(null)
  const [loading, setLoading]   = useState(false)

  // Cargar tipos de negocio al montar step 2
  useEffect(() => {
    if (step === 2 && businessTypes.length === 0) loadBusinessTypes()
  }, [step])

  async function loadBusinessTypes() {
    setLoadingTypes(true)
    const { data } = await supabase.from('business_types').select('*').order('name')
    setBusinessTypes(data ?? [])
    setLoadingTypes(false)
  }

  // ── Paso 1: validar y avanzar ──
  function handleStep1(e) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setStep(2)
  }

  // ── Paso 2: crear cuenta ──
  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (!businessName.trim()) {
      setError('El nombre del negocio es requerido.')
      return
    }
    if (!slugify(businessName)) {
      setError('El nombre debe contener al menos una letra o número.')
      return
    }
    if (!selectedType) {
      setError('Selecciona el tipo de negocio.')
      return
    }
    setLoading(true)

    try {
      // 1. Crear usuario en Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      })
      if (authError) throw authError

      const userId = authData.user?.id
      if (!userId) throw new Error('No se pudo obtener el ID del usuario.')

      // 2. Insertar negocio
      const slug = slugify(businessName) || `negocio-${Date.now()}`
      const { error: insertError } = await supabase.from('restaurants').insert({
        owner_id:      userId,
        name:          businessName.trim(),
        slug,
        business_type: selectedType,
      })
      if (insertError) throw insertError

      navigate('/admin/dashboard')
    } catch (err) {
      setError(err.message ?? 'Error al crear la cuenta. Intenta de nuevo.')
      setLoading(false)
    }
  }

  const inputClass = "w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-12">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-4">
            <img src="/logo.png" alt="ReservApp" className="w-8 h-8 object-contain" />
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">ReservApp</h1>
          <p className="text-gray-500 text-sm mt-1">Crea tu cuenta gratis</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-xl shadow-black/40">
          <Stepper step={step} />

          {/* ── Step 1: credenciales ── */}
          {step === 1 && (
            <>
              <h2 className="text-lg font-medium text-white mb-6">Crea tu cuenta</h2>
              <form onSubmit={handleStep1} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-400">Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="w-4 h-4 text-gray-600" />
                    </div>
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError(null) }}
                      placeholder="tu@email.com"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-400">Contraseña</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="w-4 h-4 text-gray-600" />
                    </div>
                    <input
                      type="password"
                      required
                      autoComplete="new-password"
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(null) }}
                      placeholder="Mínimo 8 caracteres"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-400">Confirmar contraseña</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="w-4 h-4 text-gray-600" />
                    </div>
                    <input
                      type="password"
                      required
                      autoComplete="new-password"
                      value={confirm}
                      onChange={e => { setConfirm(e.target.value); setError(null) }}
                      placeholder="Repite la contraseña"
                      className={inputClass}
                    />
                  </div>
                </div>

                {error && <ErrorBox message={error} />}

                <button
                  type="submit"
                  className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
                >
                  Continuar
                </button>
              </form>
            </>
          )}

          {/* ── Step 2: negocio ── */}
          {step === 2 && (
            <>
              <h2 className="text-lg font-medium text-white mb-6">Tu negocio</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-400">Nombre del negocio</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Building2 className="w-4 h-4 text-gray-600" />
                    </div>
                    <input
                      type="text"
                      required
                      value={businessName}
                      onChange={e => { setBusinessName(e.target.value); setError(null) }}
                      placeholder="Ej: Restaurante El Rincón"
                      className={inputClass}
                    />
                  </div>
                  {businessName && (
                    <p className="text-xs text-gray-600 pl-1">
                      URL: <span className="text-indigo-400">reservapp.space/r/{slugify(businessName)}</span>
                    </p>
                  )}
                </div>

                {/* Business type cards */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-400">Tipo de negocio</label>
                  {loadingTypes ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {businessTypes.map(bt => {
                        const isSelected = selectedType === bt.id
                        return (
                          <button
                            key={bt.id}
                            type="button"
                            onClick={() => { setSelectedType(bt.id); setError(null) }}
                            className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-center ${
                              isSelected
                                ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                                : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600 hover:bg-gray-800'
                            }`}
                          >
                            <span className="text-2xl leading-none">{bt.icon}</span>
                            <span className="text-xs font-medium leading-tight">{bt.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {error && <ErrorBox message={error} />}

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => { setStep(1); setError(null) }}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Atrás
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 disabled:cursor-not-allowed text-white font-medium rounded-lg py-2.5 text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creando cuenta...
                      </>
                    ) : 'Crear cuenta'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link to="/admin/login" className="text-indigo-400 hover:text-indigo-300 transition-colors">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}

function ErrorBox({ message }) {
  return (
    <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
      <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
      <p className="text-sm text-red-400">{message}</p>
    </div>
  )
}
