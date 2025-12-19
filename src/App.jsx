import { useEffect, useState, useCallback, useMemo } from 'react'
import './App.css'
import Header from './components/Header'
import MemberList from './components/MemberList'
import MemberForm from './components/MemberForm'
import CheckinPanel from './components/CheckinPanel'
import QuickVisitPanel from './components/QuickVisitPanel'
import IncomePanel from './components/IncomePanel'
import membersService from './services/membersService'

function App() {
  const [members, setMembers] = useState([])
  const [quickVisits, setQuickVisits] = useState([])
  const [activeTab, setActiveTab] = useState('checkin') // checkin, quickvisit, members, register

  const load = useCallback(async () => {
    const [memberData, quickVisitData] = await Promise.all([
      membersService.getMembers(),
      membersService.getQuickVisits()
    ])
    setMembers(memberData)
    setQuickVisits(quickVisitData)
  }, [])

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const now = new Date()

    const activeCount = members.filter(m => {
      if (!m.expiry) return false
      const exp = new Date(m.expiry + 'T23:59:59')
      return now <= exp
    }).length

    const memberVisits = members.reduce((sum, m) => sum + (m.visits || []).filter(v => v.at?.startsWith(today)).length, 0)
    const quickToday = quickVisits.filter(v => v.at?.startsWith(today)).length

    return {
      activeCount,
      totalVisitsToday: memberVisits + quickToday,
      total: members.length,
      inactive: members.length - activeCount
    }
  }, [members, quickVisits])

  useEffect(() => {
    load().catch(err => console.error(err))
  }, [load])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-potros-black to-gray-900">
      <Header members={members} />
      
      {/* Tabs de navegación */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="container-max flex flex-col gap-3 py-2">
          <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:gap-2">
            <button 
              onClick={() => setActiveTab('checkin')} 
              className={`px-4 py-3 md:px-6 md:py-3 rounded-lg font-semibold text-sm md:text-base transition-all text-center ${
                activeTab === 'checkin' 
                  ? 'bg-potros-red text-white' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              👋 Registro de Entrada
            </button>
            <button 
              onClick={() => setActiveTab('members')} 
              className={`px-4 py-3 md:px-6 md:py-3 rounded-lg font-semibold text-sm md:text-base transition-all text-center ${
                activeTab === 'members' 
                  ? 'bg-potros-red text-white' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              📊 Lista de Socios
            </button>
            <button 
              onClick={() => setActiveTab('quickvisit')} 
              className={`px-4 py-3 md:px-6 md:py-3 rounded-lg font-semibold text-sm md:text-base transition-all text-center ${
                activeTab === 'quickvisit' 
                  ? 'bg-potros-red text-white' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              📝 Registrar Visita
            </button>
            <button 
              onClick={() => setActiveTab('register')} 
              className={`px-4 py-3 md:px-6 md:py-3 rounded-lg font-semibold text-sm md:text-base transition-all text-center ${
                activeTab === 'register' 
                  ? 'bg-potros-red text-white' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              ➕ Nuevo Socio
            </button>
          </div>

          {/* Fila de números para móvil debajo de los botones */}
          <div className="grid grid-cols-4 gap-2 md:hidden text-center text-[11px] text-gray-300">
            <div className="bg-gray-800 rounded-lg py-1">
              <div className="text-base font-bold text-potros-red">{stats.total}</div>
              <div>Total</div>
            </div>
            <div className="bg-gray-800 rounded-lg py-1">
              <div className="text-base font-bold text-green-400">{stats.activeCount}</div>
              <div>Activos</div>
            </div>
            <div className="bg-gray-800 rounded-lg py-1">
              <div className="text-base font-bold text-yellow-400">{stats.inactive}</div>
              <div>Inactivos</div>
            </div>
            <div className="bg-gray-800 rounded-lg py-1">
              <div className="text-base font-bold text-blue-400">{stats.totalVisitsToday}</div>
              <div>Entradas</div>
            </div>
          </div>
        </div>
      </div>

      <main className="container-max py-6">
        {activeTab === 'checkin' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <CheckinPanel members={members} quickVisits={quickVisits} onChange={load} />
            </div>
            <div>
              <IncomePanel members={members} quickVisits={quickVisits} />
            </div>
          </div>
        )}

        {activeTab === 'quickvisit' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <QuickVisitPanel members={members} quickVisits={quickVisits} onChange={() => { load(); setActiveTab('checkin') }} />
            </div>
            <div>
              <IncomePanel members={members} quickVisits={quickVisits} />
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <MemberList members={members} onChange={load} />
            </div>
            <div>
              <IncomePanel members={members} quickVisits={quickVisits} />
            </div>
          </div>
        )}

        {activeTab === 'register' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <MemberForm onSave={() => { load(); setActiveTab('checkin'); }} />
            </div>
            <div>
              <IncomePanel members={members} quickVisits={quickVisits} />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
