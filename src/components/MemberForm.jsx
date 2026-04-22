import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { UserPlus, User, Phone, Calendar, Shield, Minus, Plus, AlertCircle, CheckCircle2 } from 'lucide-react'
import membersService from '../services/membersService'

const PLAN_OPTIONS = [
  { value: 'semana',    label: '1 Semana',          sublabel: '$150' },
  { value: '15dias',    label: '15 Días',            sublabel: '$250' },
  { value: 'estudiante',label: 'Promo Estudiantes',  sublabel: '$350' },
  { value: 'mensual',   label: 'Mensual',            sublabel: '$500' },
  { value: 'parejas',   label: 'Parejas o Más',      sublabel: '$400' },
  { value: 'anual',     label: 'Anual',              sublabel: '$5,000' },
]

function FormSection({ title, icon: Icon, children }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 md:p-5 space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-white/[0.05]">
        {Icon && <div className="w-7 h-7 rounded-lg bg-potros-red/15 flex items-center justify-center"><Icon size={14} className="text-potros-red" /></div>}
        <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function FieldLabel({ children, required }) {
  return (
    <label className="block text-xs font-semibold text-white/55 mb-1.5">
      {children}{required && <span className="text-potros-red ml-1">*</span>}
    </label>
  )
}

function Input({ ...props }) {
  return (
    <input
      className="w-full px-3.5 py-2.5 rounded-lg bg-white/[0.05] border border-white/[0.09] focus:border-potros-red/60 focus:outline-none focus:ring-1 focus:ring-potros-red/25 text-white placeholder-white/20 text-sm transition-all"
      {...props}
    />
  )
}

export default function MemberForm({ onSave, onShowToast }) {
  const [firstName, setFirstName] = useState('')
  const [paterno,   setPaterno]   = useState('')
  const [materno,   setMaterno]   = useState('')
  const [phone,     setPhone]     = useState('')
  const [joinDate,  setJoinDate]  = useState(membersService.getTodayLocal())
  const [planType,  setPlanType]  = useState('mensual')
  const [quantity,  setQuantity]  = useState(1)
  const [pricePreview,  setPricePreview]  = useState(membersService.PLANS['mensual'].price)
  const [expiryPreview, setExpiryPreview] = useState(membersService.computeExpiry(membersService.getTodayLocal(), 'mensual'))
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const p = membersService.PLANS[planType] || { price: 0 }
    setPricePreview(p.price * quantity)
    // BUG FIX v3: usa addMonths para planes mensuales/anuales
    if (planType === 'visita') {
      setExpiryPreview(joinDate)
    } else if (p.months > 0) {
      setExpiryPreview(membersService.addMonths(joinDate, p.months * quantity))
    } else {
      setExpiryPreview(membersService.addDays(joinDate, p.days * quantity))
    }
  }, [planType, joinDate, quantity])

  const submit = async (e) => {
    e.preventDefault()
    if (loading) return
    setError('')
    if (!firstName.trim() || !paterno.trim() || !materno.trim()) {
      setError('Nombre, apellido paterno y materno son requeridos')
      return
    }
    try {
      setLoading(true)
      const created = await membersService.addMember({ firstName, paterno, materno, phone, joinDate, planType, quantity })
      setFirstName(''); setPaterno(''); setMaterno(''); setPhone('')
      setJoinDate(membersService.getTodayLocal()); setPlanType('mensual'); setQuantity(1)
      if (onShowToast) onShowToast(`${created.firstName} ${created.paterno} registrado ✅`, 'success')
      onSave()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const quantityLabel = planType === 'anual' ? 'años' : planType === '15dias' ? 'períodos' : 'meses'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl overflow-hidden"
      style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 md:px-6 py-5 border-b border-white/[0.06]">
        <div className="w-10 h-10 rounded-xl bg-potros-red/15 border border-potros-red/25 flex items-center justify-center">
          <UserPlus size={18} className="text-potros-red" />
        </div>
        <div>
          <h2 className="font-extrabold text-white text-lg">Registrar Nuevo Socio</h2>
          <p className="text-xs text-white/60">Completa los datos para crear la membresía</p>
        </div>
      </div>

      <form onSubmit={submit} className="p-5 md:p-6 space-y-4">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm"
          >
            <AlertCircle size={15} className="flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Datos personales */}
        <FormSection title="Datos Personales" icon={User}>
          <div>
            <FieldLabel required>Nombre(s)</FieldLabel>
            <Input
              value={firstName}
              onChange={e => setFirstName(e.target.value.toUpperCase())}
              placeholder="Ej: JUAN CARLOS"
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <FieldLabel required>Apellido Paterno</FieldLabel>
              <Input
                value={paterno}
                onChange={e => setPaterno(e.target.value.toUpperCase())}
                placeholder="Ej: LÓPEZ"
                required
              />
            </div>
            <div>
              <FieldLabel required>Apellido Materno</FieldLabel>
              <Input
                value={materno}
                onChange={e => setMaterno(e.target.value.toUpperCase())}
                placeholder="Ej: GARCÍA"
                required
              />
            </div>
          </div>
        </FormSection>

        {/* Contacto */}
        <FormSection title="Contacto" icon={Phone}>
          <div>
            <FieldLabel required>Teléfono / WhatsApp</FieldLabel>
            <Input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="55 1234 5678"
              required
            />
          </div>
        </FormSection>

        {/* Membresía */}
        <FormSection title="Membresía" icon={Shield}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <FieldLabel>Fecha de ingreso</FieldLabel>
              <Input
                type="date"
                value={joinDate}
                onChange={e => setJoinDate(e.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Plan</FieldLabel>
              <select
                value={planType}
                onChange={e => setPlanType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-white/[0.05] border border-white/[0.09] focus:border-potros-red/60 focus:outline-none text-white text-sm transition-all"
              >
                {PLAN_OPTIONS.map(p => (
                  <option key={p.value} value={p.value}>{p.label} — {p.sublabel}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Cantidad */}
          {planType !== 'visita' && (
            <div>
              <FieldLabel>Cantidad de {quantityLabel}</FieldLabel>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/[0.08] text-potros-red hover:bg-white/10 transition-all font-bold"
                >
                  <Minus size={15} />
                </button>
                <div className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-center font-bold text-white text-base">
                  {quantity}
                </div>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(24, quantity + 1))}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/[0.08] text-potros-red hover:bg-white/10 transition-all font-bold"
                >
                  <Plus size={15} />
                </button>
              </div>
            </div>
          )}

          {/* Preview */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-white/60 mb-1 font-medium">Precio total</div>
                <div className="text-3xl font-extrabold text-potros-red">${pricePreview.toLocaleString()}</div>
                {quantity > 1 && (
                  <div className="text-xs text-white/55 mt-1">${(pricePreview / quantity).toLocaleString()} × {quantity}</div>
                )}
              </div>
              <div className="text-right">
                <div className="text-xs text-white/60 mb-1 font-medium">Vencimiento</div>
                <div className="text-sm font-bold text-emerald-400 leading-tight">{membersService.formatSpanishDate(expiryPreview)}</div>
              </div>
            </div>
          </div>
        </FormSection>

        <motion.button
          type="submit"
          disabled={loading}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3.5 rounded-xl bg-potros-red hover:bg-potros-red-light disabled:opacity-50 text-white font-bold text-base transition-all shadow-[0_0_24px_rgba(214,40,40,0.35)] hover:shadow-[0_0_36px_rgba(214,40,40,0.5)]"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                <UserPlus size={16} />
              </motion.div>
              Registrando...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <CheckCircle2 size={16} /> Registrar Socio
            </span>
          )}
        </motion.button>
      </form>
    </motion.div>
  )
}
