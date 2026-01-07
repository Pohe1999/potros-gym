import React, { useState, useEffect } from 'react'
import membersService, { PLANS } from '../services/membersService'

function daysUntil(dateISO) {
  const now = new Date()
  const d = new Date(dateISO)
  const diff = Math.ceil((d - now) / (1000*60*60*24))
  return diff
}

export default function MemberStatusModal({ member, onClose, onChange = () => {}, onPaymentDone = () => {}, onNavigateToMembers = () => {}, onShowToast }) {
  const planInfo = membersService.getPlanInfo(member.planType) || { label: member.planType, price: 0 }
  const d = member.expiry ? daysUntil(member.expiry) : null
  const expired = d !== null ? d < 0 : false
  const fullName = `${member.firstName || member.name || ''} ${member.paterno || ''} ${member.materno || ''}`.trim()
  const [renewPlan, setRenewPlan] = useState(member.planType === 'visita' ? 'mensual' : member.planType || 'mensual')
  const [saving, setSaving] = useState(false)

  const handleRegisterEntry = async () => {
    // Register a manual entry for this member (no payment)
    try {
      await membersService.registerVisit(member.id, { method: 'manual' })
      onChange()
      onClose()
    } catch (err) {
      console.error('Error registrando entrada:', err)
      alert('Error registrando la entrada: ' + err.message)
    }
  }

  const handleRenew = async () => {
    try {
      setSaving(true)
      const today = membersService.getTodayLocal()
      const plan = PLANS[renewPlan]
      if (!plan) throw new Error('Plan no válido')

      const hasVisitToday = (member.visits || []).some(v => v.at && v.at.startsWith(today))

      // 1) Actualizar membresía con fecha de inicio hoy
      await membersService.updateMember(member.id, { planType: renewPlan, joinDate: today })

      // 2) Registrar pago del plan (ingreso del día)
      await membersService.registerPayment(member.id, { type: renewPlan })

      // 3) Registrar la entrada de hoy (una sola vez)
      if (!hasVisitToday) {
        await membersService.registerVisit(member.id, { method: 'manual' })
      }

      onPaymentDone(true) // evita un segundo registro desde el cierre del modal
      onChange()
      onClose()
    } catch (err) {
      console.error('Error al renovar:', err)
      alert('Error al renovar: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleRenewAndClose = async () => {
    try {
      setSaving(true)
      const today = membersService.getTodayLocal()
      const plan = PLANS[renewPlan]
      if (!plan) throw new Error('Plan no válido')

      const hasVisitToday = (member.visits || []).some(v => v.at && v.at.startsWith(today))

      // 1) Actualizar membresía con fecha de inicio hoy
      await membersService.updateMember(member.id, { planType: renewPlan, joinDate: today })

      // 2) Registrar pago del plan (ingreso del día)
      await membersService.registerPayment(member.id, { type: renewPlan })

      // 3) Registrar la entrada de hoy (una sola vez)
      if (!hasVisitToday) {
        await membersService.registerVisit(member.id, { method: 'manual' })
      }

      if (onShowToast) {
        const fullName = `${member.firstName} ${member.paterno}`.trim()
        const planLabel = membersService.PLANS[renewPlan]?.label || renewPlan
        onShowToast(`${fullName} renovó ${planLabel}`, 'success')
      }

      onPaymentDone(true)
      onChange()
      onClose()
    } catch (err) {
      console.error('Error al renovar:', err)
      alert('Error al renovar: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 animate-fadeIn" onClick={onClose}>
      <div className="bg-gray-900 p-8 rounded-xl card-shadow max-w-2xl w-full border-2 border-potros-red animate-scaleIn" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-6">
          <div className="text-6xl mb-3">🏋️</div>
          <h2 className="text-4xl font-bold text-potros-red mb-2">¡Bienvenido!</h2>
          <h3 className="text-3xl font-semibold">{fullName}</h3>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg space-y-3 border border-gray-700">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-900 p-3 rounded">
              <span className="text-sm text-gray-400 block">Plan</span>
              <span className="font-bold text-lg">{planInfo.label}</span>
            </div>
            <div className="bg-gray-900 p-3 rounded">
              <span className="text-sm text-gray-400 block">Precio</span>
              <span className="font-bold text-lg text-potros-red">${member.price}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-900 p-3 rounded">
              <span className="text-sm text-gray-400 block">Ingreso</span>
              <span className="font-semibold">{membersService.formatSpanishDate(member.joinDate)}</span>
            </div>
            {member.planType !== 'visita' && (
              <div className="bg-gray-900 p-3 rounded">
                <span className="text-sm text-gray-400 block">Vencimiento</span>
                <span className="font-semibold">{membersService.formatSpanishDate(member.expiry)}</span>
              </div>
            )}
          </div>

          {member.planType !== 'visita' && (
            <div className={`p-4 rounded-lg text-center ${
              expired ? 'bg-red-900 border-2 border-red-600' : 'bg-green-900 border-2 border-green-600'
            }`}>
              <div className="text-3xl font-bold ${
                expired ? 'text-red-200' : 'text-green-200'
              }">
                {expired ? '❌ MEMBRESÍA VENCIDA' : `✅ ACTIVA - ${d} DÍAS RESTANTES`}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-900 p-3 rounded">
              <span className="text-sm text-gray-400 block">Visitas Totales</span>
              <span className="font-bold text-2xl text-blue-400">{(member.visits || []).length}</span>
            </div>
            <div className="bg-gray-900 p-3 rounded">
              <span className="text-sm text-gray-400 block">Teléfono</span>
              <span className="font-semibold">{member.phone}</span>
            </div>
          </div>
        </div>

        {expired && (
          <div className="mt-4 p-4 bg-red-900 border-2 border-red-600 text-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">⚠️</span>
              <strong className="text-lg">Membresía Vencida</strong>
            </div>
            <p className="text-sm">Esta membresía expiró hace {Math.abs(d)} días. Por favor, renovar para continuar usando el gimnasio.</p>
          </div>
        )}

        {/* Renovar dentro del panel */}
        <div className="mt-6 bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="text-sm text-gray-300 mb-3 font-semibold">Renovar Membresía</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Plan</label>
              <select
                value={renewPlan}
                onChange={e => setRenewPlan(e.target.value)}
                className="w-full p-3 rounded-lg bg-gray-900 border-2 border-gray-700 focus:border-potros-red focus:outline-none text-white text-sm"
              >
                {Object.entries(PLANS)
                  .filter(([key]) => key !== 'visita')
                  .map(([key, plan]) => (
                  <option key={key} value={key}>
                    {plan.label} - ${plan.price}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRenewAndClose}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-potros-red hover:bg-red-700 disabled:opacity-60 text-white rounded-lg font-semibold transition-colors"
              >
                {saving ? 'Procesando...' : 'Renovar y cobrar hoy'}
              </button>
            </div>
          </div>
          <div className="text-[11px] text-gray-400 mt-2">Al renovar se registra el pago en ingresos de hoy y una sola entrada para no duplicar visitas.</div>
        </div>

        <div className="mt-6 bg-gray-800 p-4 rounded-lg border border-gray-700 text-center space-y-3">
          <div className="text-sm text-gray-300">Acciones</div>
          <div className="flex flex-col md:flex-row gap-3 justify-center">
            <button onClick={handleRegisterEntry} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold">Registrar Entrada</button>
          </div>
          <div className="text-xs text-gray-400">La renovación arriba cobra hoy y registra una sola entrada.</div>
        </div>

        <div className="mt-6 text-center">
          <button 
            onClick={onClose} 
            className="px-8 py-4 bg-gradient-to-r from-potros-red to-red-700 hover:from-red-700 hover:to-potros-red text-white rounded-lg font-bold text-lg transition-all shadow-lg"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
