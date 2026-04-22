import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  LogIn, Users, Zap, UserPlus, TrendingUp, Activity,
  CheckCircle2, XCircle, UserX
} from 'lucide-react'

const NAV_ITEMS = [
  { id: 'checkin',    Icon: LogIn,      label: 'Registro de Entrada' },
  { id: 'members',   Icon: Users,      label: 'Lista de Socios' },
  { id: 'quickvisit',Icon: Zap,        label: 'Visita Rápida' },
  { id: 'register',  Icon: UserPlus,   label: 'Nuevo Socio' },
  { id: 'income',    Icon: TrendingUp, label: 'Ingresos' },
]

export default function Sidebar({ activeTab, setActiveTab, stats = {} }) {
  const todayLabel = useMemo(() => {
    return new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
      .replace(/^./, c => c.toUpperCase())
  }, [])

  return (
    <aside className="hidden md:flex flex-col w-60 lg:w-64 flex-shrink-0 h-full overflow-hidden border-r border-white/[0.07]"
      style={{ background: 'linear-gradient(180deg, #0c0f17 0%, #080b11 100%)' }}>

      {/* Decoración: bloom rojo arriba */}
      <div className="absolute top-0 left-0 w-full h-48 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 120% 80% at 50% -20%, rgba(214,40,40,0.18) 0%, transparent 70%)', zIndex: 0 }} />

      {/* Logo */}
      <div className="relative z-10 flex items-center gap-3 px-4 py-5 border-b border-white/[0.07]">
        <div className="relative flex-shrink-0">
          <div className="absolute inset-0 rounded-xl blur-lg" style={{ background: 'rgba(214,40,40,0.45)', transform: 'scale(1.2)' }} />
          <div className="relative w-11 h-11 rounded-xl bg-potros-red/20 border border-potros-red/40 flex items-center justify-center overflow-hidden">
            <img src="/logo.png" alt="POTROS GYM" className="h-9 w-9 object-contain" />
          </div>
        </div>
        <div>
          <div className="font-black text-base text-white tracking-tight leading-none">POTROS GYM</div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[10px] font-mono text-potros-red/80 bg-potros-red/10 border border-potros-red/20 px-1.5 py-0.5 rounded">v3.0.0</span>
            <span className="flex items-center gap-1 text-[10px] text-emerald-400/70">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          </div>
        </div>
      </div>

      {/* Stats panel — dashboard principal */}
      <div className="relative z-10 px-3 py-3 border-b border-white/[0.06]">
        <div className="text-[10px] font-bold text-white/45 uppercase tracking-widest px-1 mb-2">{todayLabel}</div>

        {/* Grid 2x2 con números grandes y colores fuertes */}
        <div className="grid grid-cols-2 gap-1.5">
          <StatTile
            label="Activos"
            value={stats.activeCount ?? 0}
            color="#22c55e"
            bg="rgba(34,197,94,0.08)"
            border="rgba(34,197,94,0.2)"
            Icon={CheckCircle2}
            pulse={stats.activeCount > 0}
          />
          <StatTile
            label="Total socios"
            value={stats.total ?? 0}
            color="#ffffff"
            bg="rgba(255,255,255,0.05)"
            border="rgba(255,255,255,0.1)"
            Icon={Users}
          />
          <StatTile
            label="Entradas hoy"
            value={stats.totalVisitsToday ?? 0}
            color="#38bdf8"
            bg="rgba(56,189,248,0.08)"
            border="rgba(56,189,248,0.2)"
            Icon={Activity}
            pulse={(stats.totalVisitsToday ?? 0) > 0}
          />
          <StatTile
            label="Vencidos"
            value={stats.inactive ?? 0}
            color={stats.inactive > 0 ? '#f87171' : '#6b7280'}
            bg={stats.inactive > 0 ? 'rgba(248,113,113,0.07)' : 'rgba(255,255,255,0.03)'}
            border={stats.inactive > 0 ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.07)'}
            Icon={UserX}
          />
        </div>
      </div>

      {/* Navegación */}
      <nav className="relative z-10 flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ id, Icon, label }) => {
          const isActive = activeTab === id
          return (
            <motion.button
              key={id}
              onClick={() => setActiveTab(id)}
              whileTap={{ scale: 0.97 }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group relative overflow-hidden ${
                isActive ? 'text-white' : 'text-white/40 hover:text-white/75'
              }`}
              style={{
                background: isActive ? 'rgba(214,40,40,0.12)' : 'transparent',
                border: isActive ? '1px solid rgba(214,40,40,0.30)' : '1px solid transparent',
                boxShadow: isActive ? '0 0 20px rgba(214,40,40,0.12)' : 'none',
              }}
            >
              {/* Hover bg */}
              {!isActive && (
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white/[0.03] rounded-xl" />
              )}

              {/* Icono */}
              <div className={`relative flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
                isActive
                  ? 'bg-potros-red text-white shadow-[0_0_12px_rgba(214,40,40,0.6)]'
                  : 'bg-white/5 text-white/40 group-hover:bg-white/10 group-hover:text-white/70'
              }`}>
                <Icon size={14} strokeWidth={isActive ? 2.5 : 2} />
              </div>

              <span className={`font-semibold text-[13px] flex-1 ${isActive ? 'text-white' : ''}`}>
                {label}
              </span>

              {/* Punto activo */}
              {isActive && (
                <motion.div
                  layoutId="navDot"
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: '#d62828', boxShadow: '0 0 8px rgba(214,40,40,0.8)' }}
                />
              )}
            </motion.button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="relative z-10 px-3 pb-4 pt-2 border-t border-white/[0.05]">
        <div className="flex items-center gap-2 px-2.5 py-2 rounded-xl"
          style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.12)' }}>
          <div className="relative flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />
          </div>
          <span className="text-xs text-emerald-400/70 font-semibold">Sistema activo</span>
          <Activity size={10} className="ml-auto text-emerald-400/30" />
        </div>
      </div>
    </aside>
  )
}

function StatTile({ label, value, color, bg, border, Icon, pulse = false }) {
  return (
    <div
      className="rounded-xl p-2.5 relative overflow-hidden"
      style={{ background: bg, border: `1px solid ${border}` }}
    >
      <div className="flex items-start justify-between mb-1">
        <Icon size={11} style={{ color, opacity: 0.7 }} />
        {pulse && <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: color }} />}
      </div>
      <div className={`text-2xl font-black leading-none tabular-nums ${pulse ? 'number-pulse' : ''}`}
        style={{ color }}>
        {value.toLocaleString()}
      </div>
      <div className="text-[10px] font-semibold text-white/55 mt-0.5">{label}</div>
    </div>
  )
}
