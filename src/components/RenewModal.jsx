import React, { useState } from 'react'
import membersService from '../services/membersService'

export default function RenewModal({ member, onClose, onSave }) {
  const [planType, setPlanType] = useState('mensual')
  const [recordPayment, setRecordPayment] = useState(false)

  const planInfo = membersService.PLANS[planType] || { price: 0, label: 'Mensual' }
  const newExpiry = membersService.computeExpiry(new Date().toISOString().slice(0, 10), planType)

  const handleRenew = async () => {
    const updates = { 
      planType, 
      price: planInfo.price,
      expiry: newExpiry 
    }

    await membersService.updateMember(member.id, updates)

    if (recordPayment) {
      await membersService.registerPayment(member.id, { type: planType })
    }

    onSave()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 animate-fadeIn" onClick={onClose}>
      <div className="bg-gray-900 p-8 rounded-xl card-shadow max-w-md w-full border-2 border-potros-red animate-scaleIn" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-potros-red mb-6">🔄 Renovar Membresía</h2>
        
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-300 mb-3">Plan</label>
          <select
            value={planType}
            onChange={e => setPlanType(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-800 border-2 border-gray-700 focus:border-potros-red focus:outline-none text-white"
          >
            {Object.entries(membersService.PLANS).map(([key, plan]) => (
              <option key={key} value={key}>
                {plan.label} - ${plan.price}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6 p-3 bg-gray-800 rounded-lg">
          <div className="text-sm text-gray-400 mb-1">Vence el:</div>
          <div className="text-lg font-bold text-potros-red">{membersService.formatSpanishDate(newExpiry)}</div>
        </div>

        <div className="mb-6 flex items-center gap-3">
          <input
            type="checkbox"
            id="recordPayment"
            checked={recordPayment}
            onChange={e => setRecordPayment(e.target.checked)}
            className="w-5 h-5 cursor-pointer"
          />
          <label htmlFor="recordPayment" className="text-sm text-gray-300 cursor-pointer">
            Registrar pago (${planInfo.price})
          </label>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-800 hover:bg-gray-700 p-3 rounded-lg font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleRenew}
            className="flex-1 bg-potros-red hover:bg-red-700 p-3 rounded-lg font-semibold transition-colors text-white"
          >
            Renovar
          </button>
        </div>
      </div>
    </div>
  )
}
