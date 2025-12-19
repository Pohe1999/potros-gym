import React, { useState, useMemo } from 'react'
import membersService from '../services/membersService'

export default function QuickVisitPanel({ members = [], quickVisits = [], onChange }) {
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')

  const handleRegisterVisit = async (e) => {
    e.preventDefault()
    setMessage('')

    if (!name.trim()) {
      setMessage('Por favor ingresa un nombre')
      setMessageType('error')
      return
    }

    const existingMember = members.find(m => {
      const full = `${m.firstName || ''} ${m.paterno || ''} ${m.materno || ''}`.toLowerCase().trim()
      return full.includes(name.toLowerCase().trim())
    })

    if (existingMember) {
      // Si existe como socio, registrar la visita en su perfil y el pago
      try {
        await membersService.registerVisit(existingMember.id, { paymentType: 'visita' })
        setMessage(`✅ Visita registrada para ${name} (Socio) - $50 cobrado`)
        setMessageType('success')
        setName('')
        onChange()
        
        setTimeout(() => setMessage(''), 3000)
      } catch (err) {
        setMessage(`Error: ${err.message}`)
        setMessageType('error')
      }
    } else {
      // Si NO existe, registrar como visita rápida con pago + auto entrada
      try {
        await membersService.addQuickVisit({ name: name.trim(), amount: 50 })
        setMessage(`✅ Visita registrada: ${name} - $50 cobrado`)
        setMessageType('success')
        setName('')
        onChange()
        
        setTimeout(() => setMessage(''), 3000)
      } catch (err) {
        setMessage(`Error: ${err.message}`)
        setMessageType('error')
      }
    }
  }

  const todayVisits = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const memberVisits = []
    
    members.forEach(m => {
      (m.visits || []).forEach(v => {
        if (v.at && v.at.startsWith(today)) {
          memberVisits.push({
            ...v,
            name: `${m.firstName || ''} ${m.paterno || ''} ${m.materno || ''}`.trim(),
            type: 'member',
            id: m.id
          })
        }
      })
    })

    const quickVisitRows = quickVisits
      .filter(v => v.at && v.at.startsWith(today))
      .map(v => ({ ...v, type: 'quick' }))

    return [...memberVisits, ...quickVisitRows]
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 15)
  }, [members, quickVisits])

  return (
    <div className="bg-gray-900 -mx-4 md:mx-0 p-3 md:p-8 rounded-none md:rounded-lg card-shadow md:border-2 border-gray-800">
      <div className="text-center mb-6 px-2 md:px-0">
        <h2 className="text-xl md:text-3xl font-bold mb-2 flex items-center justify-center gap-3">
          <span className="text-2xl md:text-4xl">📝</span>
          <span>Registrar Visita</span>
        </h2>
        <p className="text-xs md:text-sm text-gray-400">Para socios y visitantes sin contratación</p>
      </div>

      <form onSubmit={handleRegisterVisit} className="space-y-4 px-1 md:px-0">
        {message && (
          <div className={`p-3 md:p-4 rounded-lg font-semibold text-center text-sm md:text-base ${
            messageType === 'success' 
              ? 'bg-green-900 text-green-200 border border-green-700'
              : messageType === 'warning'
              ? 'bg-yellow-900 text-yellow-200 border border-yellow-700'
              : 'bg-red-900 text-red-200 border border-red-700'
          }`}>
            {message}
          </div>
        )}

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

      {/* Últimas visitas de hoy */}
      <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-gray-700">
        <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">Visitas de Hoy ({todayVisits.length})</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {todayVisits.length === 0 && (
            <div className="text-gray-500 text-center py-4 text-sm">Sin visitas registradas</div>
          )}
          {todayVisits.map((visit) => {
            const time = new Date(visit.at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
            return (
              <div key={visit.id || visit.at} className="flex items-center justify-between p-2 bg-gray-800 rounded text-sm">
                <div className="flex items-center gap-2">
                  <span>{visit.type === 'member' ? '👤' : '🚶'}</span>
                  <span className="text-gray-200">{visit.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-potros-red font-semibold">{time}</span>
                  <span className="text-xs text-gray-500 bg-gray-700 px-2 py-1 rounded">
                    {visit.type === 'member' ? 'Socio' : 'Visitante'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
