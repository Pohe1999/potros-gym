import React, { useEffect, useState } from 'react'
import { FiCheckCircle, FiX, FiAlertCircle, FiInfo } from 'react-icons/fi'
import { MdCheckCircle } from 'react-icons/md'

export default function Toast({ message, type = 'success', onDismiss, duration = 3000 }) {
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true)
      setTimeout(() => {
        onDismiss()
      }, 300)
    }, duration)
    return () => clearTimeout(timer)
  }, [onDismiss, duration])

  const colorConfig = {
    success: {
      bg: 'from-green-500 to-emerald-600',
      border: 'border-green-400',
      icon: <MdCheckCircle className="w-6 h-6" />,
      glow: 'shadow-lg shadow-green-500/40'
    },
    error: {
      bg: 'from-red-500 to-red-600',
      border: 'border-red-400',
      icon: <FiX className="w-6 h-6" />,
      glow: 'shadow-lg shadow-red-500/40'
    },
    warning: {
      bg: 'from-yellow-500 to-amber-600',
      border: 'border-yellow-400',
      icon: <FiAlertCircle className="w-6 h-6" />,
      glow: 'shadow-lg shadow-yellow-500/40'
    },
    info: {
      bg: 'from-blue-500 to-cyan-600',
      border: 'border-blue-400',
      icon: <FiInfo className="w-6 h-6" />,
      glow: 'shadow-lg shadow-blue-500/40'
    }
  }

  const config = colorConfig[type] || colorConfig.success

  return (
    <div className={`fixed top-6 left-1/2 z-50 transform -translate-x-1/2 transition-all duration-300 ${
      isExiting ? 'opacity-0 translate-y-full' : 'opacity-100 translate-y-0'
    }`}>
      <div className={`bg-gradient-to-r ${config.bg} text-white px-6 py-4 rounded-2xl backdrop-blur-md border ${config.border} ${config.glow} flex items-center gap-4 font-semibold text-base shadow-2xl min-w-max`}>
        <div className="flex-shrink-0 animate-pulse">{config.icon}</div>
        <span className="tracking-tight">{message}</span>
      </div>
    </div>
  )
}
