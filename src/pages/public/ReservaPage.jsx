import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { unitLabel, BUSINESS_ICONS, capacityRange } from '../../lib/businessTypes'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, addMonths, isBefore, startOfDay, isSameDay,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Loader2, UtensilsCrossed, Check } from 'lucide-react'

// ─── email ────────────────────────────────────────────────────────────────────
async function sendConfirmationEmail({ client_name, client_email, restaurant_name, date, time, people, code }) {
  const { data, error } = await supabase.functions.invoke('smart-endpoint', {
    body: {
      type: 'confirmation',
      reservation: { client_name, client_email, restaurant_name, date, time, people, code },
    },
  })
  if (error) throw new Error(error.message)
  return data
}

// ─── helpers ─────────────────────────────────────────────────────────────────
function generateSlots(openTime, closeTime, intervalMin) {
  const slots = []
  const [oh, om] = openTime.split(':').map(Number)
  const [ch, cm] = closeTime.split(':').map(Number)
  let cur = oh * 60 + om
  const end = ch * 60 + cm
  while (cur < end) {
    const h = String(Math.floor(cur / 60)).padStart(2, '0')
    const m = String(cur % 60).padStart(2, '0')
    slots.push(`${h}:${m}`)
    cur += intervalMin
  }
  return slots
}

// ─── Stepper ─────────────────────────────────────────────────────────────────
function Stepper({ step }) {
  const steps = ['Fecha', 'Horario', 'Datos']
  return (
    <div className="flex items-start mb-8">
      {steps.map((label, idx) => {
        const n   = idx + 1
        const active = n === step
        const done   = n < step
        return (
          <div key={n} className="flex items-start flex-1">
            {idx > 0 && (
              <div className={`flex-1 h-0.5 mt-4 transition-colors ${done ? 'bg-indigo-400' : 'bg-gray-200'}`} />
            )}
            <div className="flex flex-col items-center shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                done
                  ? 'bg-indigo-500 text-white'
                  : active
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                  : 'bg-gray-100 text-gray-400'
              }`}>
                {done ? <Check className="w-4 h-4" /> : n}
              </div>
              <span className={`mt-1.5 text-xs font-medium ${
                active ? 'text-indigo-600' : done ? 'text-indigo-400' : 'text-gray-400'
              }`}>
                {label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mt-4 transition-colors ${n < step ? 'bg-indigo-400' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Step 1 — Calendar ───────────────────────────────────────────────────────
function CalendarStep({ settings, onSelect }) {
  const today = startOfDay(new Date())
  const [viewMonth, setViewMonth] = useState(startOfMonth(today))
  const [selected, setSelected] = useState(null)

  const days = eachDayOfInterval({ start: startOfMonth(viewMonth), end: endOfMonth(viewMonth) })
  const leadingBlanks = Array((getDay(days[0]) + 6) % 7).fill(null)

  const openDays    = settings?.open_days    ?? [1, 2, 3, 4, 5]
  const blockedDates = settings?.blocked_dates ?? []

  function isDisabled(day) {
    if (isBefore(day, today)) return true
    if (!openDays.includes(getDay(day))) return true
    if (blockedDates.includes(format(day, 'yyyy-MM-dd'))) return true
    return false
  }

  function prevMonth() {
    const prev = addMonths(viewMonth, -1)
    if (!isBefore(prev, startOfMonth(today))) setViewMonth(prev)
  }

  return (
    <div>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={prevMonth}
          disabled={isSameDay(viewMonth, startOfMonth(today))}
          className="p-2 rounded-xl hover:bg-gray-100 disabled:opacity-30 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-500" />
        </button>
        <span className="text-sm font-semibold text-gray-800 capitalize">
          {format(viewMonth, 'MMMM yyyy', { locale: es })}
        </span>
        <button
          onClick={() => setViewMonth(addMonths(viewMonth, 1))}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].map(d => (
          <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {leadingBlanks.map((_, i) => <div key={`b${i}`} />)}
        {days.map(day => {
          const disabled   = isDisabled(day)
          const isSelected = selected && isSameDay(day, selected)
          const isToday    = isSameDay(day, today)
          return (
            <button
              key={day.toISOString()}
              onClick={() => { if (!isDisabled(day)) setSelected(day) }}
              disabled={disabled}
              className={`aspect-square rounded-xl text-sm transition-all flex items-center justify-center font-medium ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : disabled
                  ? 'text-gray-200 cursor-not-allowed'
                  : isToday
                  ? 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200'
                  : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
              }`}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>

      <button
        disabled={!selected}
        onClick={() => onSelect(selected)}
        className="mt-6 w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-indigo-100 disabled:shadow-none"
      >
        Continuar
      </button>
    </div>
  )
}

// ─── Step 2 — Time slots ─────────────────────────────────────────────────────
function SlotsStep({ restaurant, settings, date, businessType, onSelect, onBack }) {
  const [slots, setSlots] = useState([])
  const [availability, setAvailability] = useState({})
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => { loadSlots() }, [])

  async function loadSlots() {
    setLoading(true)
    try {
      const rawSlots = generateSlots(
        settings?.open_time    ?? '12:00',
        settings?.close_time   ?? '23:00',
        settings?.slot_interval ?? 30
      )
      setSlots(rawSlots)

      const dateStr = format(date, 'yyyy-MM-dd')

      const [{ data: res }, { data: booked }] = await Promise.all([
        supabase
          .from('resources')
          .select('id, name, number, capacity')
          .eq('restaurant_id', restaurant.id)
          .neq('is_active', false)
          .order('number'),
        supabase
          .from('reservations')
          .select('time, table_id')
          .eq('restaurant_id', restaurant.id)
          .eq('date', dateStr)
          .neq('status', 'cancelled'),
      ])

      const activeResources = res ?? []
      setResources(activeResources)

      // Group booked resource IDs by HH:MM time
      const bookedByTime = {}
      for (const r of booked ?? []) {
        const t = r.time?.slice(0, 5)
        if (!bookedByTime[t]) bookedByTime[t] = new Set()
        bookedByTime[t].add(r.table_id)
      }

      const avail = {}
      for (const time of rawSlots) {
        const bookedIds   = bookedByTime[time] ?? new Set()
        const freeResources = activeResources.filter(r => !bookedIds.has(r.id))
        avail[time] = { available: freeResources.length > 0, freeResources }
      }
      setAvailability(avail)
    } catch (err) {
      console.error('[loadSlots]', err)
    } finally {
      setLoading(false)
    }
  }

  const singLabel = unitLabel(businessType, 'singular')
  const plurLabel = unitLabel(businessType, 'plural').toLowerCase()

  return (
    <div>
      <p className="text-sm font-medium text-gray-500 mb-5 capitalize">
        {format(date, "EEEE d 'de' MMMM", { locale: es })}
      </p>

      {loading ? (
        <div className="flex flex-col items-center gap-3 text-gray-400 py-10">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
          <span className="text-sm">Consultando disponibilidad...</span>
        </div>
      ) : resources.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-10">
          No hay {plurLabel} disponibles por el momento.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {slots.map(time => {
            const info = availability[time] ?? { available: false, freeResources: [] }
            const free = info.freeResources.length
            const isSelected = selected === time
            const freeLabel = free <= 2
              ? info.freeResources.map(r => r.name || `${singLabel} ${r.number}`).join(' · ')
              : `${free} ${free !== 1 ? plurLabel : singLabel.toLowerCase()}`
            return (
              <button
                key={time}
                disabled={!info.available}
                onClick={() => setSelected(time)}
                className={`p-3.5 rounded-xl border-2 text-sm transition-all ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-100'
                    : info.available
                    ? 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 bg-white'
                    : 'border-gray-100 bg-gray-50 cursor-not-allowed'
                }`}
              >
                <div className={`font-bold text-base leading-none ${
                  isSelected ? 'text-indigo-700' : info.available ? 'text-gray-800' : 'text-gray-300'
                }`}>
                  {time}
                </div>
                <div className={`text-xs mt-1 leading-tight ${
                  isSelected ? 'text-indigo-500' : info.available ? 'text-gray-400' : 'text-gray-300'
                }`}>
                  {info.available ? freeLabel : 'Completo'}
                </div>
              </button>
            )
          })}
        </div>
      )}

      <div className="flex gap-3 mt-6">
        <button
          onClick={onBack}
          className="flex-1 py-3 border-2 border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
        >
          Atrás
        </button>
        <button
          disabled={!selected}
          onClick={() => onSelect(selected)}
          className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-indigo-100 disabled:shadow-none"
        >
          Continuar
        </button>
      </div>
    </div>
  )
}

// ─── Step 3 — Customer form ───────────────────────────────────────────────────
function CustomerForm({ restaurant, settings, date, time, businessType, onBack }) {
  const navigate = useNavigate()
  const range = capacityRange(businessType)
  const depositPct = settings?.requires_deposit ? (settings.deposit_percentage ?? 0) : 0
  const [form, setForm] = useState({ name: '', email: '', phone: '', people: range.min, notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const dateStr = format(date, 'yyyy-MM-dd')
      const timeStr = time + ':00'

      const [
        { data: activeTables, error: tablesErr },
        { data: booked,       error: bookedErr },
      ] = await Promise.all([
        supabase
          .from('resources')
          .select('id, name, number, capacity')
          .eq('restaurant_id', restaurant.id)
          .neq('is_active', false),
        supabase
          .from('reservations')
          .select('table_id')
          .eq('restaurant_id', restaurant.id)
          .eq('date', dateStr)
          .eq('time', timeStr)
          .neq('status', 'cancelled'),
      ])

      if (tablesErr) throw tablesErr
      if (bookedErr) throw bookedErr

      const bookedIds  = new Set((booked ?? []).map(r => r.table_id))
      const freeTables = (activeTables ?? []).filter(t => !bookedIds.has(t.id))
      const freeTable  = freeTables.find(t => t.capacity >= form.people)

      if (!freeTable) {
        const maxAvailable = freeTables.length > 0 ? Math.max(...freeTables.map(t => t.capacity)) : 0
        const plur = unitLabel(businessType, 'plural').toLowerCase()
        setError(
          freeTables.length === 0
            ? `No hay ${plur} disponibles para este horario. Elige otro.`
            : `No hay ${plur} con capacidad para ${form.people} personas. El máximo disponible es ${maxAvailable}.`
        )
        setSubmitting(false)
        return
      }

      const payload = {
        restaurant_id: restaurant.id,
        table_id:      freeTable.id,
        date:          dateStr,
        time:          timeStr,
        client_name:   form.name,
        client_email:  form.email,
        people:        form.people,
        status:        'confirmed',
      }
      if (form.phone) payload.client_phone = form.phone
      if (form.notes.trim()) payload.notes = form.notes.trim()

      const { data, error: insertErr } = await supabase
        .from('reservations')
        .insert(payload)
        .select()
        .single()

      if (insertErr) {
        console.error('Error completo:', JSON.stringify(insertErr, null, 2))
        console.error('Payload enviado:', JSON.stringify(payload, null, 2))
        throw insertErr
      }

      const code = data.id.slice(0, 8).toUpperCase()
      sendConfirmationEmail({
        client_name:     data.client_name,
        client_email:    data.client_email,
        restaurant_name: restaurant.name,
        date:            data.date,
        time:            data.time.slice(0, 5),
        people:          data.people,
        code,
      })
        .then(() => console.log('[send-email] enviado ok'))
        .catch(err => {
          console.error('[send-email] error:', err.message)
          setError(`Reserva confirmada, pero el email falló: ${err.message}`)
        })

      navigate(`/r/${restaurant.slug}/confirmacion`, {
        state: {
          reservation: data,
          restaurant,
          resource_name: freeTable.name || `${unitLabel(restaurant.business_type, 'singular')} ${freeTable.number}`,
          deposit_percentage: depositPct,
        },
      })
    } catch (err) {
      console.error('[createReservation] error:', err)
      setError(err.message ?? 'Error al crear la reserva. Intenta de nuevo.')
      setSubmitting(false)
    }
  }

  const inputClass = "w-full border border-gray-200 bg-gray-50/50 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white transition-all placeholder-gray-400"

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
          Nombre completo *
        </label>
        <input
          required
          value={form.name}
          onChange={e => set('name', e.target.value)}
          placeholder="Tu nombre"
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
          Email *
        </label>
        <input
          required
          type="email"
          value={form.email}
          onChange={e => set('email', e.target.value)}
          placeholder="tu@email.com"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
            Teléfono
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={e => set('phone', e.target.value)}
            placeholder="+34 600 000 000"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
            Personas *
            {range.min !== range.max && (
              <span className="ml-1 normal-case font-normal text-gray-400">({range.min}–{range.max})</span>
            )}
          </label>
          {range.min === range.max ? (
            <div className={`${inputClass} text-gray-500`}>
              {range.min} {range.min === 1 ? 'persona' : 'personas'}
            </div>
          ) : (
            <input
              type="number"
              required
              min={range.min}
              max={range.max}
              value={form.people}
              onChange={e => set('people', Math.min(range.max, Math.max(range.min, Number(e.target.value))))}
              className={inputClass}
            />
          )}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
          Nota especial <span className="text-gray-400 normal-case font-normal">(opcional)</span>
        </label>
        <textarea
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
          placeholder="Cumpleaños, alergias, preferencia de mesa..."
          rows={2}
          maxLength={200}
          className={`${inputClass} resize-none`}
        />
        <p className="text-right text-xs text-gray-300 mt-0.5">{form.notes.length}/200</p>
      </div>

      {depositPct > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-3 flex items-start gap-2.5">
          <span className="text-lg shrink-0 leading-none mt-0.5">💳</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">Requiere depósito del {depositPct}%</p>
            <p className="text-xs text-amber-600 mt-0.5">El negocio te contactará para coordinar el pago antes de tu reserva.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3 border-2 border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
        >
          Atrás
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-indigo-100 disabled:shadow-none flex items-center justify-center gap-2"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          Confirmar reserva
        </button>
      </div>
    </form>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ReservaPage() {
  const { slug } = useParams()
  const [step, setStep] = useState(1)
  const [restaurant, setRestaurant] = useState(null)
  const [settings, setSettings] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [loadingRestaurant, setLoadingRestaurant] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (restaurant) document.title = `${restaurant.name} · Reserva ${unitLabel(restaurant.business_type, 'article')}`
  }, [restaurant])

  useEffect(() => {
    async function load() {
      const { data: rest } = await supabase
        .from('restaurants').select('*').eq('slug', slug).single()

      if (!rest) { setNotFound(true); setLoadingRestaurant(false); return }

      const { data: sett } = await supabase
        .from('settings').select('*').eq('restaurant_id', rest.id).single()

      setRestaurant(rest)
      setSettings(sett)
      setLoadingRestaurant(false)
    }
    load()
  }, [slug])

  if (loadingRestaurant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50/40 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  if (notFound || !restaurant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50/40 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <UtensilsCrossed className="w-8 h-8 text-gray-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Restaurante no encontrado</h1>
          <p className="text-gray-500 text-sm mt-2">El enlace puede ser incorrecto.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50/40 flex items-start justify-center px-4 py-12">
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/80 border border-gray-100 w-full max-w-md overflow-hidden">

        {/* Restaurant header */}
        <div className="px-7 pt-8 pb-6 text-center border-b border-gray-100">
          <div className="flex justify-center mb-4">
            {restaurant.logo_url ? (
              <img
                src={restaurant.logo_url}
                alt={restaurant.name}
                className="h-20 w-auto max-w-[160px] object-contain"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-3xl mx-auto">
                {BUSINESS_ICONS[restaurant.business_type] ?? '🏪'}
              </div>
            )}
          </div>
          <h1 className="text-xl font-bold text-gray-900">{restaurant.name}</h1>
          <p className="text-sm text-gray-400 mt-1">Reservá {unitLabel(restaurant.business_type, 'article')}</p>
        </div>

        {/* Form area */}
        <div className="px-7 py-7">
          {!settings ? (
            <p className="text-center text-sm text-gray-400 py-6">
              Este negocio aún no tiene su horario configurado.<br />Volvé más tarde.
            </p>
          ) : (
            <>
              <Stepper step={step} />

              {step === 1 && (
                <CalendarStep
                  settings={settings}
                  onSelect={date => { setSelectedDate(date); setStep(2) }}
                />
              )}
              {step === 2 && (
                <SlotsStep
                  restaurant={restaurant}
                  settings={settings}
                  date={selectedDate}
                  businessType={restaurant.business_type}
                  onSelect={time => { setSelectedTime(time); setStep(3) }}
                  onBack={() => setStep(1)}
                />
              )}
              {step === 3 && (
                <CustomerForm
                  restaurant={restaurant}
                  settings={settings}
                  date={selectedDate}
                  time={selectedTime}
                  businessType={restaurant.business_type}
                  onBack={() => setStep(2)}
                />
              )}
            </>
          )}
        </div>

        {/* Footer attribution */}
        <div className="px-7 pb-5 text-center">
          <p className="text-xs text-gray-300">Powered by ReservApp</p>
        </div>

      </div>
    </div>
  )
}
