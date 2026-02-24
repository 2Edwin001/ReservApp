import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
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
function SlotsStep({ restaurant, settings, date, onSelect, onBack }) {
  const [slots, setSlots] = useState([])
  const [availability, setAvailability] = useState({})
  const [tableCount, setTableCount] = useState(null)
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

      const [{ count: tc }, { data: booked }] = await Promise.all([
        supabase
          .from('tables')
          .select('*', { count: 'exact', head: true })
          .eq('restaurant_id', restaurant.id)
          .eq('is_active', true),
        supabase
          .from('reservations')
          .select('time')
          .eq('restaurant_id', restaurant.id)
          .eq('date', dateStr)
          .neq('status', 'cancelled'),
      ])

      const countByTime = {}
      for (const r of booked ?? []) {
        countByTime[r.time] = (countByTime[r.time] ?? 0) + 1
      }

      const total = tc ?? 0
      setTableCount(total)
      const avail = {}
      for (const time of rawSlots) {
        const reserved = countByTime[time + ':00'] ?? 0
        avail[time] = { available: reserved < total, tableCount: total, reservationCount: reserved }
      }
      setAvailability(avail)
    } catch (err) {
      console.error('[loadSlots]', err)
    } finally {
      setLoading(false)
    }
  }

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
      ) : tableCount === 0 ? (
        <p className="text-center text-sm text-gray-400 py-10">
          Este restaurante no tiene mesas disponibles por el momento.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {slots.map(time => {
            const info = availability[time] ?? { available: false, tableCount: 0, reservationCount: 0 }
            const free = info.tableCount - info.reservationCount
            const isSelected = selected === time
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
                <div className={`text-xs mt-1 ${
                  isSelected ? 'text-indigo-500' : info.available ? 'text-gray-400' : 'text-gray-300'
                }`}>
                  {info.available ? `${free} libre${free !== 1 ? 's' : ''}` : 'Completo'}
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
function CustomerForm({ restaurant, date, time, onBack }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', phone: '', people: 2, notes: '' })
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
          .from('tables')
          .select('id, capacity')
          .eq('restaurant_id', restaurant.id)
          .eq('is_active', true),
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
        setError(
          freeTables.length === 0
            ? 'No hay mesas disponibles para este horario. Elige otro.'
            : `No hay mesas con capacidad para ${form.people} personas. El máximo disponible es ${maxAvailable}.`
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

      if (insertErr) throw insertErr

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
        state: { reservation: data, restaurant },
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
          </label>
          <select
            value={form.people}
            onChange={e => set('people', Number(e.target.value))}
            className={inputClass}
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
              <option key={n} value={n}>{n} {n === 1 ? 'persona' : 'personas'}</option>
            ))}
          </select>
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
    if (restaurant) document.title = `${restaurant.name} · Reserva tu mesa`
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
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <UtensilsCrossed className="w-8 h-8 text-indigo-400" />
              </div>
            )}
          </div>
          <h1 className="text-xl font-bold text-gray-900">{restaurant.name}</h1>
          <p className="text-sm text-gray-400 mt-1">Reservá tu mesa</p>
        </div>

        {/* Form area */}
        <div className="px-7 py-7">
          {!settings ? (
            <p className="text-center text-sm text-gray-400 py-6">
              Este restaurante aún no tiene su horario configurado.<br />Volvé más tarde.
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
                  onSelect={time => { setSelectedTime(time); setStep(3) }}
                  onBack={() => setStep(1)}
                />
              )}
              {step === 3 && (
                <CustomerForm
                  restaurant={restaurant}
                  date={selectedDate}
                  time={selectedTime}
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
