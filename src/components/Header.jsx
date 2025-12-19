import React, { useMemo } from 'react'
import SidebarCounters from './SidebarCounters'

export default function Header({ members = [] }) {
  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const now = new Date()

    const activeCount = members.filter(m => {
      if (!m.expiry) return false
      const exp = new Date(m.expiry + 'T23:59:59')
      return now <= exp
    }).length

    const totalVisitsToday = members.reduce((sum, m) => {
      const todayVisits = (m.visits || []).filter(v => v.at.startsWith(today)).length
      return sum + todayVisits
    }, 0)

    const todayDate = now.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }).charAt(0).toUpperCase() + now.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }).slice(1)

    return { activeCount, totalVisitsToday, todayDate }
  }, [members])

  return (
    <header className="bg-potros-black border-b-2 border-potros-red shadow-lg">
      <div className="container-max flex items-start py-4 gap-4">
        <div className="flex-1 flex items-center space-x-4">
          <img src="/logo.png" alt="POTROS GYM" className="h-24 w-24 md:h-28 md:w-28 object-contain drop-shadow-lg" />
          <div>
            <h1 className="text-3xl md:text-5xl font-bold text-white">Potros GYM</h1>
            <p className="text-xs md:text-sm text-gray-400">{stats.todayDate}</p>
          </div>
        </div>
        {/* Desktop / tablet: vertical sidebar counters */}
        <SidebarCounters members={members} stats={stats} />
      </div>
    </header>
  )
}
