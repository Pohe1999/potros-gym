import React from 'react'

export default function SidebarCounters({ members = [], stats = {} }) {
  return (
    <aside className="hidden md:flex flex-col items-center bg-gray-900 p-3 rounded-lg border-l-2 border-gray-800 ml-4">
      <div className="w-40 space-y-3">
        <div className="text-center">
          <div className="text-xl font-bold text-potros-red">{members.length}</div>
          <div className="text-xs text-gray-400">Total</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-green-400">{stats.activeCount}</div>
          <div className="text-xs text-gray-400">Activos</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-yellow-400">{members.length - (stats.activeCount || 0)}</div>
          <div className="text-xs text-gray-400">Inactivos</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-blue-400">{stats.totalVisitsToday}</div>
          <div className="text-xs text-gray-400">Entradas Hoy</div>
        </div>
      </div>
    </aside>
  )
}
