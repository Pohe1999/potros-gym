import React, { useState, useEffect } from 'react'
import membersService, { PLANS } from '../services/membersService'

function daysUntil(dateISO) {
  const now = new Date()
  const d = new Date(dateISO)
  const diff = Math.ceil((d - now) / (1000*60*60*24))
  return diff
}

export default function MemberStatusModal({ member, onClose, onChange = () => {}, onPaymentDone = () => {} }) {
  const [paymentType, setPaymentType] = useState('')

  const planInfo = membersService.getPlanInfo(member.planType) || { label: member.planType, price: 0 }
  const d = member.expiry ? daysUntil(member.expiry) : null
  const expired = d !== null ? d < 0 : false
  const fullName = `${member.firstName || member.name || ''} ${member.paterno || ''} ${member.materno || ''}`.trim()

  const handlePayment = async () => {
    if (!paymentType) return
    await membersService.registerPayment(member.id, { type: paymentType })
    onChange()
    onPaymentDone(true) // Signal that payment was done
    onClose()
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
              <span className="font-semibold">{member.joinDate}</span>
            </div>
            {member.planType !== 'visita' && (
              <div className="bg-gray-900 p-3 rounded">
                <span className="text-sm text-gray-400 block">Vencimiento</span>
                <span className="font-semibold">{member.expiry}</span>
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

        <div className="mt-6 bg-gray-800 p-4 rounded-lg border border-gray-700">
          <label className="block text-sm font-semibold text-gray-300 mb-3">💳 Registrar pago (opcional)</label>
          <div className="flex gap-3">
            <select 
              className="flex-1 p-3 rounded-lg bg-gray-900 border border-gray-700 focus:border-potros-red focus:outline-none transition-all" 
              value={paymentType} 
              onChange={e=>setPaymentType(e.target.value)}
            >
              <option value="">Seleccionar tipo de pago...</option>
              <option value="visita">Visita — ${PLANS['visita'].price}</option>
              <option value="semana">1 Semana — ${PLANS['semana'].price}</option>
              <option value="15dias">15 Días — ${PLANS['15dias'].price}</option>
              <option value="mensualPromo">Mensual Promo Dic — ${PLANS['mensualPromo'].price}</option>
              <option value="mensual">Mensual — ${PLANS['mensual'].price}</option>
              <option value="anual">Anual — ${PLANS['anual'].price}</option>
            </select>
            {paymentType && (
              <button 
                onClick={handlePayment} 
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
              >
                ✅ Registrar ${PLANS[paymentType]?.price}
              </button>
            )}
          </div>
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
