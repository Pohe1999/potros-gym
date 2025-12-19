import React, { useMemo, useState } from 'react'
import MemberCard from './MemberCard'

export default function MemberList({ members = [], onChange }) {
  const [q, setQ] = useState('')

  const list = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return members
    return members.filter(m => (m.name || '').toLowerCase().includes(term) || (m.email || '').toLowerCase().includes(term) || (m.phone || '').toLowerCase().includes(term))
  }, [members, q])

  return (
    <div className="space-y-4">
      <div className="bg-gray-900 p-4 rounded-lg border-2 border-gray-800">
        <div className="flex flex-col md:flex-row items-center justify-between mb-3 gap-3">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <span>👥</span> Lista de Socios
          </h2>
          <div className="bg-potros-red px-4 py-2 rounded-full font-bold">{members.length} total</div>
        </div>
        <input 
          className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-potros-red focus:outline-none transition-all" 
          placeholder="🔍 Buscar por nombre, email o teléfono..." 
          value={q} 
          onChange={e=>setQ(e.target.value)} 
        />
      </div>

      <div className="space-y-3">
        {list.length === 0 && q.trim() && (
          <div className="bg-gray-900 p-8 rounded-lg text-center border-2 border-dashed border-gray-700">
            <div className="text-4xl mb-2">🔍</div>
            <div className="text-gray-400">No se encontraron socios con "{q}"</div>
          </div>
        )}
        {list.length === 0 && !q.trim() && (
          <div className="bg-gray-900 p-8 rounded-lg text-center border-2 border-dashed border-gray-700">
            <div className="text-4xl mb-2">👥</div>
            <div className="text-gray-400">No hay socios registrados aún</div>
          </div>
        )}
        {list.map(m => (
          <MemberCard key={m.id} member={m} onChange={onChange} />
        ))}
      </div>
    </div>
  )
}
