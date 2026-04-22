import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Dumbbell, RefreshCw, LogIn, Phone, Calendar, Shield, Activity, AlertTriangle, CheckCircle2 } from 'lucide-react'
import membersService, { PLANS } from '../services/membersService'

// BUG FIX v3: agregar T23:59:59 para que el vencimiento sea al final del día
function daysUntil(dateISO) {
  const now = new Date()
  const d = new Date(dateISO + 'T23:59:59')
  const diff = Math.ceil((d - now) / (1000*60*60*24))
  return diff
}

export default function MemberStatusModal({ member, onClose, onChange = () => {}, onPaymentDone = () => {}, onShowToast, isBusy = false }) {
  const planInfo = membersService.getPlanInfo(member.planType) || { label: member.planType, price: 0 }
  const d        = member.expiry ? daysUntil(member.expiry) : null
  const expired  = d !== null ? d < 0 : false
  const expiringSoon = d !== null && !expired && d <= 5
  const fullName = `${member.firstName || member.name || ''} ${member.paterno || ''} ${member.materno || ''}`.trim()

  const [renewPlan, setRenewPlan] = useState(member.planType === 'visita' ? 'mensual' : member.planType || 'mensual')
  const [saving, setSaving]       = useState(false)
  const [entrySaving, setEntrySaving] = useState(false)
  const actionLocked = saving || entrySaving || isBusy

  // Previsualizar fecha de vencimiento del plan a renovar
  const renewPreviewExpiry = (() => {
    const startDate = (!expired && member.expiry) ? membersService.addDays(member.expiry, 1) : membersService.getTodayLocal()
    return membersService.computeExpiry(startDate, renewPlan)
  })()

  const handleRegisterEntry = async () => {
    if (actionLocked) return
    try {
      setEntrySaving(true)
      await membersService.registerVisit(member.id, { method: 'manual' })
      if (onShowToast) onShowToast(`Entrada registrada: ${fullName}`, 'success')
      onChange()
      onClose()
    } catch (err) {
      alert('Error registrando la entrada: ' + err.message)
    } finally {
      setEntrySaving(false)
    }
  }

  const handleRenewAndClose = async () => {
    if (actionLocked) return
    try {
      setSaving(true)
      const today = membersService.getTodayLocal()
      const plan  = PLANS[renewPlan]
      if (!plan) throw new Error('Plan no válido')

      // BUG FIX v3: si el socio sigue activo, renovar desde el día SIGUIENTE al vencimiento
      const startDate     = (!expired && member.expiry) ? membersService.addDays(member.expiry, 1) : today
      const hasVisitToday = (member.visits || []).some(v => v.at && v.at.startsWith(today))

      await membersService.updateMember(member.id, { planType: renewPlan, joinDate: startDate })
      await membersService.registerPayment(member.id, { type: renewPlan })
      if (!hasVisitToday) await membersService.registerVisit(member.id, { method: 'manual' })

      if (onShowToast) {
        const planLabel = membersService.PLANS[renewPlan]?.label || renewPlan
        onShowToast(`${fullName} renovó ${planLabel}`, 'success')
      }

      onPaymentDone(true)
      onChange()
      onClose()
    } catch (err) {
      alert('Error al renovar: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(4,8,18,0.92)', backdropFilter: 'blur(12px)' }}
        onClick={() => { if (!actionLocked) onClose() }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-white/[0.09]"
          style={{ background: '#0f1623', boxShadow: '0 30px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Glow de estado */}
          <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl ${
            expired ? 'bg-gradient-to-r from-red-600 to-red-500' :
            expiringSoon ? 'bg-gradient-to-r from-amber-500 to-yellow-400' :
            'bg-gradient-to-r from-potros-red to-red-500'
          }`} />

          {/* Botón cerrar */}
          <button
            onClick={() => { if (!actionLocked) onClose() }}
            disabled={actionLocked}
            className="absolute top-4 right-4 z-10 p-2 rounded-lg text-white/55 hover:text-white/70 hover:bg-white/5 transition-all"
          >
            <X size={18} />
          </button>

          <div className="p-6 md:p-8">
            {/* Cabecera */}
            <div className="text-center mb-6">
              <div className="relative inline-block mb-4">
                <div className="w-16 h-16 rounded-2xl bg-potros-red/20 border border-potros-red/30 flex items-center justify-center mx-auto">
                  <Dumbbell size={28} className="text-potros-red" />
                </div>
                <motion.div
                  className="absolute inset-0 rounded-2xl bg-potros-red/10 blur-lg"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                />
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-1">
                ¡Bienvenido!
              </h2>
              <p className="text-lg font-semibold text-white/70">{fullName}</p>
            </div>

            {/* Info del socio */}
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <InfoBox label="Plan"    value={planInfo.label}         accent="text-white" />
              <InfoBox label="Precio"  value={`$${member.price || 0}`} accent="text-potros-red" />
              <InfoBox label="Teléfono" value={member.phone} Icon={Phone} />
              <InfoBox label="Visitas" value={(member.visits || []).length} Icon={Activity} accent="text-sky-400" />
            </div>

            {/* Estado de membresía */}
            {member.planType !== 'visita' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`mb-4 p-4 rounded-xl border flex items-center gap-3 ${
                  expired
                    ? 'bg-red-500/10 border-red-500/25 text-red-300'
                    : expiringSoon
                    ? 'bg-amber-500/10 border-amber-500/25 text-amber-300'
                    : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                }`}
              >
                {expired
                  ? <AlertTriangle size={22} className="flex-shrink-0 text-red-400" />
                  : <CheckCircle2 size={22} className="flex-shrink-0 text-emerald-400" />
                }
                <div>
                  <div className="font-bold text-sm">
                    {expired
                      ? `❌ Membresía vencida hace ${Math.abs(d)} días`
                      : `✅ Activa — ${d} días restantes`
                    }
                  </div>
                  <div className="text-xs opacity-70 mt-0.5">
                    Vence: {membersService.formatSpanishDate(member.expiry)}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Renovar */}
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <RefreshCw size={14} className="text-potros-red" />
                <span className="text-sm font-bold text-white">Renovar membresía</span>
              </div>
              <select
                value={renewPlan}
                onChange={e => setRenewPlan(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-white/[0.05] border border-white/[0.09] focus:border-potros-red/60 focus:outline-none text-white text-sm mb-3 transition-all"
              >
                {Object.entries(PLANS)
                  .filter(([key]) => key !== 'visita')
                  .map(([key, plan]) => (
                    <option key={key} value={key}>{plan.label} — ${plan.price}</option>
                  ))
                }
              </select>
              <div className="text-[11px] text-white/60 mb-2.5">
                {!expired && member.expiry
                  ? `La nueva membresía inicia el ${membersService.addDays(member.expiry, 1)} — no perderá días activos`
                  : 'La nueva membresía inicia hoy'
                }
                {' · '}Vence: <span className="text-white/60 font-semibold">{membersService.formatSpanishDate(renewPreviewExpiry)}</span>
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleRenewAndClose}
                disabled={actionLocked}
                className="w-full py-3 px-4 rounded-xl bg-potros-red hover:bg-potros-red-light disabled:opacity-50 text-white font-bold text-sm transition-all shadow-[0_0_20px_rgba(214,40,40,0.3)] hover:shadow-[0_0_30px_rgba(214,40,40,0.45)]"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                      <RefreshCw size={15} />
                    </motion.div>
                    Procesando...
                  </span>
                ) : '💳 Renovar y cobrar hoy'}
              </motion.button>
            </div>

            {/* Botones de acción */}
            <div className="grid grid-cols-2 gap-2.5">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleRegisterEntry}
                disabled={actionLocked}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/20 text-sky-400 font-semibold text-sm transition-all"
              >
                <LogIn size={14} /> Registrar entrada
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => { if (!actionLocked) onClose() }}
                disabled={actionLocked}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.07] text-white/60 hover:text-white font-semibold text-sm transition-all"
              >
                <X size={14} /> Cerrar
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function InfoBox({ label, value, accent = 'text-white/80', Icon }) {
  return (
    <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.05]">
      <div className="text-[10px] text-white/55 uppercase font-semibold mb-1 flex items-center gap-1">
        {Icon && <Icon size={9} />}{label}
      </div>
      <div className={`text-sm font-bold ${accent} truncate`}>{value}</div>
    </div>
  )
}
