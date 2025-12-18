import { useEffect, useState, useCallback } from 'react'
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

  useEffect(() => {
    load().catch(err => console.error(err))
  }, [load])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-potros-black to-gray-900">
      <Header members={members} />
      
      {/* Tabs de navegación */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="container-max flex gap-2 py-2 justify-between items-center">
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab('checkin')} 
              className={`px-6 py-3 rounded-t font-semibold transition-all ${
                activeTab === 'checkin' 
                  ? 'bg-potros-red text-white' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              👋 Registro de Entrada
            </button>
            <button 
              onClick={() => setActiveTab('members')} 
              className={`px-6 py-3 rounded-t font-semibold transition-all ${
                activeTab === 'members' 
                  ? 'bg-potros-red text-white' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              📊 Lista de Socios
            </button>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab('quickvisit')} 
              className={`px-6 py-3 rounded-t font-semibold transition-all ${
                activeTab === 'quickvisit' 
                  ? 'bg-potros-red text-white' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              📝 Registrar Visita
            </button>
            <button 
              onClick={() => setActiveTab('register')} 
              className={`px-6 py-3 rounded-t font-semibold transition-all ${
                activeTab === 'register' 
                  ? 'bg-potros-red text-white' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              ➕ Nuevo Socio
            </button>
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
