import React, { useMemo } from 'react'
import membersService from '../services/membersService'
import SidebarCounters from './SidebarCounters'

export default function Header({ members = [] }) {
  const stats = useMemo(() => {
    const today = membersService.getTodayLocal()
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
      <div className="container-max flex items-center justify-between py-2 md:py-4 gap-2 md:gap-4">
        <div className="flex-1 flex items-center space-x-2 md:space-x-4">
          <img src="/logo.png" alt="POTROS GYM" className="h-16 w-16 md:h-24 md:w-24 lg:h-28 lg:w-28 object-contain drop-shadow-lg" />
          <div>
            <div className="flex items-center gap-2 md:gap-3">
              <h1 className="text-xl md:text-3xl lg:text-5xl font-bold text-white">Potros GYM</h1>
              <span className="text-[10px] md:text-xs text-white font-mono bg-gray-800 px-1.5 py-0.5 md:px-2 md:py-1 rounded border border-gray-700">v2.0.0</span>
            </div>
            <p className="text-[10px] md:text-xs lg:text-sm text-gray-400">{stats.todayDate}</p>
          </div>
        </div>
        {/* Desktop / tablet: vertical sidebar counters */}
        <SidebarCounters members={members} stats={stats} />
      </div>
    </header>
  )
}
