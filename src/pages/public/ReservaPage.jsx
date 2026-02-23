import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, addMonths, isBefore, startOfDay, isSameDay,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Loader2, UtensilsCrossed } from 'lucide-react'

// ─── email ────────────────────────────────────────────────────────────────────
// Uses the Supabase Edge Function `send-email` which calls Resend server-side.
// This avoids CORS restrictions and keeps the API key out of the browser bundle.
// Deploy instructions: see supabase/functions/send-email/index.ts

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
    <div className="flex items-center justify-center mb-8">
      {steps.map((label, idx) => {
        const n = idx + 1
        const active = n === step
        const done = n < step
        return (
          <div key={n} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  done
                    ? 'bg-indigo-500 text-white'
                    : active
                    ? 'bg-indigo-500 text-white ring-4 ring-indigo-100'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {done ? '✓' : n}
              </div>
              <span className={`mt-1 text-xs ${active ? 'text-indigo-600 font-medium' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`w-16 h-0.5 mx-2 mb-4 ${done ? 'bg-indigo-500' : 'bg-gray-200'}`} />
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
  const leadingBlanks = Array((getDay(days[0]) + 6) % 7).fill(null) // Mon=0

  const openDays = settings?.open_days ?? [1, 2, 3, 4, 5]
  const blockedDates = settings?.blocked_dates ?? []

  function isDisabled(day) {
    if (isBefore(day, today)) return true
    const jsDay = getDay(day) // 0=Sun
    if (!openDays.includes(jsDay)) return true
    if (blockedDates.includes(format(day, 'yyyy-MM-dd'))) return true
    return false
  }

  function prevMonth() {
    const prev = addMonths(viewMonth, -1)
    if (!isBefore(prev, startOfMonth(today))) setViewMonth(prev)
  }

  function handleSelect(day) {
    if (isDisabled(day)) return
    setSelected(day)
  }

  return (
    <div>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          disabled={isSameDay(viewMonth, startOfMonth(today))}
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <span className="text-sm font-medium text-gray-800 capitalize">
          {format(viewMonth, 'MMMM yyyy', { locale: es })}
        </span>
        <button
          onClick={() => setViewMonth(addMonths(viewMonth, 1))}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].map(d => (
          <div key={d} className="text-center text-xs text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {leadingBlanks.map((_, i) => <div key={`b${i}`} />)}
        {days.map(day => {
          const disabled = isDisabled(day)
          const isSelected = selected && isSameDay(day, selected)
          const isToday = isSameDay(day, today)
          return (
            <button
              key={day.toISOString()}
              onClick={() => handleSelect(day)}
              disabled={disabled}
              className={`aspect-square rounded-lg text-sm transition-colors flex items-center justify-center ${
                isSelected
                  ? 'bg-indigo-500 text-white font-semibold'
                  : disabled
                  ? 'text-gray-300 cursor-not-allowed'
                  : isToday
                  ? 'bg-indigo-50 text-indigo-600 font-medium hover:bg-indigo-100'
                  : 'text-gray-700 hover:bg-gray-100'
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
        className="mt-6 w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors"
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
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    loadSlots()
  }, [])

  async function loadSlots() {
    setLoading(true)
    try {
      const rawSlots = generateSlots(
        settings.open_time ?? '12:00',
        settings.close_time ?? '23:00',
        settings.slot_interval ?? 30
      )
      setSlots(rawSlots)

      const dateStr = format(date, 'yyyy-MM-dd')

      // 2 queries total instead of 2×N
      const [{ count: tableCount }, { data: booked }] = await Promise.all([
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

      // Count reservations per slot locally
      const countByTime = {}
      for (const r of booked ?? []) {
        countByTime[r.time] = (countByTime[r.time] ?? 0) + 1
      }

      const total = tableCount ?? 0
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
      <p className="text-sm text-gray-500 mb-4 capitalize">
        {format(date, "EEEE d 'de' MMMM", { locale: es })}
      </p>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-400 py-8 justify-center">
          <Loader2 className="w-5 h-5 animate-spin" />
          Consultando disponibilidad...
        </div>
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
                className={`p-3 rounded-lg border text-sm transition-colors ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium'
                    : info.available
                    ? 'border-gray-200 hover:border-indigo-300 text-gray-700'
                    : 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                }`}
              >
                <div className="font-medium">{time}</div>
                <div className="text-xs mt-0.5">
                  {info.available ? `${free} mesa${free !== 1 ? 's' : ''}` : 'Completo'}
                </div>
              </button>
            )
          })}
        </div>
      )}

      <div className="flex gap-3 mt-6">
        <button
          onClick={onBack}
          className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors"
        >
          Atrás
        </button>
        <button
          disabled={!selected}
          onClick={() => onSelect(selected)}
          className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors"
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
  const [form, setForm] = useState({ name: '', email: '', phone: '', people: 2 })
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

      console.log('[createReservation] iniciando', {
        restaurant_id: restaurant.id,
        date: dateStr,
        time: timeStr,
        people: form.people,
      })

      // ── Find an available table to assign ──────────────────────────────────
      const [
        { data: activeTables, error: tablesErr },
        { data: booked,       error: bookedErr },
      ] = await Promise.all([
        supabase
          .from('tables')
          .select('id')
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

      if (tablesErr) { console.error('[createReservation] tablesErr:', tablesErr); throw tablesErr }
      if (bookedErr) { console.error('[createReservation] bookedErr:', bookedErr); throw bookedErr }

      const bookedIds = new Set((booked ?? []).map(r => r.table_id))
      const freeTable = (activeTables ?? []).find(t => !bookedIds.has(t.id))

      console.log('[createReservation] mesas activas:', activeTables?.length ?? 0,
        '| reservadas:', bookedIds.size, '| libre:', freeTable?.id ?? 'ninguna')

      if (!freeTable) {
        setError('No hay mesas disponibles para este horario. Elige otro.')
        setSubmitting(false)
        return
      }

      // ── Insert reservation ─────────────────────────────────────────────────
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

      console.log('[createReservation] payload:', payload)

      const { data, error: insertErr } = await supabase
        .from('reservations')
        .insert(payload)
        .select()
        .single()

      console.log('[createReservation] respuesta Supabase:', { data, error: insertErr })

      if (insertErr) throw insertErr

      // Send confirmation email via Edge Function (non-blocking)
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
          // Log but don't block — reservation is already confirmed
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-gray-600 mb-1">Nombre *</label>
        <input
          required
          value={form.name}
          onChange={e => set('name', e.target.value)}
          placeholder="Tu nombre completo"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-600 mb-1">Email *</label>
        <input
          required
          type="email"
          value={form.email}
          onChange={e => set('email', e.target.value)}
          placeholder="tu@email.com"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-600 mb-1">Teléfono</label>
        <input
          type="tel"
          value={form.phone}
          onChange={e => set('phone', e.target.value)}
          placeholder="+34 600 000 000"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-600 mb-1">Personas *</label>
        <select
          value={form.people}
          onChange={e => set('people', Number(e.target.value))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
            <option key={n} value={n}>{n} {n === 1 ? 'persona' : 'personas'}</option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors"
        >
          Atrás
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
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
        .from('restaurants')
        .select('*')
        .eq('slug', slug)
        .single()

      if (!rest) { setNotFound(true); setLoadingRestaurant(false); return }

      const { data: sett } = await supabase
        .from('settings')
        .select('*')
        .eq('restaurant_id', rest.id)
        .single()

      setRestaurant(rest)
      setSettings(sett)
      setLoadingRestaurant(false)
    }
    load()
  }, [slug])

  if (loadingRestaurant) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  if (notFound || !restaurant) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900">Restaurante no encontrado</h1>
          <p className="text-gray-500 text-sm mt-2">El enlace puede ser incorrecto.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-md p-6">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            {restaurant.logo_url ? (
              <img
                src={restaurant.logo_url}
                alt={restaurant.name}
                className="h-16 w-auto max-w-[140px] object-contain"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center">
                <UtensilsCrossed className="w-7 h-7 text-gray-400" />
              </div>
            )}
          </div>
          <h1 className="text-xl font-semibold text-gray-900">{restaurant.name}</h1>
          <p className="text-sm text-gray-400 mt-0.5">Reserva tu mesa</p>
        </div>

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
      </div>
    </div>
  )
}
