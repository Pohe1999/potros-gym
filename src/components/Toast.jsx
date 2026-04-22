import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'

const CONFIG = {
  success: { Icon: CheckCircle2, bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', text: 'text-emerald-300', glow: 'shadow-[0_0_30px_rgba(16,185,129,0.25)]' },
  error:   { Icon: XCircle,      bg: 'bg-red-500/15',     border: 'border-red-500/30',     text: 'text-red-300',     glow: 'shadow-[0_0_30px_rgba(239,68,68,0.25)]' },
  warning: { Icon: AlertTriangle,bg: 'bg-amber-500/15',   border: 'border-amber-500/30',   text: 'text-amber-300',   glow: 'shadow-[0_0_30px_rgba(245,158,11,0.25)]' },
  info:    { Icon: Info,         bg: 'bg-sky-500/15',     border: 'border-sky-500/30',     text: 'text-sky-300',     glow: 'shadow-[0_0_30px_rgba(14,165,233,0.25)]' },
}

export default function Toast({ message, type = 'success', onDismiss, duration = 3500 }) {
  const { Icon, bg, border, text, glow } = CONFIG[type] || CONFIG.success

  useEffect(() => {
    const t = setTimeout(onDismiss, duration)
    return () => clearTimeout(t)
  }, [onDismiss, duration])

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] pointer-events-none"
    >
      <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border backdrop-blur-xl ${bg} ${border} ${glow} pointer-events-auto`}
        style={{ background: 'rgba(10,14,26,0.92)', maxWidth: '420px', minWidth: '260px' }}
      >
        <Icon size={18} className={`${text} flex-shrink-0`} />
        <span className="text-white/90 text-sm font-medium flex-1">{message}</span>
        <button onClick={onDismiss} className={`${text} opacity-60 hover:opacity-100 transition-opacity flex-shrink-0`}>
          <X size={14} />
        </button>
      </div>
    </motion.div>
  )
}
