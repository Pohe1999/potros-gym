import { useMemo, useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, DollarSign, Calendar, BarChart2, Download, Lock, Unlock, CreditCard, Zap, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react'
import { AreaChart, Area, Tooltip, ResponsiveContainer, XAxis } from 'recharts'
import membersService from '../services/membersService'
import DashboardAnalytics from './DashboardAnalytics'

const PLAN_LABELS = {
  visita: 'Visita', semana: '1 Semana', '15dias': '15 Días',
  mensualPromo: 'Mensual Promo', estudiante: 'Promo Estudiantes',
  mensual: 'Mensual', hotSale: 'Mensual Hot Sale 🔥', parejas: 'Parejas o Más', anual: 'Anual'
}

function CountUp({ target, prefix = '$', duration = 1300 }) {
  const [val, setVal] = useState(0)
  const rafRef = useRef(null)

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setVal(0)
    const startTime = performance.now()
    const tick = (now) => {
      const t = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setVal(Math.round(eased * target))
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [target, duration])

  return <>{prefix}{val.toLocaleString()}</>
}

export default function IncomePanel({ members = [], quickVisits = [] }) {
  const [unlocked,     setUnlocked]     = useState(false)
  const [password,     setPassword]     = useState('')
  const [pwError,      setPwError]      = useState('')
  const [showPwForm,   setShowPwForm]   = useState(false)
  const [showPw,       setShowPw]       = useState(false)
  const [showDashboard, setShowDashboard] = useState(false)
  const [showDetails,  setShowDetails]  = useState(true)

  const today    = membersService.getTodayLocal()
  const monthAgo = membersService.getLocalDateAgo(30)

  const weekBounds = useMemo(() => {
    const [y, m, d] = (today || '').split('-').map(Number)
    const base = new Date(Date.UTC(y, (m || 1) - 1, d || 1))
    const dow  = base.getUTCDay()
    const diffToMonday = dow === 0 ? -6 : 1 - dow
    const monday   = new Date(base); monday.setUTCDate(base.getUTCDate() + diffToMonday)
    const saturday = new Date(monday); saturday.setUTCDate(monday.getUTCDate() + 5)
    const fmt = dt => {
      const yy = dt.getUTCFullYear()
      const mm = String(dt.getUTCMonth() + 1).padStart(2, '0')
      const dd = String(dt.getUTCDate()).padStart(2, '0')
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
        if (p.at?.startsWith(today)) { res.today += amt; res.todayCount++ }
        const day = p.at?.slice(0,10)
        if (day >= weekBounds.monday && day <= weekBounds.saturday) { res.thisWeek += amt; res.weekCount++ }
        if (p.at?.slice(0,10) >= monthAgo) { res.thisMonth += amt; res.monthCount++ }
      })
    })
    quickVisits.forEach(v => {
      const amt = v.amount || 0
      if (amt > 0) {
        res.total += amt; res.count++
        res.byType['visita'] = (res.byType['visita'] || 0) + amt
        if (v.at?.startsWith(today)) { res.today += amt; res.todayCount++ }
        const day = v.at?.slice(0,10)
        if (day >= weekBounds.monday && day <= weekBounds.saturday) { res.thisWeek += amt; res.weekCount++ }
        if (v.at?.slice(0,10) >= monthAgo) { res.thisMonth += amt; res.monthCount++ }
      }
    })
    return res
  }, [members, quickVisits, today, weekBounds, monthAgo])

  const todayItems = useMemo(() => {
    const items = []
    members.forEach(m => {
      const fullName = `${m.firstName || m.name || ''} ${m.paterno || ''} ${m.materno || ''}`.trim()
      ;(m.payments || []).forEach(p => {
        if (p.at?.startsWith(today))
          items.push({ kind: 'payment', at: p.at, name: fullName, label: PLAN_LABELS[p.type] || p.type, amount: p.amount || 0 })
      })
    })
    quickVisits.filter(v => v.at?.startsWith(today)).forEach(v => {
      items.push({ kind: 'quick', at: v.at, name: v.name, label: 'Visita rápida', amount: v.amount || 0 })
    })
    return items.sort((a, b) => (b.at||'').localeCompare(a.at||''))
  }, [members, quickVisits, today])

  const chartData = useMemo(() => {
    const days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
    const map  = {}
    const [y, m, d] = weekBounds.monday.split('-').map(Number)
    const monday = new Date(Date.UTC(y, (m || 1) - 1, d || 1))
    for (let i = 0; i < 6; i++) {
      const cur = new Date(monday); cur.setUTCDate(monday.getUTCDate() + i)
      const iso = `${cur.getUTCFullYear()}-${String(cur.getUTCMonth()+1).padStart(2,'0')}-${String(cur.getUTCDate()).padStart(2,'0')}`
      map[iso] = { day: days[cur.getUTCDay()], total: 0 }
    }
    members.forEach(m => {
      ;(m.payments || []).forEach(p => { const d = p.at?.slice(0,10); if (map[d]) map[d].total += (p.amount || 0) })
    })
    quickVisits.forEach(v => { const d = v.at?.slice(0,10); if (map[d]) map[d].total += (v.amount || 0) })
    return Object.values(map)
  }, [members, quickVisits, weekBounds])

  const handleUnlock = (e) => {
    e.preventDefault()
    if (password === '2112') { setUnlocked(true); setPwError(''); setShowPwForm(false); setPassword('') }
    else { setPwError('Clave incorrecta') }
  }

  const exportCSV = () => {
    const all = []
    members.forEach(m => {
      const fullName = `${m.firstName || m.name || ''} ${m.paterno || ''} ${m.materno || ''}`.trim()
      ;(m.payments || []).forEach(p => all.push({ at: p.at, memberName: fullName, type: p.type, amount: p.amount || 0 }))
    })
    quickVisits.forEach(v => { if (v.amount > 0) all.push({ at: v.at, memberName: v.name || 'Visitante', type: 'visita', amount: v.amount || 0 }) })
    all.sort((a, b) => (b.at||'').localeCompare(a.at||''))
    let csv = 'Fecha,Hora,Nombre,Plan,Monto\n'
    all.forEach(p => {
      const dt = new Date(p.at)
      csv += `${dt.toLocaleDateString('es-MX')},${dt.toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'})},"${p.memberName}","${PLAN_LABELS[p.type]||p.type}",${p.amount}\n`
    })
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `potros-gym-pagos-${today}.csv`
    link.click()
  }

  return (
    <div className="space-y-5">

      {/* ── SIEMPRE VISIBLE: Ingresos Hoy ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <KPICard label="Ingresos Hoy" value={summary.today} count={summary.todayCount} color="emerald" Icon={DollarSign} main />
      </motion.div>

      {/* ── SIEMPRE VISIBLE: Cobros de hoy ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.05 } }}
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

      {/* ── SECCIÓN CON CANDADO ── */}
      <AnimatePresence mode="wait">
        {!unlocked ? (
          /* ── BLOQUEADO ── */
          <motion.div
            key="locked"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
            exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
            className="relative rounded-2xl overflow-hidden"
          >
            {/* Ghost preview detrás */}
            <div className="space-y-4 select-none pointer-events-none" aria-hidden>
              <div className="grid grid-cols-2 gap-4">
                <GhostKPI label="Esta Semana" />
                <GhostKPI label="Este Mes" />
              </div>
              <GhostChart />
            </div>

            {/* Overlay con el candado */}
            <div
              className="absolute inset-0 flex items-center justify-center rounded-2xl"
              style={{ background: 'rgba(6,10,20,0.82)', backdropFilter: 'blur(10px)' }}
            >
              <div className="flex flex-col items-center gap-4 px-6 py-8 w-full max-w-xs">
                {/* Icono con glow pulsante */}
                <div className="relative">
                  <motion.div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center border"
                    style={{ background: 'rgba(214,40,40,0.08)', borderColor: 'rgba(214,40,40,0.2)' }}
                    animate={{
                      boxShadow: [
                        '0 0 16px rgba(214,40,40,0.08)',
                        '0 0 32px rgba(214,40,40,0.22)',
                        '0 0 16px rgba(214,40,40,0.08)',
                      ]
                    }}
                    transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut' }}
                  >
                    <Lock size={26} className="text-potros-red/70" />
                  </motion.div>
                  {/* Ring exterior animado */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl border border-potros-red/20"
                    animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut' }}
                  />
                </div>

                <div className="text-center">
                  <div className="text-sm font-bold text-white/80 tracking-wide">Análisis Protegido</div>
                  <div className="text-xs text-white/35 mt-1.5 leading-relaxed">
                    Semana · Mes · Gráfica · Histórico
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {!showPwForm ? (
                    <motion.button
                      key="btn"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      onClick={() => setShowPwForm(true)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-semibold transition-all"
                      style={{
                        background: 'rgba(214,40,40,0.1)',
                        borderColor: 'rgba(214,40,40,0.25)',
                        color: 'rgba(214,80,80,0.9)'
                      }}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Unlock size={14} /> Desbloquear análisis
                    </motion.button>
                  ) : (
                    <motion.form
                      key="form"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      onSubmit={handleUnlock}
                      className="w-full space-y-2.5"
                    >
                      <div className="relative">
                        <input
                          type={showPw ? 'text' : 'password'}
                          placeholder="Clave de acceso"
                          className="w-full px-3.5 py-2.5 pr-10 rounded-xl text-sm text-white placeholder-white/25 transition-all focus:outline-none"
                          style={{
                            background: 'rgba(255,255,255,0.06)',
                            border: pwError ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.1)',
                          }}
                          onFocus={e => { e.target.style.border = '1px solid rgba(214,40,40,0.55)' }}
                          onBlur={e => { e.target.style.border = pwError ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.1)' }}
                          value={password}
                          onChange={e => { setPassword(e.target.value); setPwError('') }}
                          autoFocus
                        />
                        <button type="button" onClick={() => setShowPw(!showPw)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                          {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      </div>

                      <AnimatePresence>
                        {pwError && (
                          <motion.p
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-red-400 text-xs pl-1"
                          >
                            {pwError}
                          </motion.p>
                        )}
                      </AnimatePresence>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => { setShowPwForm(false); setPassword(''); setPwError('') }}
                          className="flex-1 py-2 rounded-xl text-white/40 text-sm transition-all"
                          style={{ background: 'rgba(255,255,255,0.04)' }}
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-2 rounded-xl bg-potros-red hover:bg-potros-red-light text-white font-semibold text-sm transition-all"
                        >
                          Entrar
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        ) : (
          /* ── DESBLOQUEADO ── */
          <motion.div
            key="unlocked"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-5"
          >
            {/* KPIs semana y mes — count-up */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="grid grid-cols-2 gap-4"
            >
              <KPICardAnimated label="Esta Semana" value={summary.thisWeek} count={summary.weekCount} color="sky"    Icon={Calendar}    delay={0} />
              <KPICardAnimated label="Este Mes"    value={summary.thisMonth} count={summary.monthCount} color="purple" Icon={TrendingUp}   delay={0.08} />
            </motion.div>

            {/* Gráfica — dibuja animada */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.45, ease: 'easeOut' }}
              className="glass rounded-2xl p-5"
              style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 size={15} className="text-sky-400" />
                <span className="text-sm font-bold text-white">Ingresos — semana actual (Lun-Sab)</span>
                <span className="text-[11px] text-white/60 font-mono">{weekBounds.monday} a {weekBounds.saturday}</span>
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
                  <Area
                    type="monotone" dataKey="total" stroke="#d62828" strokeWidth={2}
                    fill="url(#incomeGrad)" dot={false}
                    isAnimationActive animationDuration={1400} animationEasing="ease-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Análisis histórico + acciones */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.45, ease: 'easeOut' }}
              className="glass rounded-2xl p-5 space-y-4"
              style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Unlock size={13} className="text-emerald-400" />
                  <span className="text-xs text-emerald-400 font-semibold">Desbloqueado</span>
                </div>
                <button
                  onClick={() => { setUnlocked(false); setPassword('') }}
                  className="text-xs text-white/40 hover:text-white/60 transition-colors"
                >
                  Bloquear
                </button>
              </div>

              {/* Total acumulado */}
              <div className="bg-gradient-to-br from-purple-500/15 to-purple-900/20 border border-purple-500/20 rounded-xl p-4">
                <div className="text-xs text-purple-300 font-semibold uppercase mb-1">Total Acumulado</div>
                <div className="text-3xl font-extrabold text-white">
                  <CountUp target={summary.total} duration={1500} />
                </div>
                <div className="text-xs text-purple-300/60 mt-0.5">{summary.count} transacciones</div>
              </div>

              {/* Desglose por tipo */}
              {Object.entries(summary.byType).sort((a,b) => b[1] - a[1]).map(([k, v], i) => {
                const pct = ((v / summary.total) * 100).toFixed(1)
                return (
                  <motion.div
                    key={k}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + i * 0.06, duration: 0.35 }}
                    className="space-y-1.5"
                  >
                    <div className="flex justify-between text-xs">
                      <span className="text-white/60">{PLAN_LABELS[k] || k}</span>
                      <span className="font-bold text-white">
                        ${v.toLocaleString()} <span className="text-white/45">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.9, ease: 'easeOut', delay: 0.38 + i * 0.06 }}
                        className="h-full bg-potros-red rounded-full"
                      />
                    </div>
                  </motion.div>
                )
              })}

              {/* Acciones */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button onClick={exportCSV}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/25 transition-all">
                  <Download size={12} /> Exportar CSV
                </button>
                <button onClick={() => setShowDashboard(true)}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-purple-500/15 border border-purple-500/20 text-purple-400 text-xs font-semibold hover:bg-purple-500/25 transition-all">
                  <BarChart2 size={12} /> Análisis
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showDashboard && (
        <DashboardAnalytics members={members} quickVisits={quickVisits} onClose={() => setShowDashboard(false)} />
      )}
    </div>
  )
}

/* ── Componentes auxiliares ── */

function GhostKPI({ label }) {
  return (
    <div
      className="rounded-2xl p-4 border"
      style={{ background: 'rgba(255,255,255,0.015)', borderColor: 'rgba(255,255,255,0.05)' }}
    >
      <div className="text-[10px] font-semibold uppercase tracking-wider text-white/20 mb-2">{label}</div>
      <div className="text-2xl font-extrabold text-white/10 tracking-wider">$████</div>
      <div className="text-xs text-white/10 mt-1">— pagos</div>
    </div>
  )
}

function GhostChart() {
  return (
    <div
      className="rounded-2xl p-5 border"
      style={{ background: 'rgba(255,255,255,0.015)', borderColor: 'rgba(255,255,255,0.05)' }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="h-2.5 w-28 rounded bg-white/[0.07]" />
      </div>
      <div className="flex items-end gap-2" style={{ height: 64, padding: '0 4px' }}>
        {[38, 62, 28, 75, 52, 44].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t"
            style={{ height: `${h}%`, background: 'rgba(255,255,255,0.05)' }}
          />
        ))}
      </div>
      <div className="flex gap-2 mt-2 px-1">
        {['L','M','M','J','V','S'].map((d, i) => (
          <div key={i} className="flex-1 text-center text-[9px] text-white/15">{d}</div>
        ))}
      </div>
    </div>
  )
}

function KPICardAnimated({ label, value, count, color, Icon, delay = 0 }) {
  const colors = {
    sky:    { bg: 'from-sky-500/20 to-sky-900/20',       border: 'border-sky-500/20',     text: 'text-sky-400',     sub: 'text-sky-300/50' },
    purple: { bg: 'from-purple-500/20 to-purple-900/20', border: 'border-purple-500/20',  text: 'text-purple-400',  sub: 'text-purple-300/50' },
  }
  const c = colors[color] || colors.sky
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ scale: 1.02 }}
      className={`bg-gradient-to-br ${c.bg} border ${c.border} rounded-2xl p-4 md:p-5 glass`}
      style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-white/60 font-semibold uppercase tracking-wider mb-2">{label}</div>
          <div className="text-2xl md:text-3xl font-extrabold text-white">
            <CountUp target={value} duration={1200 + delay * 200} />
          </div>
          <div className={`text-xs ${c.sub} mt-1`}>{count} pago{count !== 1 ? 's' : ''}</div>
        </div>
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${c.bg} border ${c.border} flex items-center justify-center`}>
          <Icon size={16} className={c.text} />
        </div>
      </div>
    </motion.div>
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
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${c.bg} border ${c.border} flex items-center justify-center`}>
          <Icon size={16} className={c.text} />
        </div>
      </div>
    </motion.div>
  )
}
