import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, Calendar, Shield, RefreshCw, Trash2, Activity, ChevronDown, ChevronUp, CreditCard, Clock, Mail } from 'lucide-react'
import membersService from '../services/membersService'
import RenewModal from './RenewModal'

function daysUntil(dateISO) {
  const now = new Date()
  const d   = new Date(dateISO + 'T23:59:59')
  return Math.ceil((d - now) / (1000 * 60 * 60 * 24))
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-MX', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}

function fmtPaymentDate(isoStr) {
  if (!isoStr) return '—'
  const d = new Date(isoStr)
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function MemberCard({ member, onChange }) {
  const [showRenewModal, setShowRenewModal] = useState(false)
  const [expanded,       setExpanded]       = useState(false)
  const [removing,       setRemoving]       = useState(false)

  const planInfo     = membersService.getPlanInfo(member.planType) || { label: member.planType }
  const d            = member.expiry ? daysUntil(member.expiry) : null
  const expired      = d !== null ? d < 0 : false
  const expiringSoon = d !== null && !expired && d <= 5
  const isVisit      = member.planType === 'visita'
  const fullName     = `${member.firstName || member.name || ''} ${member.paterno || ''} ${member.materno || ''}`.trim()

  const payments    = member.payments || []
  const lastPayment = payments.length > 0 ? payments[payments.length - 1] : null

  const membershipProgress = (() => {
    if (isVisit || !member.joinDate || !member.expiry || expired) return null
    const start   = new Date(member.joinDate + 'T00:00:00').getTime()
    const end     = new Date(member.expiry   + 'T00:00:00').getTime()
    const now     = Date.now()
    const total   = Math.max(1, end - start)
    const elapsed = Math.max(0, Math.min(total, now - start))
    return Math.round((elapsed / total) * 100)
  })()

  const remove = async () => {
    if (removing) return
    if (!confirm(`¿Eliminar a ${fullName}?`)) return
    try {
      setRemoving(true)
      await membersService.deleteMember(member.id)
      await Promise.resolve(onChange())
    } finally {
      setRemoving(false)
    }
  }

  const sc = expired
    ? { label: 'VENCIDA',           bg: 'bg-red-500/15',     border: 'border-red-500/25',     text: 'text-red-400',     dot: 'bg-red-500',     bar: '#ef4444' }
    : expiringSoon
    ? { label: `${d}d restantes`,   bg: 'bg-amber-500/15',   border: 'border-amber-500/25',   text: 'text-amber-400',   dot: 'bg-amber-500',   bar: '#f59e0b' }
    : isVisit
    ? { label: 'VISITA',            bg: 'bg-blue-500/15',    border: 'border-blue-500/25',    text: 'text-blue-400',    dot: 'bg-blue-500',    bar: '#3b82f6' }
    : { label: 'ACTIVA',            bg: 'bg-emerald-500/15', border: 'border-emerald-500/25', text: 'text-emerald-400', dot: 'bg-emerald-400', bar: '#10b981' }

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden border transition-all relative"
        style={{
          background:     'rgba(255,255,255,0.025)',
          backdropFilter: 'blur(16px)',
          borderColor:    expanded ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.055)',
          boxShadow:      expanded
            ? '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)'
            : '0 2px 10px rgba(0,0,0,0.25)',
        }}
      >
        {/* Accent bar lateral */}
        <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-[16px]"
          style={{ background: sc.bar, opacity: expired ? 0.9 : 0.6 }} />

        {/* Header de la tarjeta */}
        <div className="flex items-center justify-between pl-4 pr-3 py-3.5">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Avatar */}
            <div className={`relative flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-black text-[15px] ${sc.bg} ${sc.text} border ${sc.border}`}>
              {(member.firstName || '?')[0].toUpperCase()}
              {!expired && !isVisit && (
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-black"
                  style={{ background: sc.bar }}>
                  <span className="absolute inset-0 rounded-full bg-white/70 animate-ping scale-75" />
                </span>
              )}
            </div>

            {/* Texto */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-white text-[13px] md:text-sm truncate">{fullName}</h3>
                <span className={`flex-shrink-0 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${sc.bg} ${sc.text} ${sc.border}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} ${!expired && !isVisit ? 'animate-pulse' : ''}`} />
                  {sc.label}
                </span>
              </div>

              {/* Subtítulo: teléfono + plan + fecha vencimiento */}
              <div className="flex items-center gap-2.5 mt-0.5 flex-wrap">
                <span className="text-[11px] text-white/55 flex items-center gap-0.5">
                  <Phone size={8} />{member.phone}
                </span>
                <span className="text-[11px] text-white/55 flex items-center gap-0.5">
                  <Shield size={8} />{planInfo.label}
                </span>
                {member.expiry && !isVisit && (
                  <span className={`text-[11px] font-semibold flex items-center gap-0.5 ${
                    expired ? 'text-red-400/80' : expiringSoon ? 'text-amber-400/80' : 'text-white/55'
                  }`}>
                    <Calendar size={8} />
                    {expired
                      ? `Venció ${fmtDate(member.expiry)}`
                      : `Vence ${fmtDate(member.expiry)}`}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex items-center gap-1 flex-shrink-0 ml-1">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowRenewModal(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-potros-red/15 hover:bg-potros-red/25 border border-potros-red/25 text-potros-red text-[11px] font-bold transition-all"
            >
              <RefreshCw size={10} />
              <span className="hidden sm:inline">Renovar</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-lg text-white/45 hover:text-white/70 hover:bg-white/5 transition-all"
              title={expanded ? 'Ocultar' : 'Ver perfil'}
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </motion.button>
          </div>
        </div>

        {/* Perfil expandido */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 border-t border-white/[0.06]">

                {/* Barra de progreso de membresía */}
                {!isVisit && d !== null && (
                  <div className="mt-3 mb-3 p-3 rounded-xl border"
                    style={{ background: `${sc.bar}0a`, borderColor: `${sc.bar}25` }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] text-white/40 flex items-center gap-1">
                        <Clock size={10} /> Membresía activa
                      </span>
                      <span className={`text-sm font-black ${sc.text}`}>
                        {expired
                          ? `Venció hace ${Math.abs(d)} día${Math.abs(d) !== 1 ? 's' : ''}`
                          : `${d} día${d !== 1 ? 's' : ''} restante${d !== 1 ? 's' : ''}`}
                      </span>
                    </div>

                    {membershipProgress !== null && (
                      <>
                        <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${membershipProgress}%` }}
                            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.1 }}
                            className="h-full rounded-full"
                            style={{
                              background: `linear-gradient(90deg, ${sc.bar}88 0%, ${sc.bar} 100%)`,
                              boxShadow: `0 0 8px ${sc.bar}66`,
                            }}
                          />
                        </div>
                        <div className="flex justify-between mt-1 text-[10px] text-white/40">
                          <span>{fmtDate(member.joinDate)}</span>
                          <span>{fmtDate(member.expiry)}</span>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Grid de datos */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <InfoCell label="Precio / mes" value={`$${(member.price || 0).toLocaleString('es-MX')}`} accent="text-potros-red" Icon={CreditCard} />
                  <InfoCell label="Fecha de ingreso" value={fmtDate(member.joinDate)} Icon={Calendar} />
                  <InfoCell
                    label={expired ? 'Venció el' : 'Vence el'}
                    value={fmtDate(member.expiry)}
                    accent={expired ? 'text-red-400' : expiringSoon ? 'text-amber-400' : 'text-emerald-400'}
                    Icon={Clock}
                  />
                  {lastPayment && (
                    <InfoCell label="Último pago" value={fmtPaymentDate(lastPayment.at)} Icon={Calendar} />
                  )}
                  {lastPayment && (
                    <InfoCell label="Monto pagado" value={`$${(lastPayment.amount || 0).toLocaleString('es-MX')}`} accent="text-emerald-400" />
                  )}
                  <InfoCell label="Visitas totales" value={(member.visits || []).length} Icon={Activity} accent="text-sky-400" />
                  {member.email && (
                    <InfoCell label="Email" value={member.email} Icon={Mail} fullWidth />
                  )}
                </div>

                <div className="mt-3 flex justify-end">
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={remove}
                    disabled={removing}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] text-red-400/40 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
                  >
                    <Trash2 size={10} /> {removing ? 'Eliminando...' : 'Eliminar socio'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {showRenewModal && (
        <RenewModal member={member} onClose={() => setShowRenewModal(false)} onSave={onChange} />
      )}
    </>
  )
}

function InfoCell({ label, value, accent = 'text-white/80', Icon, fullWidth = false }) {
  return (
    <div className={`bg-white/[0.025] rounded-xl p-2.5 border border-white/[0.04] ${fullWidth ? 'col-span-2 md:col-span-3' : ''}`}>
      <div className="text-[10px] text-white/45 font-medium uppercase tracking-wide mb-1 flex items-center gap-1">
        {Icon && <Icon size={9} />}{label}
      </div>
      <div className={`text-xs font-bold ${accent} truncate`}>{value}</div>
    </div>
  )
}
