import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRestaurant } from '../../hooks/useRestaurant'
import { Toast, useToast } from '../../components/admin/Toast'
import { Plus, Trash2, Save, Loader2, ImagePlus, X, Store, Clock, LayoutGrid, CalendarX } from 'lucide-react'
import { unitLabel, capacityRange } from '../../lib/businessTypes'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

const DAYS = [
  { value: 1, label: 'Lu', full: 'Lunes' },
  { value: 2, label: 'Ma', full: 'Martes' },
  { value: 3, label: 'Mi', full: 'Miércoles' },
  { value: 4, label: 'Ju', full: 'Jueves' },
  { value: 5, label: 'Vi', full: 'Viernes' },
  { value: 6, label: 'Sá', full: 'Sábado' },
  { value: 0, label: 'Do', full: 'Domingo' },
]

const TABS = [
  { id: 'info',       label: 'Información general', icon: Store },
  { id: 'horarios',   label: 'Horarios',             icon: Clock },
  { id: 'mesas',      label: 'Mesas',                icon: LayoutGrid },
  { id: 'bloqueados', label: 'Días bloqueados',       icon: CalendarX },
]

export default function Configuracion() {
  useEffect(() => { document.title = 'Configuración · ReservApp' }, [])

  const { restaurant, settings, loading, refetch } = useRestaurant()
  const { toast, show: showToast } = useToast()

  const [activeTab, setActiveTab] = useState('info')

  // Info General
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [savingInfo, setSavingInfo] = useState(false)

  // Logo
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  // Horarios
  const [openTime,            setOpenTime]            = useState('12:00')
  const [closeTime,           setCloseTime]           = useState('23:00')
  const [slotInterval,        setSlotInterval]        = useState(30)
  const [openDays,            setOpenDays]            = useState([1, 2, 3, 4, 5])
  const [requiresDeposit,     setRequiresDeposit]     = useState(false)
  const [depositPct,          setDepositPct]          = useState(20)
  const [requiresPrepayment,  setRequiresPrepayment]  = useState(false)
  const [prepaymentMessage,   setPrepaymentMessage]   = useState('')
  const [savingHours,         setSavingHours]         = useState(false)

  // Mesas
  const [tables, setTables] = useState([])
  const [newTableName, setNewTableName] = useState('')
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
      setRequiresDeposit(settings.requires_deposit ?? false)
      setDepositPct(settings.deposit_percentage || 20)
      setRequiresPrepayment(settings.requires_prepayment ?? false)
      setPrepaymentMessage(settings.prepayment_message ?? '')
      setBlockedDates(settings.blocked_dates ?? [])
    }
  }, [settings])

  useEffect(() => {
    if (restaurant) {
      loadTables()
      const r = capacityRange(restaurant.business_type)
      setNewTableCapacity(r.min)
    }
  }, [restaurant])

  // ── Tables ──
  async function loadTables() {
    if (!restaurant) return
    setLoadingTables(true)
    const { data, error } = await supabase
      .from('resources')
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

      const { error: schemaError } = await supabase.from('restaurants').select('id').limit(1)
      if (schemaError) {
        console.warn('[saveInfo] warmup select error:', schemaError.message)
      }

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
    if (openDays.length === 0) {
      showToast('error', 'Selecciona al menos un día de apertura.')
      return
    }
    if (closeTime <= openTime) {
      showToast('error', 'El horario de cierre debe ser posterior al de apertura.')
      return
    }
    setSavingHours(true)
    try {
      const payload = {
        restaurant_id:       restaurant.id,
        open_time:           openTime,
        close_time:          closeTime,
        slot_interval:       slotInterval,
        open_days:           openDays,
        requires_deposit:    requiresDeposit,
        deposit_percentage:  requiresDeposit ? depositPct : 0,
        requires_prepayment: requiresPrepayment,
        prepayment_message:  requiresPrepayment ? prepaymentMessage.trim() : null,
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
    if (!newTableName.trim() || !restaurant) return
    const range    = capacityRange(restaurant?.business_type)
    const capacity = Number(newTableCapacity)
    if (!capacity || capacity < range.min || capacity > range.max) {
      showToast('error', `La capacidad debe estar entre ${range.min} y ${range.max} personas.`)
      return
    }
    const nextNumber = (tables.reduce((max, t) => Math.max(max, t.number ?? 0), 0)) + 1
    const { error } = await supabase.from('resources').insert({
      restaurant_id: restaurant.id,
      number:        nextNumber,
      name:          newTableName.trim(),
      capacity,
      is_active:     true,
    })
    if (error) { showToast('error', error.message); return }
    setNewTableName('')
    setNewTableCapacity(4)
    loadTables()
  }

  async function toggleTableActive(table) {
    const { error } = await supabase
      .from('resources')
      .update({ is_active: !table.is_active })
      .eq('id', table.id)
    if (error) showToast('error', error.message)
    else loadTables()
  }

  async function deleteTable(id) {
    const { count, error: checkError } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('table_id', id)

    if (checkError) { showToast('error', checkError.message); return }

    if (count === null) {
      showToast('error', 'No se pudo verificar las reservas de esta mesa. Inténtalo de nuevo.')
      return
    }

    if (count > 0) {
      showToast('error', 'No puedes eliminar esta mesa porque tiene reservas asociadas.')
      return
    }

    if (!window.confirm('¿Eliminar esta mesa?')) return

    const { error } = await supabase.from('resources').delete().eq('id', id)
    if (error) showToast('error', error.message)
    else loadTables()
  }

  // ── Blocked dates ──
  async function addBlockedDate() {
    if (!newBlockedDate) return
    if (newBlockedDate < format(new Date(), 'yyyy-MM-dd')) {
      showToast('error', 'No puedes bloquear fechas pasadas.')
      return
    }
    if (blockedDates.includes(newBlockedDate)) return
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="text-sm text-gray-400 dark:text-gray-500">Cargando configuración...</span>
        </div>
      </div>
    )
  }

  return (
    <>
      <Toast toast={toast} />

      <div className="p-6 md:p-10">

        {/* ── Page header ── */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Configuración</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Ajusta los datos de tu restaurante.</p>
        </div>

        {/* ── Tab navigation ── */}
        <div className="flex gap-1 p-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl mb-8 shadow-sm">
          {TABS.map(({ id, label: defaultLabel, icon: Icon }) => {
            const label = id === 'mesas' ? unitLabel(restaurant?.business_type, 'plural') : defaultLabel
            return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 ${
                activeTab === id
                  ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{label}</span>
            </button>
            )
          })}
        </div>

        {/* ── Información general ── */}
        {activeTab === 'info' && (
          <Section title="Información general" icon={Store}>
            <div className="space-y-6">

              {/* Logo */}
              <div>
                <Label>Logo del restaurante</Label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="w-20 h-20 rounded-xl bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center overflow-hidden shrink-0">
                    {logoPreview || restaurant?.logo_url ? (
                      <img
                        src={logoPreview ?? restaurant.logo_url}
                        alt="Logo"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <ImagePlus className="w-7 h-7 text-gray-300 dark:text-gray-600" />
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                      {restaurant?.name || 'Tu restaurante'}
                    </p>
                    <div className="flex items-center flex-wrap gap-2">
                      <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 text-xs font-medium rounded-lg transition-colors">
                        <ImagePlus className="w-3.5 h-3.5" />
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
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-lg transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                          Eliminar
                        </button>
                      )}
                    </div>
                    {logoFile && (
                      <div className="flex gap-2">
                        <button
                          onClick={uploadLogo}
                          disabled={uploadingLogo}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
                        >
                          {uploadingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          Guardar logo
                        </button>
                        <button
                          onClick={() => { setLogoFile(null); setLogoPreview(null) }}
                          className="px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white border border-gray-200 dark:border-gray-600 rounded-lg transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <Label>Nombre del restaurante</Label>
                <input
                  value={name}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="Mi Restaurante"
                  className="input w-full"
                />
              </div>

              {/* Slug */}
              <div>
                <Label>URL pública</Label>
                <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                  <span className="px-3 text-gray-400 dark:text-gray-500 text-sm border-r border-gray-200 dark:border-gray-700 py-2 select-none bg-gray-50 dark:bg-gray-900">/r/</span>
                  <input
                    value={slug}
                    onChange={e => setSlug(e.target.value)}
                    placeholder="mi-restaurante"
                    className="flex-1 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none"
                  />
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                  Tus clientes accederán a través de esta URL.
                </p>
              </div>

              <SaveButton onClick={saveInfo} loading={savingInfo} />
            </div>
          </Section>
        )}

        {/* ── Horarios y turnos ── */}
        {activeTab === 'horarios' && (
          <Section title="Horarios y turnos" icon={Clock}>
            <div className="space-y-6">

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Apertura</Label>
                  <input
                    type="time"
                    value={openTime}
                    onChange={e => setOpenTime(e.target.value)}
                    className="input w-full"
                  />
                </div>
                <div>
                  <Label>Cierre</Label>
                  <input
                    type="time"
                    value={closeTime}
                    onChange={e => setCloseTime(e.target.value)}
                    className="input w-full"
                  />
                </div>
              </div>

              <div>
                <Label>Intervalo entre turnos</Label>
                <select
                  value={slotInterval}
                  onChange={e => setSlotInterval(Number(e.target.value))}
                  className="input w-full"
                >
                  {[15, 30, 45, 60].map(v => (
                    <option key={v} value={v}>{v} minutos</option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Días de apertura</Label>
                <div className="flex gap-2 flex-wrap">
                  {DAYS.map(({ value, label, full }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggleDay(value)}
                      title={full}
                      className={`px-3.5 h-10 rounded-lg text-sm font-medium transition-all ${
                        openDays.includes(value)
                          ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/25'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  {openDays.length === 0
                    ? 'Ningún día seleccionado.'
                    : `${openDays.length} día${openDays.length === 1 ? '' : 's'} seleccionado${openDays.length === 1 ? '' : 's'}.`
                  }
                </p>
              </div>

              {/* Depósito anticipado */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between gap-3 px-4 py-3.5 bg-gray-50 dark:bg-gray-900">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Pago anticipado</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">¿Se requiere un depósito para confirmar la reserva?</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRequiresDeposit(v => !v)}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                      requiresDeposit ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      requiresDeposit ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {requiresDeposit && (
                  <div className="px-4 py-4 space-y-3 border-t border-gray-100 dark:border-gray-700">
                    <Label>% del depósito</Label>
                    <div className="flex gap-2 flex-wrap">
                      {[10, 20, 25, 30, 50].map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setDepositPct(p)}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                            depositPct === p
                              ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                          }`}
                        >
                          {p}%
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">El cliente verá este porcentaje antes de confirmar su reserva.</p>
                  </div>
                )}
              </div>

              {/* Política de pago personalizada */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between gap-3 px-4 py-3.5 bg-gray-50 dark:bg-gray-900">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Política de pago</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Muestra un mensaje de pago personalizado en el email de confirmación.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRequiresPrepayment(v => !v)}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                      requiresPrepayment ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      requiresPrepayment ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {requiresPrepayment && (
                  <div className="px-4 py-4 border-t border-gray-100 dark:border-gray-700 space-y-2">
                    <Label>Mensaje para el cliente</Label>
                    <textarea
                      value={prepaymentMessage}
                      onChange={e => setPrepaymentMessage(e.target.value)}
                      placeholder="Ej: Se requiere el 50% de anticipo. Nos pondremos en contacto contigo."
                      rows={3}
                      maxLength={300}
                      className="input w-full resize-none"
                    />
                    <p className="text-right text-xs text-gray-400 dark:text-gray-500">{prepaymentMessage.length}/300</p>
                  </div>
                )}
              </div>

              <SaveButton onClick={saveHours} loading={savingHours} />
            </div>
          </Section>
        )}

        {/* ── Recursos ── */}
        {activeTab === 'mesas' && (
          <Section title={unitLabel(restaurant?.business_type, 'plural')} icon={LayoutGrid}>
            <div className="space-y-6">
              {loadingTables ? (
                <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 text-sm py-6">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cargando {unitLabel(restaurant?.business_type, 'plural').toLowerCase()}...
                </div>
              ) : tables.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                  <table className="w-full text-sm min-w-[360px]">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                        <th className="px-4 py-3 text-left">{unitLabel(restaurant?.business_type, 'singular')}</th>
                        <th className="px-4 py-3 text-left">Capacidad</th>
                        <th className="px-4 py-3 text-left">Estado</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                      {tables.map(t => (
                        <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{t.name || `${unitLabel(restaurant?.business_type, 'singular')} ${t.number}`}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs border border-gray-200 dark:border-gray-600">
                              {t.capacity} personas
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => toggleTableActive(t)}
                              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors border ${
                                t.is_active
                                  ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-100 dark:border-green-500/20 hover:bg-green-100 dark:hover:bg-green-500/20'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                              }`}
                            >
                              {t.is_active ? 'Activa' : 'Inactiva'}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => deleteTable(t.id)}
                              className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                  <LayoutGrid className="w-9 h-9 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Sin {unitLabel(restaurant?.business_type, 'plural').toLowerCase()} configurados</p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Agrega {unitLabel(restaurant?.business_type, 'article')} para gestionar reservas.</p>
                </div>
              )}

              <div>
                {(() => {
                  const range  = capacityRange(restaurant?.business_type)
                  const locked = range.min === range.max
                  return (
                    <>
                      <div className="flex items-center justify-between mb-1.5">
                        <Label className="mb-0">Agregar {unitLabel(restaurant?.business_type, 'singular').toLowerCase()}</Label>
                        {!locked && (
                          <span className="text-xs text-gray-400 dark:text-gray-500">Capacidad: {range.min}–{range.max} personas</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newTableName}
                          onChange={e => setNewTableName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && addTable()}
                          placeholder={`Ej: ${unitLabel(restaurant?.business_type, 'singular')} VIP`}
                          className="input flex-1"
                        />
                        {locked ? (
                          <div className="input flex-1 text-gray-400 dark:text-gray-500 flex items-center">
                            {range.min} {range.min === 1 ? 'persona' : 'personas'}
                          </div>
                        ) : (
                          <input
                            type="number"
                            value={newTableCapacity}
                            min={range.min}
                            max={range.max}
                            onChange={e => {
                              const raw = e.target.value
                              if (raw === '') { setNewTableCapacity(''); return }
                              const num = parseInt(raw, 10)
                              if (!isNaN(num)) setNewTableCapacity(Math.min(range.max, Math.max(range.min, num)))
                            }}
                            onBlur={() => {
                              const n = Number(newTableCapacity)
                              if (!n || n < range.min) setNewTableCapacity(range.min)
                              else if (n > range.max) setNewTableCapacity(range.max)
                            }}
                            placeholder="Cap."
                            className="input flex-1"
                          />
                        )}
                        <button
                          onClick={addTable}
                          disabled={!newTableName.trim()}
                          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                        >
                          <Plus className="w-4 h-4" />
                          Agregar
                        </button>
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>
          </Section>
        )}

        {/* ── Días bloqueados ── */}
        {activeTab === 'bloqueados' && (
          <Section title="Días bloqueados" icon={CalendarX}>
            <div className="space-y-6">

              <div>
                <Label>Bloquear una fecha</Label>
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
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                  >
                    {savingBlocked ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Bloquear
                  </button>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                  Los días bloqueados no estarán disponibles para nuevas reservas.
                </p>
              </div>

              {blockedDates.length > 0 ? (
                <div>
                  <Label>Fechas bloqueadas ({blockedDates.length})</Label>
                  <ul className="space-y-2">
                    {blockedDates.map(d => (
                      <li
                        key={d}
                        className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 flex items-center justify-center shrink-0">
                            <CalendarX className="w-4 h-4 text-red-500 dark:text-red-400" />
                          </div>
                          <span className="text-sm text-gray-700 dark:text-gray-300 capitalize truncate">
                            {format(parseISO(d), "EEEE, d 'de' MMMM yyyy", { locale: es })}
                          </span>
                        </div>
                        <button
                          onClick={() => removeBlockedDate(d)}
                          disabled={savingBlocked}
                          className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-40"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-center py-12 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                  <CalendarX className="w-9 h-9 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Sin días bloqueados</p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Todos los días dentro del horario están disponibles.</p>
                </div>
              )}
            </div>
          </Section>
        )}

      </div>
    </>
  )
}

// ─── sub-components ───────────────────────────────────────────────────────────

function Section({ title, icon: Icon, children }) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}

function Label({ children, className = '' }) {
  return (
    <label className={`block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 ${className}`}>{children}</label>
  )
}

function SaveButton({ onClick, loading, className = '' }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-indigo-500/20 ${className}`}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
      Guardar cambios
    </button>
  )
}
