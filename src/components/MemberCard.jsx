import React, { useState } from 'react'
import membersService from '../services/membersService'
import RenewModal from './RenewModal'

function daysUntil(dateISO) {
  const now = new Date()
  const d = new Date(dateISO)
  const diff = Math.ceil((d - now) / (1000*60*60*24))
  return diff
}

export default function MemberCard({ member, onChange }) {
  const [showRenewModal, setShowRenewModal] = useState(false)
  const planInfo = membersService.getPlanInfo(member.planType) || { label: member.planType }
  const d = member.expiry ? daysUntil(member.expiry) : null
  const expired = d !== null ? d < 0 : false
  const fullName = `${member.firstName || member.name || ''} ${member.paterno || ''} ${member.materno || ''}`.trim()

  const remove = async () => {
    if (!confirm('Eliminar socio?')) return
    await membersService.deleteMember(member.id)
    onChange()
  }

  return (
    <>
      <div className="bg-gray-900 p-4 md:p-5 rounded-lg card-shadow border-2 border-gray-800 hover:border-gray-700 transition-all">
        <div className="flex flex-col md:flex-row items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-bold text-xl">{fullName}</h3>
              {expired ? (
                <span className="px-3 py-1 bg-red-900 text-red-200 text-xs font-semibold rounded-full">❌ VENCIDA</span>
              ) : member.planType === 'visita' ? (
                <span className="px-3 py-1 bg-yellow-900 text-yellow-200 text-xs font-semibold rounded-full">🎫 VISITA</span>
              ) : (
                <span className="px-3 py-1 bg-green-900 text-green-200 text-xs font-semibold rounded-full">✅ ACTIVA</span>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
              <span className="flex items-center gap-1">
                <span>📧</span> {member.email || 'Sin email'}
              </span>
              <span className="flex items-center gap-1">
                <span>📞</span> {member.phone}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-800 p-3 rounded">
              <div>
                <div className="text-xs text-gray-500 uppercase">Plan</div>
                <div className="font-semibold">{planInfo.label || member.planType}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase">Precio</div>
                <div className="font-semibold text-potros-red">${member.price}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase">Ingreso</div>
                <div className="font-semibold">{member.joinDate}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase">Vencimiento</div>
                {member.planType === 'visita' ? (
                  <div className="text-sm text-yellow-300">Día único</div>
                ) : (
                  <div className={`font-semibold ${expired ? 'text-red-400' : 'text-green-300'}`}>
                    {member.expiry} {d !== null && !expired ? `(${d}d)` : ''}
                  </div>
                )}
              </div>
            </div>
            {member.visits && member.visits.length > 0 && (
              <div className="mt-2 text-xs text-gray-500">
                📊 {member.visits.length} visita{member.visits.length !== 1 ? 's' : ''} registrada{member.visits.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
          <div className="flex flex-row md:flex-col gap-2 md:ml-4 mt-3 md:mt-0">
            <button 
              onClick={() => setShowRenewModal(true)} 
              className="px-4 py-2 bg-potros-red text-white rounded hover:bg-red-700 transition-colors font-semibold"
            >
              🔄 Renovar
            </button>
            <button 
              onClick={remove} 
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
            >
              🗑️ Eliminar
            </button>
          </div>
        </div>
      </div>
      {showRenewModal && (
        <RenewModal member={member} onClose={() => setShowRenewModal(false)} onSave={onChange} />
      )}
    </>
  )
}
