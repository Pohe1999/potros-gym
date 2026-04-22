import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Zap, User, CheckCircle2 } from 'lucide-react'
import membersService from '../services/membersService'

export default function QuickVisitPanel({ members = [], quickVisits = [], onChange, onShowToast }) {
  const [name, setName]         = useState('')
  const [loading, setLoading]   = useState(false)

  const handleRegisterVisit = async (e) => {
    e.preventDefault()
    if (loading) return
    if (!name.trim()) {
      if (onShowToast) onShowToast('Por favor ingresa un nombre', 'error')
      return
    }
    const existingMember = members.find(m => {
      const full = `${m.firstName || ''} ${m.paterno || ''} ${m.materno || ''}`.toLowerCase().trim()
      return full === name.toLowerCase().trim()
    })
    if (existingMember) {
      if (onShowToast) onShowToast(`El nombre corresponde a un socio registrado. Usa 'Registro de Entrada'.`, 'warning')
      return
    }
    try {
      setLoading(true)
      await membersService.addQuickVisit({ name: name.trim(), amount: 50 })
      if (onShowToast) onShowToast(`Visita registrada: ${name.trim()} — $50 cobrado`, 'success')
      setName('')
      onChange()
    } catch (err) {
      if (onShowToast) onShowToast(`Error: ${err.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl overflow-hidden"
      style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 md:px-6 py-5 border-b border-white/[0.06]">
        <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
          <Zap size={18} className="text-amber-400" />
        </div>
        <div>
          <h2 className="font-extrabold text-white text-lg">Registrar Visita Rápida</h2>
          <p className="text-xs text-white/60">Pase diario $50 — Solo para visitantes no socios</p>
        </div>
      </div>

      <form onSubmit={handleRegisterVisit} className="p-5 md:p-8 space-y-5">
        {/* Info card */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/8 border border-amber-500/15">
          <Zap size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-white/50 leading-relaxed">
            Este registro es para personas que no son socios del gym y pagan el <strong className="text-amber-300">pase diario de $50</strong>.
            Si el visitante es socio, usa la pantalla de <strong className="text-white/70">Registro de Entrada</strong>.
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">
            <span className="flex items-center gap-1.5"><User size={11} /> Nombre del visitante</span>
          </label>
          <input
            type="text"
            placeholder="Ej: Carlos Mendoza"
            className="w-full px-4 py-4 rounded-xl bg-white/[0.05] border border-white/[0.09] focus:border-amber-500/60 focus:outline-none focus:ring-1 focus:ring-amber-500/20 text-white placeholder-white/20 text-lg transition-all"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
        </div>

        <motion.button
          type="submit"
          disabled={loading || !name.trim()}
          whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-40 border border-amber-500/30 text-amber-300 font-bold text-base transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                <Zap size={17} />
              </motion.div>
              Registrando...
            </>
          ) : (
            <>
              <CheckCircle2 size={17} /> Registrar Visita — $50
            </>
          )}
        </motion.button>
      </form>
    </motion.div>
  )
}
