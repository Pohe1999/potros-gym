import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, DollarSign, Calendar, BarChart2, Download, Lock, Unlock, CreditCard, Zap, ChevronDown, ChevronUp } from 'lucide-react'
import { AreaChart, Area, Tooltip, ResponsiveContainer, XAxis } from 'recharts'
import membersService from '../services/membersService'
import DashboardAnalytics from './DashboardAnalytics'

const PLAN_LABELS = {
  visita: 'Visita', semana: '1 Semana', '15dias': '15 Días',
  mensualPromo: 'Mensual Promo', estudiante: 'Promo Estudiantes',
  mensual: 'Mensual', parejas: 'Parejas o Más', anual: 'Anual'
}

export default function IncomePanel({ members = [], quickVisits = [] }) {
  const [unlocked, setUnlocked]       = useState(false)
  const [password, setPassword]       = useState('')
  const [pwError,  setPwError]        = useState('')
  const [showPwForm, setShowPwForm]   = useState(false)
  const [showDashboard, setShowDashboard] = useState(false)
  const [showDetails, setShowDetails] = useState(true)

  const today = membersService.getTodayLocal()
  const monthAgo = membersService.getLocalDateAgo(30)

  const weekBounds = useMemo(() => {
    const [y, m, d] = (today || '').split('-').map(Number)
    const base = new Date(Date.UTC(y, (m || 1) - 1, d || 1))
    const dow = base.getUTCDay() // 0=Dom, 1=Lun ... 6=Sab
    const diffToMonday = dow === 0 ? -6 : 1 - dow

    const monday = new Date(base)
    monday.setUTCDate(base.getUTCDate() + diffToMonday)

    const saturday = new Date(monday)
    saturday.setUTCDate(monday.getUTCDate() + 5)

    const fmt = (date) => {
      const yy = date.getUTCFullYear()
      const mm = String(date.getUTCMonth() + 1).padStart(2, '0')
      const dd = String(date.getUTCDate()).padStart(2, '0')
      return `${yy}-${mm}-${dd}`
    }

    return { monday: fmt(monday), saturday: fmt(saturday) }
  }, [today])

  const summary = useMemo(() => {
    const res = { total:0, today:0, thisWeek:0, thisMonth:0, count:0, todayCount:0, weekCount:0, monthCount:0, byType:{} }
    members.forEach(m => {
      ;(m.payments || []).forEach(p => {
        const amt = p.amount || 0
        res.total += amt; res.count++
        res.byType[p.type] = (res.byType[p.type] || 0) + amt
        if (p.at?.startsWith(today))         { res.today += amt; res.todayCount++ }
        const day = p.at?.slice(0,10)
        if (day >= weekBounds.monday && day <= weekBounds.saturday) { res.thisWeek += amt; res.weekCount++ }
        if (p.at?.slice(0,10) >= monthAgo)   { res.thisMonth += amt; res.monthCount++ }
      })
    })
    quickVisits.forEach(v => {
      const amt = v.amount || 0
      if (amt > 0) {
        res.total += amt; res.count++
        res.byType['visita'] = (res.byType['visita'] || 0) + amt
        if (v.at?.startsWith(today))         { res.today += amt; res.todayCount++ }
        const day = v.at?.slice(0,10)
        if (day >= weekBounds.monday && day <= weekBounds.saturday) { res.thisWeek += amt; res.weekCount++ }
        if (v.at?.slice(0,10) >= monthAgo)   { res.thisMonth += amt; res.monthCount++ }
      }
    })
    return res
  }, [members, quickVisits, today, weekBounds, monthAgo])

  const todayItems = useMemo(() => {
    const items = []
    members.forEach(m => {
      const fullName = `${m.firstName || m.name || ''} ${m.paterno || ''} ${m.materno || ''}`.trim()
      ;(m.payments || []).forEach(p => {
        if (p.at?.startsWith(today)) items.push({ kind: 'payment', at: p.at, name: fullName, label: PLAN_LABELS[p.type] || p.type, amount: p.amount || 0 })
      })
    })
    quickVisits.filter(v => v.at?.startsWith(today)).forEach(v => {
      items.push({ kind: 'quick', at: v.at, name: v.name, label: 'Visita rápida', amount: v.amount || 0 })
    })
    return items.sort((a, b) => (b.at||'').localeCompare(a.at||''))
  }, [members, quickVisits, today])

  // Datos para mini gráfica (semana actual: lunes a sábado)
  const chartData = useMemo(() => {
    const days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
    const map = {}

    const [y, m, d] = weekBounds.monday.split('-').map(Number)
    const monday = new Date(Date.UTC(y, (m || 1) - 1, d || 1))

    for (let i = 0; i < 6; i++) {
      const current = new Date(monday)
      current.setUTCDate(monday.getUTCDate() + i)
      const yy = current.getUTCFullYear()
      const mm = String(current.getUTCMonth() + 1).padStart(2, '0')
      const dd = String(current.getUTCDate()).padStart(2, '0')
      const iso = `${yy}-${mm}-${dd}`
      map[iso] = { day: days[current.getUTCDay()], total: 0 }
    }

    members.forEach(m => {
      ;(m.payments || []).forEach(p => {
        const d = p.at?.slice(0,10)
        if (map[d]) map[d].total += (p.amount || 0)
      })
    })

    quickVisits.forEach(v => {
      const d = v.at?.slice(0,10)
      if (map[d]) map[d].total += (v.amount || 0)
    })

    return Object.values(map)
  }, [members, quickVisits, weekBounds])

  const handleUnlock = (e) => {
    e.preventDefault()
    if (password === '2112') { setUnlocked(true); setPwError(''); setShowPwForm(false); setPassword('') }
    else { setPwError('Contraseña incorrecta') }
  }

  const exportCSV = () => {
    const allPayments = []
    members.forEach(m => {
      const fullName = `${m.firstName || m.name || ''} ${m.paterno || ''} ${m.materno || ''}`.trim()
      ;(m.payments || []).forEach(p => allPayments.push({ at: p.at, memberName: fullName, type: p.type, amount: p.amount || 0 }))
    })
    quickVisits.forEach(v => { if (v.amount > 0) allPayments.push({ at: v.at, memberName: v.name || 'Visitante', type: 'visita', amount: v.amount || 0 }) })
    allPayments.sort((a, b) => (b.at||'').localeCompare(a.at||''))

    let csv = 'Fecha,Hora,Nombre,Plan,Monto\n'
    allPayments.forEach(p => {
      const date = new Date(p.at)
      csv += `${date.toLocaleDateString('es-MX')},${date.toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'})},"${p.memberName}","${PLAN_LABELS[p.type]||p.type}",${p.amount}\n`
    })

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `potros-gym-pagos-${today}.csv`
    link.click()
  }

  return (
    <div className="space-y-5">
      {/* KPIs principales */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard label="Ingresos Hoy"   value={summary.today}     count={summary.todayCount}  color="emerald" Icon={DollarSign} main />
        <KPICard label="Esta Semana"    value={summary.thisWeek}   count={summary.weekCount}   color="sky"     Icon={Calendar} />
        <KPICard label="Este Mes"       value={summary.thisMonth}  count={summary.monthCount}  color="purple"  Icon={TrendingUp} />
      </motion.div>

      {/* Mini gráfica últimos 7 días */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
        className="glass rounded-2xl p-5"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 size={15} className="text-sky-400" />
          <span className="text-sm font-bold text-white">Ingresos — semana actual (Lun-Sab)</span>
          <span className="text-[11px] text-white/60 font-mono">
            {weekBounds.monday} a {weekBounds.saturday}
          </span>
        </div>
        <ResponsiveContainer width="100%" height={100}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#d62828" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#d62828" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#0f1623', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', fontSize: 12 }}
              labelStyle={{ color: 'rgba(255,255,255,0.5)' }}
              formatter={v => [`$${v.toLocaleString()}`, 'Ingresos']}
            />
            <Area type="monotone" dataKey="total" stroke="#d62828" strokeWidth={2} fill="url(#incomeGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Movimientos de hoy */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.15 } }}
        className="glass rounded-2xl overflow-hidden"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)' }}
      >
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <CreditCard size={14} className="text-sky-400" />
            <span className="text-sm font-bold text-white">Cobros de hoy</span>
            <span className="text-xs bg-white/10 border border-white/10 px-2 py-0.5 rounded-full text-white/50">{todayItems.length}</span>
          </div>
          {showDetails ? <ChevronUp size={14} className="text-white/55" /> : <ChevronDown size={14} className="text-white/55" />}
        </button>
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="border-t border-white/[0.05] divide-y divide-white/[0.03] max-h-72 overflow-y-auto">
                {todayItems.length === 0 && (
                  <div className="px-5 py-8 text-center text-white/45 text-sm">Sin cobros registrados hoy</div>
                )}
                {todayItems.map((item, idx) => {
                  const time = item.at ? new Date(item.at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : ''
                  return (
                    <div key={idx} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                          item.kind === 'quick' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {item.kind === 'quick' ? <Zap size={12} /> : <CreditCard size={12} />}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white/90">{item.name}</div>
                          <div className="text-xs text-white/60">{item.label}</div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-bold text-emerald-400">${item.amount.toLocaleString()}</div>
                        <div className="text-xs text-white/55">{time}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Panel protegido */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
        className="glass rounded-2xl overflow-hidden"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)' }}
      >
        {!unlocked ? (
          <div className="p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <Lock size={14} className="text-white/40" />
              <span className="text-sm font-bold text-white">Análisis completo</span>
            </div>
            <AnimatePresence>
              {!showPwForm ? (
                <motion.button
                  key="showBtn"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => setShowPwForm(true)}
                  className="w-full py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.07] text-white/50 hover:text-white/80 text-sm transition-all hover:bg-white/[0.07]"
                >
                  🔒 Desbloquear análisis completo
                </motion.button>
              ) : (
                <motion.form
                  key="pwForm"
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  onSubmit={handleUnlock}
                  className="space-y-2.5"
                >
                  <input
                    type="password"
                    placeholder="Clave de acceso"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.09] focus:border-potros-red/60 focus:outline-none text-white placeholder-white/25 text-sm transition-all"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoFocus
                  />
                  {pwError && <p className="text-red-400 text-xs">{pwError}</p>}
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setShowPwForm(false); setPassword(''); setPwError('') }}
                      className="flex-1 py-2 rounded-xl bg-white/[0.04] text-white/40 text-sm hover:bg-white/[0.07] transition-all">Cancelar</button>
                    <button type="submit"
                      className="flex-1 py-2 rounded-xl bg-potros-red text-white font-semibold text-sm hover:bg-potros-red-light transition-all">Desbloquear</button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Unlock size={13} className="text-emerald-400" />
                <span className="text-xs text-emerald-400 font-semibold">Desbloqueado</span>
              </div>
              <button onClick={() => { setUnlocked(false); setPassword('') }}
                className="text-xs text-white/55 hover:text-white/60 transition-colors">Bloquear</button>
            </div>

            {/* Total acumulado */}
            <div className="bg-gradient-to-br from-purple-500/15 to-purple-900/20 border border-purple-500/20 rounded-xl p-4">
              <div className="text-xs text-purple-300 font-semibold uppercase mb-1">Total Acumulado</div>
              <div className="text-3xl font-extrabold text-white">${summary.total.toLocaleString()}</div>
              <div className="text-xs text-purple-300/60 mt-0.5">{summary.count} transacciones</div>
            </div>

            {/* Desglose por tipo */}
            {Object.entries(summary.byType).sort((a,b)=>b[1]-a[1]).map(([k, v]) => {
              const pct = ((v / summary.total) * 100).toFixed(1)
              return (
                <div key={k} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/60">{PLAN_LABELS[k] || k}</span>
                    <span className="font-bold text-white">${v.toLocaleString()} <span className="text-white/55">({pct}%)</span></span>
                  </div>
                  <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full bg-potros-red rounded-full"
                    />
                  </div>
                </div>
              )
            })}

            {/* Acciones */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button onClick={exportCSV}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/25 transition-all">
                <Download size={12} /> Exportar CSV
              </button>
              <button onClick={() => setShowDashboard(true)}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-purple-500/15 border border-purple-500/20 text-purple-400 text-xs font-semibold hover:bg-purple-500/25 transition-all">
                <BarChart2 size={12} /> Análisis
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {showDashboard && (
        <DashboardAnalytics members={members} quickVisits={quickVisits} onClose={() => setShowDashboard(false)} />
      )}
    </div>
  )
}

function KPICard({ label, value, count, color, Icon, main }) {
  const colors = {
    emerald: { bg: 'from-emerald-500/20 to-emerald-900/20', border: 'border-emerald-500/20', text: 'text-emerald-400', sub: 'text-emerald-300/50' },
    sky:     { bg: 'from-sky-500/20 to-sky-900/20',         border: 'border-sky-500/20',     text: 'text-sky-400',     sub: 'text-sky-300/50' },
    purple:  { bg: 'from-purple-500/20 to-purple-900/20',   border: 'border-purple-500/20',  text: 'text-purple-400',  sub: 'text-purple-300/50' },
  }
  const c = colors[color] || colors.emerald
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`bg-gradient-to-br ${c.bg} border ${c.border} rounded-2xl p-4 md:p-5 glass`}
      style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-white/60 font-semibold uppercase tracking-wider mb-2">{label}</div>
          <div className={`${main ? 'text-3xl md:text-4xl' : 'text-2xl md:text-3xl'} font-extrabold text-white`}>
            ${value.toLocaleString()}
          </div>
          <div className={`text-xs ${c.sub} mt-1`}>{count} pago{count !== 1 ? 's' : ''}</div>
        </div>
        <div className={`w-9 h-9 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center`}>
          <Icon size={16} className={c.text} />
        </div>
      </div>
    </motion.div>
  )
}
