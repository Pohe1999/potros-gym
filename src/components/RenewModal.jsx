import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, X, Calendar, CheckCircle2 } from 'lucide-react'
import membersService from '../services/membersService'

export default function RenewModal({ member, onClose, onSave }) {
  const [planType, setPlanType]           = useState('mensual')
  const [recordPayment, setRecordPayment] = useState(true)
  const [saving, setSaving]               = useState(false)

  const today   = membersService.getTodayLocal()
  const expired = !member.expiry || member.expiry < today

  // Si el socio sigue activo, encadenar desde el día siguiente al vencimiento
  const startDate = (!expired && member.expiry)
    ? membersService.addDays(member.expiry, 1)
    : today

  const planInfo  = membersService.PLANS[planType] || { price: 0, label: 'Mensual' }
  const newExpiry = membersService.computeExpiry(startDate, planType)

  const handleRenew = async () => {
    if (saving) return
    try {
      setSaving(true)
      await membersService.updateMember(member.id, {
        planType,
        joinDate: startDate
      })
      if (recordPayment) {
        await membersService.registerPayment(member.id, { type: planType })
      }
      onSave()
      onClose()
    } catch (err) {
      alert('Error al renovar: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(4,8,18,0.90)', backdropFilter: 'blur(12px)' }}
      onClick={() => { if (!saving) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }}
        className="relative w-full max-w-sm rounded-2xl border border-white/[0.08] overflow-hidden"
        style={{ background: '#0f1623', boxShadow: '0 30px 80px rgba(0,0,0,0.7)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top accent */}
        <div className="h-1 bg-gradient-to-r from-potros-red to-red-500 rounded-t-2xl" />

        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-potros-red/15 border border-potros-red/25 flex items-center justify-center">
                <RefreshCw size={16} className="text-potros-red" />
              </div>
              <h2 className="font-extrabold text-lg text-white">Renovar Membresía</h2>
            </div>
            <button disabled={saving} onClick={onClose} className="p-1.5 rounded-lg text-white/55 hover:text-white/70 hover:bg-white/5 transition-all disabled:opacity-40">
              <X size={16} />
            </button>
          </div>

          <div className="space-y-3 mb-5">
            <div>
              <label className="block text-xs text-white/40 font-semibold uppercase tracking-wider mb-1.5">Plan</label>
              <select
                value={planType}
                onChange={e => setPlanType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.09] focus:border-potros-red/60 focus:outline-none text-white text-sm transition-all"
              >
                {Object.entries(membersService.PLANS)
                  .filter(([k]) => k !== 'visita')
                  .map(([k, p]) => <option key={k} value={k}>{p.label} — ${p.price}</option>)
                }
              </select>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-500/8 border border-emerald-500/15">
              <Calendar size={14} className="text-emerald-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-emerald-400/60 font-medium">
                  {!expired && member.expiry ? 'Encadenado desde el día siguiente al vencimiento' : 'Inicia hoy'}
                </div>
                <div className="text-sm font-bold text-emerald-300">
                  Vence: {membersService.formatSpanishDate(newExpiry)}
                </div>
                {!expired && member.expiry && (
                  <div className="text-[10px] text-white/40 mt-0.5">
                    Inicia: {membersService.formatSpanishDate(startDate)}
                  </div>
                )}
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer group p-3 rounded-xl hover:bg-white/[0.03] transition-colors">
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                recordPayment ? 'bg-potros-red border-potros-red' : 'border-white/20 group-hover:border-white/40'
              }`}>
                {recordPayment && <CheckCircle2 size={11} className="text-white" />}
              </div>
              <input type="checkbox" checked={recordPayment} onChange={e => setRecordPayment(e.target.checked)} className="hidden" />
              <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">
                Registrar pago — <span className="font-bold text-white">${planInfo.price}</span>
              </span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button disabled={saving} onClick={onClose} className="py-2.5 rounded-xl bg-white/[0.04] text-white/50 font-semibold text-sm hover:bg-white/[0.08] transition-all disabled:opacity-40">
              Cancelar
            </button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleRenew}
              disabled={saving}
              className="py-2.5 rounded-xl bg-potros-red hover:bg-potros-red-light disabled:opacity-50 text-white font-bold text-sm transition-all shadow-[0_0_18px_rgba(214,40,40,0.3)]"
            >
              {saving ? 'Renovando...' : 'Renovar'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
