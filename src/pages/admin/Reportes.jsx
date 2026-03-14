import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useRestaurant } from '../../hooks/useRestaurant'
import { useTheme } from '../../hooks/useTheme'
import { format, startOfMonth, endOfMonth, getDaysInMonth, subMonths, addMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  ChevronLeft, ChevronRight, Download, Loader2,
  CalendarDays, Users, TrendingUp, TrendingDown, BarChart2, Clock,
} from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const DOW_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

const STATUS_LABELS = {
  confirmed: 'Confirmada',
  completed: 'Completada',
  cancelled: 'Cancelada',
}

export default function Reportes() {
  useEffect(() => { document.title = 'Reportes · ReservApp' }, [])

  const { restaurant, loading: restaurantLoading } = useRestaurant()
  const { dark } = useTheme()

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  const [stats, setStats] = useState(null)
  const [dailyChart, setDailyChart] = useState([])
  const [dowChart, setDowChart] = useState([])
  const [timeChart, setTimeChart] = useState([])
  const [reservations, setReservations] = useState([])

  const currentDate = new Date(year, month, 1)
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()
  const monthLabel = format(currentDate, "MMMM yyyy", { locale: es })

  function prevMonth() {
    const d = subMonths(new Date(year, month, 1), 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }

  function nextMonth() {
    if (isCurrentMonth) return
    const d = addMonths(new Date(year, month, 1), 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }

  const loadReport = useCallback(async () => {
    if (!restaurant) return
    setLoading(true)

    const base = new Date(year, month, 1)
    const startDate = format(startOfMonth(base), 'yyyy-MM-dd')
    const endDate   = format(endOfMonth(base),   'yyyy-MM-dd')
    const prevBase  = subMonths(base, 1)
    const prevStart = format(startOfMonth(prevBase), 'yyyy-MM-dd')
    const prevEnd   = format(endOfMonth(prevBase),   'yyyy-MM-dd')

    const [{ data: current }, { data: previous }] = await Promise.all([
      supabase
        .from('reservations').select('*')
        .eq('restaurant_id', restaurant.id)
        .gte('date', startDate).lte('date', endDate)
        .order('date').order('time'),
      supabase
        .from('reservations').select('*')
        .eq('restaurant_id', restaurant.id)
        .gte('date', prevStart).lte('date', prevEnd),
    ])

    processData(current ?? [], previous ?? [], year, month)
    setReservations(current ?? [])
    setLoading(false)
  }, [restaurant, year, month])

  useEffect(() => { loadReport() }, [loadReport])

  function processData(current, previous, y, m) {
    const active    = current.filter(r => r.status !== 'cancelled')
    const total     = active.length
    const completed = current.filter(r => r.status === 'completed').length
    const cancelled = current.filter(r => r.status === 'cancelled').length
    const totalGuests  = active.reduce((sum, r) => sum + (r.people || 0), 0)
    const cancelRate   = current.length > 0 ? Math.round((cancelled / current.length) * 100) : 0
    const prevTotal    = previous.filter(r => r.status !== 'cancelled').length

    setStats({ total, completed, cancelled, totalGuests, cancelRate, prevTotal })

    // Daily
    const daysInMonth = getDaysInMonth(new Date(y, m, 1))
    const daily = Array.from({ length: daysInMonth }, (_, i) => ({ dia: i + 1, reservas: 0 }))
    active.forEach(r => {
      const idx = parseInt(r.date.split('-')[2]) - 1
      if (daily[idx]) daily[idx].reservas++
    })
    setDailyChart(daily)

    // Day of week
    const dow = DOW_LABELS.map(label => ({ label, reservas: 0 }))
    active.forEach(r => {
      const d = new Date(r.date + 'T12:00:00').getDay()
      dow[d].reservas++
    })
    setDowChart(dow)

    // Time slots
    const timeMap = {}
    active.forEach(r => {
      const hour = r.time?.slice(0, 2)
      if (hour) timeMap[hour] = (timeMap[hour] || 0) + 1
    })
    setTimeChart(
      Object.entries(timeMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([hour, reservas]) => ({ hora: `${hour}:00`, reservas }))
    )
  }

  // ── PDF Export ─────────────────────────────────────────────────────────────
  async function exportPDF() {
    if (!stats) return
    setExporting(true)
    try {
      const doc   = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = doc.internal.pageSize.getWidth()
      const pageH = doc.internal.pageSize.getHeight()

      // Header bar
      doc.setFillColor(99, 102, 241)
      doc.rect(0, 0, pageW, 28, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text('ReservApp', 14, 11)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Reporte mensual · ${monthLabel}`, 14, 21)
      doc.text(restaurant.name, pageW - 14, 21, { align: 'right' })

      let y = 36

      // Resumen
      doc.setTextColor(30, 30, 30)
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.text('Resumen del mes', 14, y)
      y += 4

      autoTable(doc, {
        startY: y,
        head: [['Métrica', 'Valor']],
        body: [
          ['Reservas activas',       stats.total],
          ['Reservas completadas',   stats.completed],
          ['Reservas canceladas',    stats.cancelled],
          ['Total de comensales',    stats.totalGuests],
          ['Tasa de cancelación',    `${stats.cancelRate}%`],
          ['Mes anterior (activas)', stats.prevTotal],
        ],
        headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 248, 255] },
        styles: { fontSize: 10 },
        columnStyles: { 1: { halign: 'right' } },
        margin: { left: 14, right: 14 },
      })
      y = doc.lastAutoTable.finalY + 10

      // Por día de semana
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.text('Reservas por día de la semana', 14, y)
      y += 4

      autoTable(doc, {
        startY: y,
        head: [['Día', 'Reservas']],
        body: dowChart.map(d => [d.label, d.reservas]),
        headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 248, 255] },
        styles: { fontSize: 10 },
        columnStyles: { 1: { halign: 'right' } },
        margin: { left: 14, right: 14 },
      })
      y = doc.lastAutoTable.finalY + 10

      // Franjas horarias
      if (timeChart.length > 0) {
        if (y > pageH - 60) { doc.addPage(); y = 14 }
        doc.setFontSize(13)
        doc.setFont('helvetica', 'bold')
        doc.text('Franjas horarias', 14, y)
        y += 4

        autoTable(doc, {
          startY: y,
          head: [['Hora', 'Reservas']],
          body: timeChart.map(t => [t.hora, t.reservas]),
          headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [248, 248, 255] },
          styles: { fontSize: 10 },
          columnStyles: { 1: { halign: 'right' } },
          margin: { left: 14, right: 14 },
        })
        y = doc.lastAutoTable.finalY + 10
      }

      // Detalle de reservas
      if (reservations.length > 0) {
        if (y > pageH - 60) { doc.addPage(); y = 14 }
        doc.setFontSize(13)
        doc.setFont('helvetica', 'bold')
        doc.text('Detalle de reservas', 14, y)
        y += 4

        autoTable(doc, {
          startY: y,
          head: [['Fecha', 'Hora', 'Cliente', 'Personas', 'Estado']],
          body: reservations.map(r => [
            r.date,
            r.time?.slice(0, 5) ?? '—',
            r.client_name,
            r.people,
            STATUS_LABELS[r.status] ?? r.status,
          ]),
          headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [248, 248, 255] },
          styles: { fontSize: 9 },
          margin: { left: 14, right: 14 },
        })
      }

      // Footer en cada página
      const pageCount = doc.internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(160)
        doc.setFont('helvetica', 'normal')
        doc.text(
          `ReservApp · Generado el ${format(new Date(), "d 'de' MMMM yyyy", { locale: es })} · Página ${i} de ${pageCount}`,
          pageW / 2, pageH - 8, { align: 'center' }
        )
      }

      doc.save(`reporte-${format(new Date(year, month, 1), 'yyyy-MM')}.pdf`)
    } catch (err) {
      console.error('[exportPDF]', err)
    } finally {
      setExporting(false)
    }
  }

  // Chart colors based on theme
  const gridColor  = dark ? '#374151' : '#e5e7eb'
  const cursorFill = dark ? '#1f2937' : '#f3f4f6'
  const tickColor  = dark ? '#6b7280' : '#9ca3af'

  // ── Render ─────────────────────────────────────────────────────────────────
  if (restaurantLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="text-sm text-gray-400 dark:text-gray-500">Cargando...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-10">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Reportes</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{restaurant?.name}</p>
        </div>
        <button
          onClick={exportPDF}
          disabled={exporting || loading || !stats || stats.total === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-indigo-500/20 shrink-0"
        >
          {exporting
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Download className="w-4 h-4" />
          }
          <span className="hidden sm:inline">Exportar PDF</span>
        </button>
      </div>

      {/* ── Month selector ── */}
      <div className="flex items-center gap-3 mb-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-3 shadow-sm">
        <button
          onClick={prevMonth}
          className="p-2 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-500 transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 text-center">
          <span className="text-gray-900 dark:text-white font-semibold capitalize text-base">{monthLabel}</span>
        </div>
        <button
          onClick={nextMonth}
          disabled={isCurrentMonth}
          className="p-2 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="flex flex-col items-center gap-3 py-24">
          <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
          <span className="text-sm text-gray-400 dark:text-gray-500">Cargando reporte...</span>
        </div>
      ) : stats && (
        <div className="space-y-6">

          {/* Stats cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              icon={CalendarDays}
              label="Reservas activas"
              value={stats.total}
              prev={stats.prevTotal}
              color="indigo"
            />
            <StatCard
              icon={Users}
              label="Comensales"
              value={stats.totalGuests}
              color="purple"
            />
            <StatCard
              icon={CalendarDays}
              label="Completadas"
              value={stats.completed}
              color="green"
            />
            <StatCard
              icon={Clock}
              label="Cancelación"
              value={`${stats.cancelRate}%`}
              color="gray"
            />
          </div>

          {stats.total === 0 ? (
            <div className="text-center py-16 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
              <BarChart2 className="w-9 h-9 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Sin reservas en este mes</p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Selecciona otro mes o espera nuevas reservas.</p>
            </div>
          ) : (
            <>
              {/* Reservas por día */}
              <ChartCard title="Reservas por día del mes" icon={BarChart2}>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={dailyChart} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis
                      dataKey="dia"
                      tick={{ fill: tickColor, fontSize: 11 }}
                      axisLine={false} tickLine={false}
                      interval={4}
                    />
                    <YAxis
                      tick={{ fill: tickColor, fontSize: 11 }}
                      axisLine={false} tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip labelSuffix=" del mes" dark={dark} />} cursor={{ fill: cursorFill }} />
                    <Bar dataKey="reservas" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Día de semana + franja horaria */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <ChartCard title="Por día de la semana" icon={CalendarDays}>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={dowChart} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: tickColor, fontSize: 11 }}
                        axisLine={false} tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: tickColor, fontSize: 11 }}
                        axisLine={false} tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip content={<CustomTooltip dark={dark} />} cursor={{ fill: cursorFill }} />
                      <Bar dataKey="reservas" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>

                {timeChart.length > 0 && (
                  <ChartCard title="Franja horaria" icon={Clock}>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={timeChart} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                        <XAxis
                          dataKey="hora"
                          tick={{ fill: tickColor, fontSize: 11 }}
                          axisLine={false} tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: tickColor, fontSize: 11 }}
                          axisLine={false} tickLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip content={<CustomTooltip dark={dark} />} cursor={{ fill: cursorFill }} />
                        <Bar dataKey="reservas" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={36} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const STAT_COLORS = {
  indigo: { wrap: 'bg-indigo-50 border-indigo-100 dark:bg-indigo-500/10 dark:border-indigo-500/20', icon: 'text-indigo-600 dark:text-indigo-400' },
  purple: { wrap: 'bg-purple-50 border-purple-100 dark:bg-purple-500/10 dark:border-purple-500/20', icon: 'text-purple-600 dark:text-purple-400' },
  green:  { wrap: 'bg-green-50  border-green-100  dark:bg-green-500/10  dark:border-green-500/20',  icon: 'text-green-600  dark:text-green-400'  },
  gray:   { wrap: 'bg-gray-100  border-gray-200   dark:bg-gray-700      dark:border-gray-600',       icon: 'text-gray-500   dark:text-gray-400'   },
}

function StatCard({ icon: Icon, label, value, prev, color = 'indigo' }) {
  const c   = STAT_COLORS[color]
  const num = typeof value === 'number' ? value : null
  const diff = num !== null && prev !== undefined ? num - prev : null
  const pct  = diff !== null && prev > 0 ? Math.round((diff / prev) * 100) : null

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${c.wrap}`}>
          <Icon className={`w-3.5 h-3.5 ${c.icon}`} />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-tight">{label}</p>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      {pct !== null && (
        <p className={`text-xs mt-1.5 flex items-center gap-1 ${diff >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
          {diff >= 0
            ? <TrendingUp className="w-3 h-3" />
            : <TrendingDown className="w-3 h-3" />
          }
          {Math.abs(pct)}% vs mes anterior
        </p>
      )}
      {diff !== null && prev === 0 && diff > 0 && (
        <p className="text-xs mt-1.5 text-green-600 dark:text-green-400">Primera actividad</p>
      )}
    </div>
  )
}

function ChartCard({ title, icon: Icon, children }) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>
      <div className="px-4 pt-6 pb-4">
        {children}
      </div>
    </div>
  )
}

function CustomTooltip({ active, payload, label, labelSuffix = '', dark }) {
  if (!active || !payload?.length) return null
  return (
    <div className={`border rounded-xl px-3 py-2 text-sm shadow-lg ${
      dark
        ? 'bg-gray-800 border-gray-700'
        : 'bg-white border-gray-200'
    }`}>
      <p className={`text-xs mb-0.5 ${dark ? 'text-gray-400' : 'text-gray-400'}`}>{label}{labelSuffix}</p>
      <p className={`font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>{payload[0].value} reservas</p>
    </div>
  )
}
