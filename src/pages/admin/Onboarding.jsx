import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useRestaurant } from '../../hooks/useRestaurant'
import { unitLabel, capacityRange } from '../../lib/businessTypes'
import {
  Check, Loader2, Plus, Trash2, Copy, ExternalLink,
  Clock, LayoutGrid, Rocket,
} from 'lucide-react'

const DAYS = [
  { value: 1, label: 'Lu' },
  { value: 2, label: 'Ma' },
  { value: 3, label: 'Mi' },
  { value: 4, label: 'Ju' },
  { value: 5, label: 'Vi' },
  { value: 6, label: 'Sá' },
  { value: 0, label: 'Do' },
]

const STEPS = [
  { id: 1, label: 'Horarios',  icon: Clock },
  { id: 2, label: 'Espacios',  icon: LayoutGrid },
  { id: 3, label: '¡Listo!',   icon: Rocket },
]

// ─── Stepper ─────────────────────────────────────────────────────────────────
function Stepper({ step }) {
  return (
    <div className="flex items-center mb-8">
      {STEPS.map((s, idx) => {
        const done   = s.id < step
        const active = s.id === step
        return (
          <div key={s.id} className="flex items-center flex-1 last:flex-none">
            {idx > 0 && (
              <div className={`flex-1 h-px transition-colors ${done ? 'bg-indigo-500' : 'bg-gray-800'}`} />
            )}
            <div className="flex flex-col items-center shrink-0 gap-1.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                done   ? 'bg-indigo-500 text-white' :
                active ? 'bg-indigo-500/20 border border-indigo-500/50 text-indigo-400' :
                         'bg-gray-800 border border-gray-700 text-gray-600'
              }`}>
                {done ? <Check className="w-3.5 h-3.5" /> : s.id}
              </div>
              <span className={`text-[10px] font-medium hidden sm:block ${
                active ? 'text-indigo-400' : done ? 'text-gray-500' : 'text-gray-700'
              }`}>
                {s.label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Onboarding() {
  useEffect(() => { document.title = 'Configuración inicial · ReservApp' }, [])

  const navigate = useNavigate()
  const { restaurant, settings, loading } = useRestaurant()

  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  // Paso 1 — horarios
  const [openDays,      setOpenDays]      = useState([1, 2, 3, 4, 5])
  const [openTime,      setOpenTime]      = useState('08:00')
  const [closeTime,     setCloseTime]     = useState('22:00')
  const [slotInterval,  setSlotInterval]  = useState(30)
  const [requiresDeposit, setRequiresDeposit] = useState(false)
  const [depositPct,    setDepositPct]    = useState(20)

  // Paso 2 — recursos
  const [resources,        setResources]        = useState([])
  const [newNumber,        setNewNumber]        = useState('')
  const [newCapacity,      setNewCapacity]      = useState(2)

  // Si ya tiene configuración, ir directo al dashboard
  useEffect(() => {
    if (!loading && settings) navigate('/admin/dashboard', { replace: true })
  }, [loading, settings])

  // Sincronizar capacidad inicial con el tipo de negocio
  useEffect(() => {
    if (restaurant?.business_type) {
      const r = capacityRange(restaurant.business_type)
      setNewCapacity(r.min)
    }
  }, [restaurant?.business_type])

  // ── Paso 1: guardar settings ──────────────────────────────────────────────
  async function saveSettings() {
    if (openDays.length === 0) { setError('Selecciona al menos un día de apertura.'); return }
    setSaving(true); setError(null)
    try {
      const { error: err } = await supabase.from('settings').insert({
        restaurant_id:      restaurant.id,
        open_time:          openTime,
        close_time:         closeTime,
        slot_interval:      slotInterval,
        open_days:          openDays,
        requires_deposit:   requiresDeposit,
        deposit_percentage: requiresDeposit ? depositPct : 0,
      })
      if (err) throw err
      setStep(2)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Paso 2: agregar recurso a lista local ─────────────────────────────────
  function addResource() {
    if (!newNumber) return
    const num = parseInt(newNumber)
    if (resources.find(r => r.number === num)) {
      setError(`Ya existe un ${unitLabel(restaurant?.business_type, 'singular').toLowerCase()} con ese número.`)
      return
    }
    setResources(prev => [...prev, { number: num, capacity: newCapacity }])
    setNewNumber('')
    setError(null)
  }

  function removeResource(number) {
    setResources(prev => prev.filter(r => r.number !== number))
  }

  // ── Paso 2: guardar recursos ──────────────────────────────────────────────
  async function saveResources() {
    if (resources.length === 0) {
      setError(`Agrega al menos un ${unitLabel(restaurant?.business_type, 'singular').toLowerCase()}.`)
      return
    }
    setSaving(true); setError(null)
    try {
      const rows = resources.map(r => ({
        restaurant_id: restaurant.id,
        number:        r.number,
        capacity:      r.capacity,
        is_active:     true,
      }))
      const { error: err } = await supabase.from('resources').insert(rows)
      if (err) throw err
      setStep(3)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  function copyLink() {
    const url = `${window.location.origin}/r/${restaurant?.slug}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-indigo-400" />
      </div>
    )
  }

  const unitSingular = unitLabel(restaurant?.business_type, 'singular')
  const unitPlural   = unitLabel(restaurant?.business_type, 'plural')
  const publicUrl    = `${window.location.origin}/r/${restaurant?.slug}`

  const inputClass = "w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-12">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }} />

      <div className="relative w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-3">
            <img src="/logo.png" alt="ReservApp" className="w-7 h-7 object-contain" />
          </div>
          <p className="text-gray-500 text-sm">Configuración inicial</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-8 shadow-xl shadow-black/40">
          <Stepper step={step} />

          {/* ── Paso 1: Horarios ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">Horarios de atención</h2>
                <p className="text-gray-500 text-sm">¿Cuándo está abierto tu negocio?</p>
              </div>

              {/* Días */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Días de apertura</label>
                <div className="flex gap-1.5 flex-wrap">
                  {DAYS.map(d => {
                    const active = openDays.includes(d.value)
                    return (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => setOpenDays(prev =>
                          active ? prev.filter(v => v !== d.value) : [...prev, d.value]
                        )}
                        className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all ${
                          active
                            ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                            : 'bg-gray-800 text-gray-500 hover:bg-gray-700 border border-gray-700'
                        }`}
                      >
                        {d.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Horario */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Apertura</label>
                  <input
                    type="time"
                    value={openTime}
                    onChange={e => setOpenTime(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Cierre</label>
                  <input
                    type="time"
                    value={closeTime}
                    onChange={e => setCloseTime(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Intervalo */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Duración de cada turno</label>
                <div className="grid grid-cols-4 gap-2">
                  {[15, 30, 45, 60].map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setSlotInterval(v)}
                      className={`py-2 rounded-xl text-sm font-medium transition-all ${
                        slotInterval === v
                          ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'
                      }`}
                    >
                      {v} min
                    </button>
                  ))}
                </div>
              </div>

              {/* Depósito anticipado */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">Pago anticipado</p>
                    <p className="text-xs text-gray-500 mt-0.5">¿Se requiere un depósito para confirmar la reserva?</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRequiresDeposit(v => !v)}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                      requiresDeposit ? 'bg-indigo-500' : 'bg-gray-700'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      requiresDeposit ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {requiresDeposit && (
                  <div className="space-y-2 pt-1 border-t border-gray-700">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">% del depósito</p>
                    <div className="flex gap-2 flex-wrap">
                      {[10, 20, 25, 30, 50].map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setDepositPct(p)}
                          className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                            depositPct === p
                              ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'
                          }`}
                        >
                          {p}%
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-600">El cliente verá este porcentaje antes de confirmar su reserva.</p>
                  </div>
                )}
              </div>

              {error && <ErrorBox message={error} />}

              <button
                onClick={saveSettings}
                disabled={saving}
                className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Siguiente
              </button>
            </div>
          )}

          {/* ── Paso 2: Recursos ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">Agrega {unitPlural.toLowerCase()}</h2>
                <p className="text-gray-500 text-sm">¿Cuántos {unitPlural.toLowerCase()} tienes disponibles?</p>
              </div>

              {/* Lista actual */}
              {resources.length > 0 && (
                <div className="space-y-2">
                  {resources.map(r => (
                    <div key={r.number} className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2.5">
                      <div className="flex items-center gap-3">
                        <span className="text-white text-sm font-medium">{unitSingular} {r.number}</span>
                        <span className="text-xs text-gray-500 bg-gray-700 px-2 py-0.5 rounded-full">{r.capacity} personas</span>
                      </div>
                      <button
                        onClick={() => removeResource(r.number)}
                        className="text-gray-600 hover:text-red-400 transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Formulario agregar */}
              {(() => {
                const range = capacityRange(restaurant?.business_type)
                const locked = range.min === range.max
                return (
                  <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Agregar {unitSingular.toLowerCase()}</p>
                      {!locked && (
                        <p className="text-xs text-gray-600">{range.min}–{range.max} personas</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={newNumber}
                        onChange={e => setNewNumber(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addResource()}
                        placeholder="Nº"
                        min={1}
                        className="w-20 bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                      {locked ? (
                        <div className="flex-1 bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-500 flex items-center">
                          {range.min} {range.min === 1 ? 'persona' : 'personas'}
                        </div>
                      ) : (
                        <input
                          type="number"
                          value={newCapacity}
                          min={range.min}
                          max={range.max}
                          onChange={e => setNewCapacity(Math.min(range.max, Math.max(range.min, Number(e.target.value))))}
                          placeholder="Cap."
                          className="flex-1 bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                      )}
                      <button
                        type="button"
                        onClick={addResource}
                        disabled={!newNumber}
                        className="flex items-center gap-1.5 px-3 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })()}

              {error && <ErrorBox message={error} />}

              <div className="flex gap-3">
                <button
                  onClick={() => { setStep(1); setError(null) }}
                  className="px-4 py-3 text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600 rounded-xl transition-colors"
                >
                  Atrás
                </button>
                <button
                  onClick={saveResources}
                  disabled={saving || resources.length === 0}
                  className="flex-1 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Siguiente
                </button>
              </div>
            </div>
          )}

          {/* ── Paso 3: Listo ── */}
          {step === 3 && (
            <div className="space-y-6 text-center">
              <div>
                <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                  ¡Todo listo, {restaurant?.name}!
                </h2>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Tu negocio ya está configurado y listo para recibir reservas.
                </p>
              </div>

              {/* Link público */}
              <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 text-left space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tu link de reservas</p>
                <p className="text-indigo-400 text-sm font-mono truncate">{publicUrl}</p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={copyLink}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                      copied
                        ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-600'
                    }`}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copiado' : 'Copiar link'}
                  </button>
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-600 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              <button
                onClick={() => navigate('/admin/dashboard')}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
              >
                Ir al dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ErrorBox({ message }) {
  return (
    <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 rounded-lg px-3.5 py-3">
      <span className="text-red-400 text-sm">{message}</span>
    </div>
  )
}
