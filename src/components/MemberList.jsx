import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Users, CheckCircle2, XCircle, Clock } from 'lucide-react'
import MemberCard from './MemberCard'
import membersService from '../services/membersService'

const FILTERS = [
  { id: 'all',     label: 'Todos' },
  { id: 'active',  label: 'Activos' },
  { id: 'expired', label: 'Vencidos' },
  { id: 'soon',    label: 'Por vencer' },
]

export default function MemberList({ members = [], onChange }) {
  const [q, setQ]           = useState('')
  const [filter, setFilter] = useState('all')

  const list = useMemo(() => {
    const now  = new Date()
    const term = q.trim().toLowerCase()

    return members.filter(m => {
      // Text search
      const fullName = `${m.firstName || m.name || ''} ${m.paterno || ''} ${m.materno || ''}`.toLowerCase()
      const textOk = !term || fullName.includes(term) || (m.email || '').toLowerCase().includes(term) || (m.phone || '').toLowerCase().includes(term)

      // Status filter
      const d         = m.expiry ? Math.ceil((new Date(m.expiry + 'T23:59:59') - now) / (1000*60*60*24)) : null
      const expired   = d !== null && d < 0
      const expiringSoon = d !== null && !expired && d <= 5
      const filterOk =
        filter === 'all'     ? true :
        filter === 'active'  ? (!expired && m.planType !== 'visita') :
        filter === 'expired' ? expired :
        filter === 'soon'    ? expiringSoon : true

      return textOk && filterOk
    })
  }, [members, q, filter])

  const counts = useMemo(() => {
    const now = new Date()
    let active = 0, expired = 0, soon = 0
    members.forEach(m => {
      const d = m.expiry ? Math.ceil((new Date(m.expiry + 'T23:59:59') - now) / (1000*60*60*24)) : null
      if (d === null) return
      if (d < 0)           { expired++ }
      else if (d <= 5)     { soon++ }
      else                 { active++ }
    })
    return { active, expired, soon, total: members.length }
  }, [members])

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-5"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)' }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/20 flex items-center justify-center">
              <Users size={18} className="text-sky-400" />
            </div>
            <div>
              <h2 className="font-extrabold text-white text-xl">Lista de Socios</h2>
              <p className="text-xs text-white/60">{members.length} registrados en total</p>
            </div>
          </div>
          {/* Summary pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <Pill Icon={CheckCircle2} value={counts.active}  label="activos"  color="text-emerald-400" bg="bg-emerald-500/10 border-emerald-500/15" />
            <Pill Icon={Clock}        value={counts.soon}    label="por vencer" color="text-amber-400" bg="bg-amber-500/10 border-amber-500/15" />
            <Pill Icon={XCircle}      value={counts.expired} label="vencidos" color="text-red-400"    bg="bg-red-500/10 border-red-500/15" />
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/45 pointer-events-none" />
          <input
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] focus:border-potros-red/50 focus:outline-none focus:ring-1 focus:ring-potros-red/25 text-white placeholder-white/25 text-sm transition-all"
            placeholder="Buscar por nombre, teléfono o email..."
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === f.id
                  ? 'bg-potros-red/20 border border-potros-red/35 text-potros-red shadow-[0_0_10px_rgba(214,40,40,0.15)]'
                  : 'bg-white/[0.04] border border-white/[0.06] text-white/45 hover:text-white/70 hover:bg-white/[0.06]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Lista */}
      <div className="space-y-2.5">
        <AnimatePresence mode="popLayout">
          {list.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-2xl p-12 text-center border border-dashed border-white/[0.08]"
            >
              <div className="text-4xl mb-3">🔍</div>
              <div className="text-white/40 text-sm">
                {q ? `No se encontraron socios con "${q}"` : 'No hay socios en esta categoría'}
              </div>
            </motion.div>
          ) : (
            list.map(m => <MemberCard key={m.id} member={m} onChange={onChange} />)
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function Pill({ Icon, value, label, color, bg }) {
  return (
    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${bg} ${color}`}>
      <Icon size={11} />
      {value} {label}
    </span>
  )
}
