import { useEffect, useState, useCallback, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import './App.css'
import Sidebar from './components/Sidebar'
import CheckinPanel from './components/CheckinPanel'
import MemberList from './components/MemberList'
import MemberForm from './components/MemberForm'
import QuickVisitPanel from './components/QuickVisitPanel'
import IncomePanel from './components/IncomePanel'
import Toast from './components/Toast'
import CustomCursor from './components/CustomCursor'
import membersService from './services/membersService'

const pageVariants = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -12, transition: { duration: 0.18 } },
}

function App() {
  const [members, setMembers]         = useState([])
  const [quickVisits, setQuickVisits] = useState([])
  const [activeTab, setActiveTab]     = useState('checkin')
  const [toast, setToast]             = useState(null)

  const showToast = (message, type = 'success') => setToast({ message, type })
  const dismissToast = () => setToast(null)

  const load = useCallback(async () => {
    const [memberData, quickVisitData] = await Promise.all([
      membersService.getMembers(),
      membersService.getQuickVisits(),
    ])
    setMembers(memberData)
    setQuickVisits(quickVisitData)
  }, [])

  const stats = useMemo(() => {
    const today = membersService.getTodayLocal()
    const now   = new Date()

    const activeCount = members.filter(m => {
      if (!m.expiry) return false
      return now <= new Date(m.expiry + 'T23:59:59')
    }).length

    // Entradas de socios hoy — excluir auto-creadas al registrar nuevo socio
    const memberVisits = members.reduce(
      (sum, m) => sum + (m.visits || []).filter(v =>
        v.at?.startsWith(today) && v.method !== 'new-member'
      ).length, 0
    )
    // Visitas rápidas hoy — todas (entrada = presencia, no depende de pago)
    const quickToday = quickVisits.filter(v => v.at?.startsWith(today)).length

    return {
      activeCount,
      memberVisitsToday: memberVisits,
      quickVisitsToday:  quickToday,
      totalVisitsToday:  memberVisits + quickToday,
      total:   members.length,
      inactive: members.length - activeCount,
    }
  }, [members, quickVisits])

  useEffect(() => { load().catch(console.error) }, [load])

  const pages = {
    checkin: (
      <CheckinPanel
        members={members} quickVisits={quickVisits}
        onChange={load} onNavigate={setActiveTab}
        onShowToast={showToast}
      />
    ),
    members: (
      <MemberList members={members} onChange={load} onShowToast={showToast} />
    ),
    quickvisit: (
      <QuickVisitPanel
        members={members} quickVisits={quickVisits}
        onChange={() => { load(); setActiveTab('checkin') }} onShowToast={showToast}
      />
    ),
    register: (
      <MemberForm onSave={() => { load(); setActiveTab('checkin') }} onShowToast={showToast} />
    ),
    income: (
      <IncomePanel members={members} quickVisits={quickVisits} />
    ),
  }

  return (
    <div className="flex h-screen overflow-hidden bg-potros-black font-sans">
      <CustomCursor />
      {/* Sidebar desktop */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} stats={stats} />

      {/* Área principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* TopBar móvil */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/5 bg-potros-surface/80 backdrop-blur-xl flex-shrink-0">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="POTROS GYM" className="h-9 w-9 object-contain" />
            <div>
              <span className="font-bold text-base text-white">Potros GYM</span>
              <span className="ml-2 text-[10px] text-white/40 font-mono bg-white/5 px-1.5 py-0.5 rounded">v3.0.0</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/50">
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
              {stats.activeCount} activos
            </span>
          </div>
        </header>

        {/* Contenido principal — scrollable */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto w-full"
            >
              {pages[activeTab]}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom Nav móvil */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-potros-surface/95 backdrop-blur-xl border-t border-white/[0.07]">
          <div className="flex items-stretch">
            {[
              { id: 'checkin',    emoji: '👋', label: 'Entrada' },
              { id: 'members',    emoji: '👥', label: 'Socios' },
              { id: 'quickvisit', emoji: '⚡', label: 'Visita' },
              { id: 'register',   emoji: '➕', label: 'Nuevo' },
              { id: 'income',     emoji: '💰', label: 'Ingresos' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-all ${
                  activeTab === tab.id
                    ? 'text-potros-red'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                <span className="text-lg leading-none">{tab.emoji}</span>
                <span className={`text-[10px] font-semibold ${activeTab === tab.id ? 'text-potros-red' : ''}`}>
                  {tab.label}
                </span>
                {activeTab === tab.id && (
                  <motion.div layoutId="bottomIndicator" className="absolute bottom-0 h-0.5 w-8 bg-potros-red rounded-full" />
                )}
              </button>
            ))}
          </div>
        </nav>
      </div>

      <AnimatePresence>
        {toast && (
          <Toast key={toast.message + toast.type} message={toast.message} type={toast.type} onDismiss={dismissToast} />
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
