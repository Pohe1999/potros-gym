import React, { useEffect, useRef, useState } from 'react'

export default function SidebarCounters({ members = [], stats = {} }) {
  const total = stats.total ?? members.length
  const active = stats.activeCount ?? 0
  const inactive = stats.inactive ?? (total - active)
  // Use explicit member visits count only. Do not fallback to a general totalVisitsToday
  // to avoid showing a general counter above the specific "Visitas pagadas" card.
  const memberVisitsToday = stats.memberVisitsToday ?? 0
  const quickVisitsToday = stats.quickVisitsToday ?? 0

  const [pulse, setPulse] = useState({ total: false, active: false, inactive: false, visits: false, quick: false })
  const prev = useRef({ total, active, inactive, memberVisitsToday, quickVisitsToday })

  useEffect(() => {
    if (prev.current.total !== total) { setPulse(p => ({ ...p, total: true })); setTimeout(()=>setPulse(p=>({ ...p, total: false })), 700)}
    if (prev.current.active !== active) { setPulse(p => ({ ...p, active: true })); setTimeout(()=>setPulse(p=>({ ...p, active: false })), 700)}
    if (prev.current.inactive !== inactive) { setPulse(p => ({ ...p, inactive: true })); setTimeout(()=>setPulse(p=>({ ...p, inactive: false })), 700)}
    if (prev.current.memberVisitsToday !== memberVisitsToday) { setPulse(p => ({ ...p, visits: true })); setTimeout(()=>setPulse(p=>({ ...p, visits: false })), 700)}
    if (prev.current.quickVisitsToday !== quickVisitsToday) { setPulse(p => ({ ...p, quick: true })); setTimeout(()=>setPulse(p=>({ ...p, quick: false })), 700)}
    prev.current = { total, active, inactive, memberVisitsToday, quickVisitsToday }
  }, [total, active, inactive, memberVisitsToday, quickVisitsToday])

  return (
    // Desktop: compact, consistent cards for all counters
    <aside className="hidden md:flex items-center p-2 rounded-lg border-l-2 border-gray-800 ml-4 flex-none">
      <div className="relative flex gap-2 items-stretch">
        {/* soft gradient haze */}
        <div className="pointer-events-none absolute -left-6 -top-6 w-28 h-28 bg-gradient-to-tr from-pink-600/20 via-purple-600/10 to-blue-500/10 rounded-full blur-3xl opacity-40" />
        <div className="pointer-events-none absolute right-0 -bottom-6 w-24 h-24 bg-gradient-to-br from-amber-400/15 via-orange-400/10 to-red-500/10 rounded-full blur-2xl opacity-30" />

        <CardTiny title="Socios" value={total} pulse={pulse.total} accent="from-rose-500/20 to-pink-500/10" icon={IconUsers} textClass="text-potros-red" />
        <CardTiny title="Activos" value={active} pulse={pulse.active} accent="from-emerald-500/20 to-green-500/10" textClass="text-green-300" />
        <CardTiny title="Inactivos" value={inactive} pulse={pulse.inactive} accent="from-amber-400/20 to-yellow-500/10" textClass="text-amber-200" />
        <CardTiny title="Entradas hoy" subtitle="Socios" value={memberVisitsToday} pulse={pulse.visits} accent="from-sky-500/20 to-blue-600/15" textClass="text-sky-100" />
      </div>
    </aside>
  )
}

function CardTiny({ title, subtitle, value, pulse, accent = 'from-gray-700/30 to-gray-900/40', textClass = 'text-white', icon: Icon }) {
  return (
    <div className={`relative min-w-[130px] bg-gray-900/70 backdrop-blur-sm border border-white/5 rounded-xl p-3 shadow-lg ring-1 ring-white/5 hover:-translate-y-1 transition-all duration-200`}> 
      <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${accent} opacity-70 pointer-events-none`} />
      <div className="relative flex items-start gap-2">
        <div className="w-8 h-8 bg-white/8 rounded-lg flex items-center justify-center text-white/80">
          {Icon ? <Icon className="w-4 h-4" /> : <DefaultSpark className="w-4 h-4" />}
        </div>
        <div className="flex-1">
          <div className="text-[11px] text-white/80 font-semibold uppercase leading-tight">{title}</div>
          {subtitle && <div className="text-[10px] text-white/60 leading-tight">{subtitle}</div>}
          <div className={`mt-1 text-xl font-extrabold ${textClass} ${pulse ? 'animate-pulse' : ''}`}>{value.toLocaleString()}</div>
        </div>
      </div>
    </div>
  )
}

function IconUsers({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 11c1.657 0 3-1.567 3-3.5S17.657 4 16 4s-3 1.567-3 3.5S14.343 11 16 11z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 11c1.657 0 3-1.567 3-3.5S9.657 4 8 4 5 5.567 5 7.5 6.343 11 8 11z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 20c0-2.21 3.582-4 8-4s8 1.79 8 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DefaultSpark({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2l1.8 4.6L18.8 8l-4 2.9L15 18l-3-2-3 2 0.2-7.1L4 8l5-1.4L12 2z" stroke="currentColor" strokeWidth="0.6" strokeLinejoin="round" />
    </svg>
  )
}
