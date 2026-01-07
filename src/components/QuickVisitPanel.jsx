import React, { useState } from 'react'
import membersService from '../services/membersService'

export default function QuickVisitPanel({ members = [], quickVisits = [], onChange, onShowToast }) {
  const [name, setName] = useState('')

  const handleRegisterVisit = async (e) => {
    e.preventDefault()

    if (!name.trim()) {
      if (onShowToast) onShowToast('Por favor ingresa un nombre', 'error')
      return
    }

    const existingMember = members.find(m => {
      const full = `${m.firstName || ''} ${m.paterno || ''} ${m.materno || ''}`.toLowerCase().trim()
      return full === name.toLowerCase().trim()
    })

    if (existingMember) {
      // No registrar pagos como visita para socios. Indicar usar Registro de Entrada.
      if (onShowToast) {
        onShowToast(`El nombre corresponde a un socio registrado (${existingMember.firstName}). Usa 'Registro de Entrada' para anotar su entrada.`, 'warning')
      }
      return
    }

    // NO es socio: registrar visita rápida (pase diario de $50)
    try {
      await membersService.addQuickVisit({ name: name.trim(), amount: 50 })
      if (onShowToast) {
        onShowToast(`Visita registrada: ${name.trim()} - $50 cobrado`, 'success')
      }
      setName('')
      onChange()
    } catch (err) {
      if (onShowToast) onShowToast(`Error: ${err.message}`, 'error')
    }
  }

  return (
    <div className="bg-gray-900 -mx-4 md:mx-0 p-3 md:p-8 rounded-none md:rounded-lg card-shadow md:border-2 border-gray-800">
      <div className="text-center mb-6 px-2 md:px-0">
        <h2 className="text-xl md:text-3xl font-bold mb-2 flex items-center justify-center gap-3">
          <span className="text-2xl md:text-4xl">📝</span>
          <span>Registrar Visita</span>
        </h2>
        <p className="text-xs md:text-sm text-gray-400">Pase diario $50 para visitantes (no socios).</p>
      </div>

      <form onSubmit={handleRegisterVisit} className="space-y-4 px-1 md:px-0">
        <div>
          <label className="block text-xs md:text-sm font-semibold text-gray-300 mb-2">
            Nombre *
          </label>
          <input
            type="text"
            placeholder="Ej: Carlos Mendoza"
            className="w-full p-3 md:p-4 rounded-lg bg-gray-800 border-2 border-gray-700 focus:border-potros-red focus:outline-none text-sm md:text-lg text-white placeholder-gray-500 transition-colors"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
        </div>

        <button
          type="submit"
          className="w-full bg-potros-red hover:bg-red-700 p-3 md:p-4 rounded-lg font-bold text-white text-base md:text-lg transition-colors transform hover:scale-105 active:scale-95"
        >
          ✅ Registrar Visita
        </button>
      </form>
    </div>
  )
}
