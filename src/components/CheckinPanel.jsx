import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Clock, CheckCircle2, XCircle, Zap,
  ChevronRight, UserPlus, UserCheck, Users, AlertTriangle
} from 'lucide-react'
import { PLANS } from '../services/membersService'
import membersService from '../services/membersService'
import MemberStatusModal from './MemberStatusModal'
import ClockDisplay from './ClockDisplay'

export default function CheckinPanel({
  members = [], quickVisits = [], onChange,
  onNavigate = () => {}, onShowToast,
}) {
  const navigate = onNavigate

  const [searchQuery,    setSearchQuery]    = useState('')
  const [suggestions,    setSuggestions]    = useState([])
  const [selectedMember, setSelectedMember] = useState(null)
  const [showModal,      setShowModal]      = useState(false)
  const [paymentDone,    setPaymentDone]    = useState(false)
  const [closingModal,   setClosingModal]   = useState(false)

  const handleSearch = (value) => {
    setSearchQuery(value)
    if (value.trim().length > 1) {
      const term = value.toLowerCase().trim()
      const results = members.filter(m => {
        const full = `${m.firstName || m.name || ''} ${m.paterno || ''} ${m.materno || ''} ${m.phone || ''}`.toLowerCase()
        return full.includes(term)
      }).slice(0, 8)
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
    if (closingModal) return
    setClosingModal(true)
    if (selectedMember && !paymentDone && showModal) {
      try {
        // La lógica de dedup está en el backend — solo enviamos la petición
        await membersService.registerVisit(selectedMember.id, { method: 'manual' })
        if (onShowToast) {
          const fullName = `${selectedMember.firstName} ${selectedMember.paterno}`.trim()
          onShowToast(`Entrada registrada: ${fullName}`, 'success')
        }
      } catch (err) {
        if (onShowToast) onShowToast(`Error registrando entrada: ${err.message}`, 'error')
      }
    }
    setShowModal(false)
    setSelectedMember(null)
    setPaymentDone(false)
    await Promise.resolve(onChange())
    setClosingModal(false)
  }

  const isExpiredFn = (m) => m.expiry && new Date(m.expiry + 'T23:59:59') < new Date()

  // Sin slice — mostrar TODAS las entradas de hoy con conteo real
  const todayVisits = useMemo(() => {
    const today = membersService.getTodayLocal()
    const visits = []

    members.forEach(m => {
      ;(m.visits || []).forEach(v => {
        // Excluir auto-registros de nuevos socios del log de entradas de hoy
        if (v.at && v.at.startsWith(today) && v.method !== 'new-member') {
          visits.push({
            ...v,
            member: m,
            fullName: `${m.firstName || m.name} ${m.paterno || ''} ${m.materno || ''}`.trim(),
            isExpired: m.expiry && new Date(m.expiry + 'T23:59:59') < new Date(),
            isQuick: false,
          })
        }
      })
    })

    quickVisits
      .filter(v => v.at && v.at.startsWith(today))
      .forEach(v => {
        visits.push({
          ...v,
          member: { planType: 'visita', expiry: null },
          fullName: v.name || 'Visitante',
          at: v.at,
          isExpired: false,
          isQuick: true,
        })
      })

    return visits.sort((a, b) => (b.at || '').localeCompare(a.at || ''))
    // SIN slice — el scroll maneja la lista larga
  }, [members, quickVisits])

  // Desglose real para el header
  const memberCount  = todayVisits.filter(v => !v.isQuick).length
  const quickCount   = todayVisits.filter(v => v.isQuick).length
  const expiredCount = todayVisits.filter(v => !v.isQuick && v.isExpired).length

  return (
    <>
      <div className="space-y-4">

        {/* ── Buscador principal ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-30 overflow-visible rounded-2xl border border-white/[0.08]"
          style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(214,40,40,0.08)' }}
        >
          {/* Fondo con glow rojo sutil */}
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, rgba(214,40,40,0.06) 0%, rgba(10,13,22,0.98) 50%, rgba(10,13,22,0.98) 100%)' }} />
          {/* Borde top rojo */}
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(214,40,40,0.8), transparent)' }} />

          {/* Reloj estratégico: visible y discreto en esquina superior */}
          <div className="hidden lg:block absolute top-4 right-4 z-20 w-[250px]">
            <ClockDisplay compact />
          </div>

          <div className="relative p-5 md:p-7">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="relative mb-3">
                <div className="absolute inset-0 rounded-full blur-2xl"
                  style={{ background: 'rgba(214,40,40,0.3)', transform: 'scale(1.5)' }} />
                <img src="/logo.png" alt="POTROS GYM" className="relative h-14 w-14 object-contain drop-shadow-2xl" />
              </div>
              <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
                Registro de Entrada
              </h2>
              <p className="text-xs text-white/40 mt-0.5">Busca por nombre o teléfono</p>
            </div>

            <div className="relative max-w-xl mx-auto">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search size={17} className="text-white/55" />
              </div>
              <input
                type="text"
                placeholder="Nombre o teléfono del socio..."
                className="w-full pl-11 pr-5 py-3.5 rounded-xl text-sm bg-black/40 border border-white/10 focus:border-potros-red/70 focus:outline-none focus:ring-2 focus:ring-potros-red/20 text-white placeholder-white/20 transition-all"
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                autoComplete="off"
                autoFocus
              />

              <AnimatePresence>
                {suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    className="absolute z-[100] w-full mt-2 rounded-xl overflow-hidden"
                    style={{ background: '#08090f', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 64px rgba(0,0,0,0.8)' }}
                  >
                    {suggestions.map((m, idx) => {
                      const fullName = `${m.firstName || m.name} ${m.paterno} ${m.materno}`.trim()
                      const expired  = isExpiredFn(m)
                      const d = m.expiry && !expired
                        ? Math.ceil((new Date(m.expiry + 'T23:59:59') - new Date()) / (1000 * 60 * 60 * 24))
                        : null
                      return (
                        <motion.div
                          key={m.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0, transition: { delay: idx * 0.04 } }}
                          onClick={() => handleSelect(m)}
                          className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/[0.05] border-b border-white/[0.04] last:border-0 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0 ${
                              expired ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                            }`}>
                              {(m.firstName || '?')[0]}
                            </div>
                            <div>
                              <div className="font-bold text-white text-sm">{fullName}</div>
                              <div className="text-[11px] text-white/60">{m.phone} · {membersService.getPlanInfo(m.planType)?.label || m.planType}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                              expired
                                ? 'bg-red-500/15 text-red-400 border-red-500/20'
                                : d !== null && d <= 5
                                ? 'bg-amber-500/15 text-amber-400 border-amber-500/20'
                                : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                            }`}>
                              {expired ? 'Vencida' : d !== null ? `${d}d` : '—'}
                            </span>
                            <ChevronRight size={13} className="text-white/40 group-hover:text-potros-red transition-colors" />
                          </div>
                        </motion.div>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {suggestions.length === 0 && searchQuery.length > 2 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="mt-4 max-w-xl mx-auto p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm text-center flex items-center justify-center gap-2"
              >
                <AlertTriangle size={14} /> No se encontró ningún socio con «{searchQuery}»
              </motion.div>
            )}

            {/* En móvil/tablet se mantiene visible en una franja compacta */}
            <div className="lg:hidden mt-4 max-w-xl mx-auto">
              <ClockDisplay compact />
            </div>
          </div>
        </motion.div>

        {/* ── Accesos rápidos ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.07 } }}
          className="grid grid-cols-2 gap-3"
        >
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('register')}
            className="flex items-center gap-3 p-4 rounded-2xl border transition-all group text-left relative overflow-hidden"
            style={{ background: 'rgba(214,40,40,0.07)', borderColor: 'rgba(214,40,40,0.25)' }}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: 'radial-gradient(ellipse at 0% 50%, rgba(214,40,40,0.18) 0%, transparent 70%)' }} />
            <div className="relative w-10 h-10 rounded-xl bg-potros-red/20 border border-potros-red/30 flex items-center justify-center text-potros-red group-hover:scale-110 transition-transform">
              <UserPlus size={17} />
            </div>
            <div className="relative">
              <div className="text-sm font-bold text-white">Nuevo Socio</div>
              <div className="text-[11px] text-white/40">Registrar miembro</div>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('quickvisit')}
            className="flex items-center gap-3 p-4 rounded-2xl border transition-all group text-left relative overflow-hidden"
            style={{ background: 'rgba(245,158,11,0.07)', borderColor: 'rgba(245,158,11,0.25)' }}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: 'radial-gradient(ellipse at 0% 50%, rgba(245,158,11,0.18) 0%, transparent 70%)' }} />
            <div className="relative w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <Zap size={17} />
            </div>
            <div className="relative">
              <div className="text-sm font-bold text-white">Visita Rápida</div>
              <div className="text-[11px] text-white/40">Pase diario $50</div>
            </div>
          </motion.button>
        </motion.div>

        {/* ── Vitácora de entradas de hoy ── */}
        <AnimatePresence mode="wait">
          {todayVisits.length > 0 ? (
            <motion.div
              key="log"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
              className="rounded-2xl overflow-hidden border border-white/[0.08]"
              style={{ background: 'rgba(255,255,255,0.025)', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}
            >
              {/* Header con desglose real */}
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-500/20 flex items-center justify-center">
                    <Clock size={12} className="text-sky-400" />
                  </div>
                  <h3 className="font-bold text-white text-sm">Entradas de hoy</h3>
                </div>

                {/* Conteo REAL sin slice */}
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {memberCount > 0 && (
                    <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                      <UserCheck size={9} /> {memberCount} socios
                    </span>
                  )}
                  {quickCount > 0 && (
                    <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">
                      <Zap size={9} /> {quickCount} rápidas
                    </span>
                  )}
                  {expiredCount > 0 && (
                    <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">
                      <AlertTriangle size={9} /> {expiredCount} vencidas
                    </span>
                  )}
                  <span className="text-xs font-black text-white/70 bg-white/8 border border-white/10 px-2 py-0.5 rounded-full">
                    {todayVisits.length} total
                  </span>
                </div>
              </div>

              {/* Lista scrollable — SIN slice, todo se muestra */}
              <div className="divide-y divide-white/[0.035] max-h-80 overflow-y-auto">
                {todayVisits.map((visit, idx) => {
                  const time      = new Date(visit.at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
                  const planLabel = visit.isQuick
                    ? 'Pase diario'
                    : (PLANS[visit.member?.planType]?.label || 'Socio')

                  return (
                    <motion.div
                      key={`${visit.at}-${idx}`}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0, transition: { delay: Math.min(idx * 0.02, 0.3) } }}
                      className="flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${
                          visit.isQuick
                            ? 'bg-amber-500/20 text-amber-400'
                            : visit.isExpired
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {visit.isQuick
                            ? <Zap size={11} />
                            : visit.isExpired
                            ? <XCircle size={11} />
                            : <CheckCircle2 size={11} />}
                        </div>
                        <div>
                          <div className="font-semibold text-white text-[12px] leading-tight">{visit.fullName}</div>
                          <div className={`text-[10px] font-medium ${
                            visit.isQuick ? 'text-amber-400/70' :
                            visit.isExpired ? 'text-red-400/70' : 'text-white/55'
                          }`}>
                            {planLabel}{visit.isExpired ? ' · ⚠ vencida' : ''}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <div className="text-xs font-bold text-white/55 tabular-nums">{time}</div>
                        {visit.isQuick && (visit.amount || 0) > 0 && (
                          <div className="text-[10px] text-amber-400/60">${visit.amount}</div>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.2 } }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                <Users size={24} className="text-white/15" />
              </div>
              <p className="text-sm font-semibold text-white/45">Sin entradas registradas hoy</p>
              <p className="text-xs text-white/15 mt-1">Busca un socio arriba para registrar su entrada</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showModal && selectedMember && (
        <MemberStatusModal
          member={selectedMember}
          onClose={handleCloseModal}
          onChange={onChange}
          onPaymentDone={done => setPaymentDone(done)}
          onShowToast={onShowToast}
          isBusy={closingModal}
        />
      )}
    </>
  )
}
