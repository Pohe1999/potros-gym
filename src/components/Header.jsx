import React, { useMemo } from 'react'

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
      <div className="container-max flex flex-col md:flex-row items-center md:justify-between py-4 gap-4">
        <div className="flex items-center space-x-4">
          <img src="/logo.png" alt="POTROS GYM" className="h-16 w-16 md:h-24 md:w-24 object-contain drop-shadow-lg" />
          <div className="text-center md:text-left">
            <h1 className="text-2xl md:text-4xl font-bold text-white">Potros GYM</h1>
            <p className="text-xs md:text-sm text-gray-400">{stats.todayDate}</p>
          </div>
        </div>
        <div className="flex gap-4 md:gap-6 flex-wrap justify-center md:justify-end">
          <div className="text-center">
            <div className="text-xl md:text-2xl font-bold text-potros-red">{members.length}</div>
            <div className="text-xs text-gray-400">Total</div>
          </div>
          <div className="text-center">
            <div className="text-xl md:text-2xl font-bold text-green-400">{stats.activeCount}</div>
            <div className="text-xs text-gray-400">Activos</div>
          </div>
          <div className="text-center">
            <div className="text-xl md:text-2xl font-bold text-yellow-400">{members.length - stats.activeCount}</div>
            <div className="text-xs text-gray-400">Inactivos</div>
          </div>
          <div className="text-center">
            <div className="text-xl md:text-2xl font-bold text-blue-400">{stats.totalVisitsToday}</div>
            <div className="text-xs text-gray-400">Entradas Hoy</div>
          </div>
        </div>
      </div>
    </header>
  )
}
