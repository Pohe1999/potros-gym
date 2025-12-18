import React, { useState, useMemo } from 'react'
import { PLANS } from '../services/membersService'
import membersService from '../services/membersService'
import MemberStatusModal from './MemberStatusModal'

export default function CheckinPanel({ members = [], quickVisits = [], onChange }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [selectedMember, setSelectedMember] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [paymentDone, setPaymentDone] = useState(false)

  const handleSearch = (value) => {
    setSearchQuery(value)
    if (value.trim().length > 1) {
      const term = value.toLowerCase().trim()
      const results = members.filter(m => {
        const full = `${m.firstName || m.name || ''} ${m.paterno || ''} ${m.materno || ''} ${m.phone || ''}`.toLowerCase()
        return full.includes(term)
      }).slice(0, 10)
      setSuggestions(results)
    } else {
      setSuggestions([])
    }
  }

  const handleSelect = (member) => {
    setSelectedMember(member)
    setShowModal(true)
    setPaymentDone(false)
    setSearchQuery('')
    setSuggestions([])
  }

  const handleCloseModal = async () => {
    // Only register visit if NO payment was done (payment includes visit registration)
    if (selectedMember && !paymentDone && showModal) {
      await membersService.registerVisit(selectedMember.id, { method: 'manual' })
    }
    setShowModal(false)
    setSelectedMember(null)
    setPaymentDone(false)
    onChange()
  }

  // Obtener últimas visitas de hoy
  const todayVisits = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const visits = []
    members.forEach(m => {
      (m.visits || []).forEach(v => {
        if (v.at && v.at.startsWith(today)) {
          visits.push({
            ...v,
            member: m,
            fullName: `${m.firstName || m.name} ${m.paterno || ''} ${m.materno || ''}`.trim()
          })
        }
      })
    })

    quickVisits
      .filter(v => v.at && v.at.startsWith(today))
      .forEach(v => {
        visits.push({
          ...v,
          member: { planType: 'visita', expiry: null, phone: '' },
          fullName: v.name || 'Visitante',
          at: v.at
        })
      })

    return visits.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 10)
  }, [members, quickVisits])

  return (
    <>
      <div className="bg-gray-900 p-8 rounded-lg card-shadow border-2 border-gray-800">
        <div className="text-center mb-6">
          <img src="/logo.png" alt="POTROS GYM" className="h-16 w-16 object-contain mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-2 flex items-center justify-center gap-3">
            <span className="text-4xl">👋</span>
            <span>Registro de Entrada</span>
          </h2>
          <p className="text-gray-400">Busca al socio por nombre o teléfono</p>
        </div>
        
        <div className="relative">
          <input 
            type="text"
            placeholder="Escribe el nombre del socio..."
            className="w-full p-5 rounded-lg bg-gray-800 text-2xl text-center border-2 border-gray-700 focus:border-potros-red focus:outline-none transition-all"
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            autoComplete="off"
            autoFocus
          />
          {suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-2 bg-gray-800 rounded-lg shadow-2xl max-h-96 overflow-y-auto border-2 border-gray-700">
              {suggestions.map(m => {
                const fullName = `${m.firstName || m.name} ${m.paterno} ${m.materno}`.trim()
                const isExpired = m.expiry && new Date(m.expiry + 'T23:59:59') < new Date()
                return (
                  <div 
                    key={m.id} 
                    className="p-4 hover:bg-gray-700 cursor-pointer border-b border-gray-700 transition-colors"
                    onClick={() => handleSelect(m)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-lg">{fullName}</div>
                        <div className="text-sm text-gray-400">📞 {m.phone}</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xs font-semibold px-3 py-1 rounded-full ${
                          isExpired ? 'bg-red-900 text-red-200' : 'bg-green-900 text-green-200'
                        }`}>
                          {isExpired ? '❌ Vencida' : '✅ Activa'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{PLANS[m.planType]?.label}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        
        {suggestions.length === 0 && searchQuery.length > 2 && (
          <div className="mt-4 p-4 bg-yellow-900 text-yellow-200 rounded text-center">
            ⚠️ No se encontró ningún socio con ese nombre
          </div>
        )}
      </div>

      {/* Historial de entradas de hoy */}
      {todayVisits.length > 0 && (
        <div className="bg-gray-900 p-6 rounded-lg card-shadow border border-gray-800 mt-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>📋</span> Entradas de Hoy ({todayVisits.length})
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {todayVisits.map((visit, idx) => {
              const time = new Date(visit.at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
              const isExpired = visit.member.expiry && new Date(visit.member.expiry + 'T23:59:59') < new Date()
              return (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-800 rounded hover:bg-gray-750 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{isExpired ? '⚠️' : '✅'}</div>
                    <div>
                      <div className="font-semibold">{visit.fullName}</div>
                      <div className="text-xs text-gray-500">{visit.member.phone}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-potros-red">{time}</div>
                    <div className="text-xs text-gray-500">{PLANS[visit.member.planType]?.label || visit.member.planType}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {showModal && selectedMember && (
        <MemberStatusModal 
          member={selectedMember} 
          onClose={handleCloseModal} 
          onChange={onChange} 
          onPaymentDone={(done) => setPaymentDone(done)}
        />
      )}
    </>
  )
}
