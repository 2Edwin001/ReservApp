import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRestaurant } from '../../hooks/useRestaurant'
import { Toast, useToast } from '../../components/admin/Toast'
import { Plus, Trash2, Save, Loader2, ImagePlus, X } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

const DAYS = [
  { value: 1, label: 'Lu' },
  { value: 2, label: 'Ma' },
  { value: 3, label: 'Mi' },
  { value: 4, label: 'Ju' },
  { value: 5, label: 'Vi' },
  { value: 6, label: 'Sá' },
  { value: 0, label: 'Do' },
]

const CAPACITIES = [2, 4, 6, 8]

export default function Configuracion() {
  useEffect(() => { document.title = 'Configuración · ReservApp' }, [])

  const { restaurant, settings, loading, refetch } = useRestaurant()

  const { toast, show: showToast } = useToast()

  // Info General
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [savingInfo, setSavingInfo] = useState(false)

  // Logo
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  // Horarios
  const [openTime, setOpenTime] = useState('12:00')
  const [closeTime, setCloseTime] = useState('23:00')
  const [slotInterval, setSlotInterval] = useState(30)
  const [openDays, setOpenDays] = useState([1, 2, 3, 4, 5])
  const [savingHours, setSavingHours] = useState(false)

  // Mesas
  const [tables, setTables] = useState([])
  const [newTableNumber, setNewTableNumber] = useState('')
  const [newTableCapacity, setNewTableCapacity] = useState(4)
  const [loadingTables, setLoadingTables] = useState(false)

  // Días bloqueados
  const [blockedDates, setBlockedDates] = useState([])
  const [newBlockedDate, setNewBlockedDate] = useState('')
  const [savingBlocked, setSavingBlocked] = useState(false)

  // ── Sync state when data loads ──
  useEffect(() => {
    if (restaurant) {
      setName(restaurant.name ?? '')
      setSlug(restaurant.slug ?? '')
    }
  }, [restaurant])

  useEffect(() => {
    if (settings) {
      setOpenTime(settings.open_time ?? '12:00')
      setCloseTime(settings.close_time ?? '23:00')
      setSlotInterval(settings.slot_interval ?? 30)
      setOpenDays(settings.open_days ?? [1, 2, 3, 4, 5])
      setBlockedDates(settings.blocked_dates ?? [])
    }
  }, [settings])

  useEffect(() => {
    if (restaurant) loadTables()
  }, [restaurant])

  // ── Tables ──
  async function loadTables() {
    if (!restaurant) return
    setLoadingTables(true)
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .order('number')
    if (error) console.error('[loadTables]', error)
    setTables(data ?? [])
    setLoadingTables(false)
  }

  // ── Logo ──
  function handleLogoFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  async function uploadLogo() {
    if (!logoFile || !restaurant) return
    setUploadingLogo(true)
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw new Error('Sin sesión activa')

      const ext = logoFile.name.split('.').pop().toLowerCase()
      const filePath = `${user.id}/logo-${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, logoFile)

      if (uploadError) throw new Error(uploadError.message)

      const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('restaurants')
        .update({ logo_url: publicUrl })
        .eq('id', restaurant.id)

      if (updateError) throw new Error(updateError.message)

      setLogoFile(null)
      setLogoPreview(null)
      await refetch()
      showToast('success', 'Logo actualizado correctamente')
    } catch (err) {
      showToast('error', err.message)
    } finally {
      setUploadingLogo(false)
    }
  }

  async function deleteLogo() {
    if (!restaurant?.logo_url) return
    try {
      const path = restaurant.logo_url.split('/logos/')[1]
      await supabase.storage.from('logos').remove([path])
      const { error } = await supabase
        .from('restaurants')
        .update({ logo_url: null })
        .eq('id', restaurant.id)
      if (error) throw new Error(error.message)
      await refetch()
      showToast('success', 'Logo eliminado')
    } catch (err) {
      showToast('error', err.message)
    }
  }

  // ── Name → slug ──
  function handleNameChange(val) {
    setName(val)
    setSlug(val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
  }

  // ── Info General save ──
  async function saveInfo() {
    console.log('[saveInfo] iniciando', { name, slug, restaurantId: restaurant?.id })
    setSavingInfo(true)
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw new Error(authError?.message ?? 'Sin sesión activa')

      console.log('[saveInfo] user.id =', user.id)

      // Warmup select — fuerza que el cliente resuelva el schema antes del upsert.
      // NOTA: el schema cache del servidor solo se recarga desde el dashboard
      // (Project Settings → API → Reload Schema) o con: NOTIFY pgrst, 'reload schema'
      const { error: schemaError } = await supabase.from('restaurants').select('id').limit(1)
      if (schemaError) {
        console.warn('[saveInfo] warmup select error:', schemaError.message)
        // No abortamos — el error de schema se verá en el upsert con mejor contexto
      }

      // Build payload — omit id when undefined to avoid upsert conflict issues
      const payload = { user_id: user.id, name, slug }
      if (restaurant?.id) payload.id = restaurant.id

      console.log('[saveInfo] payload =', payload)

      const { data, error } = await supabase
        .from('restaurants')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single()

      console.log('[saveInfo] respuesta Supabase:', { data, error })

      if (error) throw new Error(error.message)

      await refetch()
      showToast('success', 'Información guardada correctamente')
    } catch (err) {
      console.error('[saveInfo] error:', err)
      showToast('error', err.message)
    } finally {
      setSavingInfo(false)
    }
  }

  // ── Horarios save ──
  async function saveHours() {
    console.log('[saveHours] iniciando', { restaurantId: restaurant?.id, settingsId: settings?.id })
    if (!restaurant) {
      showToast('error', 'Guarda primero la información general del restaurante')
      return
    }
    setSavingHours(true)
    try {
      // Build payload — omit id when undefined
      const payload = {
        restaurant_id: restaurant.id,
        open_time: openTime,
        close_time: closeTime,
        slot_interval: slotInterval,
        open_days: openDays,
      }
      if (settings?.id) payload.id = settings.id

      console.log('[saveHours] payload =', payload)

      const { data, error } = await supabase
        .from('settings')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single()

      console.log('[saveHours] respuesta Supabase:', { data, error })

      if (error) throw new Error(error.message)

      await refetch()
      showToast('success', 'Horarios guardados correctamente')
    } catch (err) {
      console.error('[saveHours] error:', err)
      showToast('error', err.message)
    } finally {
      setSavingHours(false)
    }
  }

  function toggleDay(day) {
    setOpenDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  // ── Tables CRUD ──
  async function addTable() {
    if (!newTableNumber || !restaurant) return
    const { error } = await supabase.from('tables').insert({
      restaurant_id: restaurant.id,
      number: parseInt(newTableNumber),
      capacity: newTableCapacity,
      is_active: true,
    })
    if (error) { showToast('error', error.message); return }
    setNewTableNumber('')
    setNewTableCapacity(4)
    loadTables()
  }

  async function toggleTableActive(table) {
    const { error } = await supabase
      .from('tables')
      .update({ is_active: !table.is_active })
      .eq('id', table.id)
    if (error) showToast('error', error.message)
    else loadTables()
  }

  async function deleteTable(id) {
    // Check for associated reservations before attempting delete
    const { count, error: checkError } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('table_id', id)
      .neq('status', 'cancelled')

    if (checkError) { showToast('error', checkError.message); return }

    if (count > 0) {
      showToast('error', 'No puedes eliminar esta mesa porque tiene reservas asociadas')
      return
    }

    if (!window.confirm('¿Eliminar esta mesa?')) return

    const { error } = await supabase.from('tables').delete().eq('id', id)
    if (error) showToast('error', error.message)
    else loadTables()
  }

  // ── Blocked dates ──
  async function addBlockedDate() {
    if (!newBlockedDate || blockedDates.includes(newBlockedDate)) return
    const updated = [...blockedDates, newBlockedDate].sort()
    await saveBlockedDates(updated)
    setNewBlockedDate('')
  }

  async function removeBlockedDate(date) {
    const updated = blockedDates.filter(d => d !== date)
    await saveBlockedDates(updated)
  }

  async function saveBlockedDates(dates) {
    if (!restaurant) return
    setSavingBlocked(true)
    try {
      const payload = { restaurant_id: restaurant.id, blocked_dates: dates }
      if (settings?.id) payload.id = settings.id

      const { data, error } = await supabase
        .from('settings')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single()

      console.log('[saveBlockedDates] respuesta Supabase:', { data, error })
      if (error) throw new Error(error.message)

      setBlockedDates(dates)
      await refetch()
      showToast('success', 'Fechas bloqueadas actualizadas')
    } catch (err) {
      console.error('[saveBlockedDates] error:', err)
      showToast('error', err.message)
    } finally {
      setSavingBlocked(false)
    }
  }

  // ── Render ──
  if (loading) {
    return (
      <div className="p-8 flex items-center gap-3 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        Cargando configuración...
      </div>
    )
  }

  return (
    <>
      <Toast toast={toast} />

      <div className="p-4 sm:p-8 max-w-2xl space-y-8">
        <div>
          <h2 className="text-2xl font-semibold text-white mb-1">Configuración</h2>
          <p className="text-gray-500 text-sm">Ajusta los datos de tu restaurante.</p>
        </div>

        {/* ── Info General ── */}
        <Section title="Información general">
          <Label>Logo del restaurante</Label>
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center overflow-hidden shrink-0">
              {logoPreview || restaurant?.logo_url ? (
                <img
                  src={logoPreview ?? restaurant.logo_url}
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              ) : (
                <ImagePlus className="w-6 h-6 text-gray-600" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 text-sm rounded-lg transition-colors">
                <ImagePlus className="w-4 h-4" />
                {restaurant?.logo_url ? 'Cambiar logo' : 'Subir logo'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoFileChange}
                />
              </label>
              {restaurant?.logo_url && !logoFile && (
                <button
                  onClick={deleteLogo}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  Eliminar
                </button>
              )}
            </div>
          </div>
          {logoFile && (
            <div className="flex gap-2 mb-5">
              <button
                onClick={uploadLogo}
                disabled={uploadingLogo}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
              >
                {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar logo
              </button>
              <button
                onClick={() => { setLogoFile(null); setLogoPreview(null) }}
                className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          )}
          <Label>Nombre del restaurante</Label>
          <input
            value={name}
            onChange={e => handleNameChange(e.target.value)}
            placeholder="Mi Restaurante"
            className="input w-full"
          />
          <Label className="mt-4">Slug (URL pública)</Label>
          <div className="flex items-center bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
            <span className="px-3 text-gray-500 text-sm border-r border-gray-700 py-2">/r/</span>
            <input
              value={slug}
              onChange={e => setSlug(e.target.value)}
              placeholder="mi-restaurante"
              className="flex-1 bg-transparent px-3 py-2 text-sm text-white focus:outline-none"
            />
          </div>
          <SaveButton onClick={saveInfo} loading={savingInfo} className="mt-4" />
        </Section>

        {/* ── Horarios ── */}
        <Section title="Horarios y turnos">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Apertura</Label>
              <input type="time" value={openTime} onChange={e => setOpenTime(e.target.value)} className="input w-full" />
            </div>
            <div>
              <Label>Cierre</Label>
              <input type="time" value={closeTime} onChange={e => setCloseTime(e.target.value)} className="input w-full" />
            </div>
          </div>

          <Label className="mt-4">Intervalo entre turnos</Label>
          <select
            value={slotInterval}
            onChange={e => setSlotInterval(Number(e.target.value))}
            className="input w-full"
          >
            {[15, 30, 45, 60].map(v => (
              <option key={v} value={v}>{v} minutos</option>
            ))}
          </select>

          <Label className="mt-4">Días de apertura</Label>
          <div className="flex gap-2 flex-wrap">
            {DAYS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => toggleDay(value)}
                className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                  openDays.includes(value)
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <SaveButton onClick={saveHours} loading={savingHours} className="mt-4" />
        </Section>

        {/* ── Mesas ── */}
        <Section title="Mesas">
          {loadingTables ? (
            <p className="text-gray-500 text-sm">Cargando mesas...</p>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[360px]">
              <thead>
                <tr className="text-gray-500 text-xs uppercase tracking-wider border-b border-gray-800">
                  <th className="pb-2 text-left">Número</th>
                  <th className="pb-2 text-left">Capacidad</th>
                  <th className="pb-2 text-left">Estado</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {tables.map(t => (
                  <tr key={t.id}>
                    <td className="py-2.5 text-white">Mesa {t.number}</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded-full bg-gray-800 text-gray-300 text-xs">
                        {t.capacity} personas
                      </span>
                    </td>
                    <td className="py-2.5">
                      <button
                        onClick={() => toggleTableActive(t)}
                        className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                          t.is_active
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-gray-800 text-gray-500'
                        }`}
                      >
                        {t.is_active ? 'Activa' : 'Inactiva'}
                      </button>
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => deleteTable(t.id)}
                        className="p-1.5 rounded text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {tables.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-gray-600 text-sm">
                      Sin mesas configuradas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <input
              type="number"
              value={newTableNumber}
              onChange={e => setNewTableNumber(e.target.value)}
              placeholder="Nº mesa"
              className="input w-24"
              min={1}
            />
            <select
              value={newTableCapacity}
              onChange={e => setNewTableCapacity(Number(e.target.value))}
              className="input flex-1"
            >
              {CAPACITIES.map(c => (
                <option key={c} value={c}>{c} personas</option>
              ))}
            </select>
            <button
              onClick={addTable}
              disabled={!newTableNumber}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Agregar
            </button>
          </div>
        </Section>

        {/* ── Días bloqueados ── */}
        <Section title="Días bloqueados">
          <div className="flex gap-2">
            <input
              type="date"
              value={newBlockedDate}
              onChange={e => setNewBlockedDate(e.target.value)}
              className="input flex-1"
            />
            <button
              onClick={addBlockedDate}
              disabled={!newBlockedDate || savingBlocked}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Bloquear
            </button>
          </div>

          {blockedDates.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {blockedDates.map(d => (
                <li key={d} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
                  <span className="text-sm text-gray-300">
                    {format(parseISO(d), "d 'de' MMMM yyyy", { locale: es })}
                  </span>
                  <button
                    onClick={() => removeBlockedDate(d)}
                    className="text-gray-600 hover:text-red-400 transition-colors ml-4"
                    disabled={savingBlocked}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
          {blockedDates.length === 0 && (
            <p className="text-gray-600 text-sm mt-2">Sin días bloqueados.</p>
          )}
        </Section>
      </div>
    </>
  )
}

// ─── sub-components ───────────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">{title}</h3>
      {children}
    </div>
  )
}

function Label({ children, className = '' }) {
  return (
    <label className={`block text-xs text-gray-500 mb-1.5 ${className}`}>{children}</label>
  )
}

function SaveButton({ onClick, loading, className = '' }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm rounded-lg transition-colors ${className}`}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
      Guardar
    </button>
  )
}
