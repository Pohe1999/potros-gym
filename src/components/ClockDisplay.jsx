import React, { useEffect, useMemo, useState } from 'react'
import { Clock3 } from 'lucide-react'

export default function ClockDisplay({ compact = false }) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const formatter = useMemo(() => new Intl.DateTimeFormat('es-MX', {
    timeZone: 'America/Mexico_City',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }), [])

  const timeStr = formatter.format(time)

  const dateFormatter = useMemo(() => new Intl.DateTimeFormat('es-MX', {
    timeZone: 'America/Mexico_City',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }), [])

  const dateStr = dateFormatter.format(time)

  const hours = time.getHours() % 12
  const minutes = time.getMinutes()
  const seconds = time.getSeconds()
  const smoothSeconds = seconds + time.getMilliseconds() / 1000
  const secondDegrees = (smoothSeconds / 60) * 360
  const minuteDegrees = (minutes / 60) * 360 + (smoothSeconds / 60) * 6
  const hourDegrees = (hours / 12) * 360 + (minutes / 60) * 30

  return (
    <div
      className={`glass border border-white/[0.08] flex items-center ${compact ? 'rounded-xl p-2.5 gap-2.5' : 'rounded-2xl p-4 gap-4'}`}
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.015) 100%)',
        boxShadow: compact ? '0 6px 20px rgba(0,0,0,0.3)' : '0 8px 28px rgba(0,0,0,0.32)',
      }}
    >
      <div className={`relative rounded-full border border-white/10 bg-black/30 ${compact ? 'w-14 h-14' : 'w-24 h-24'}`}>
        <div
          className={`absolute rounded-full ${compact ? 'inset-1.5' : 'inset-2'}`}
          style={{
            background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.08), rgba(0,0,0,0.1))',
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.45)',
          }}
        />

        {[...Array(12)].map((_, i) => (
          <div key={i} className="absolute w-full h-full" style={{ transform: `rotate(${i * 30}deg)` }}>
            <div className={`absolute top-1 left-1/2 -translate-x-1/2 rounded-full ${i % 3 === 0 ? 'h-2 w-0.5 bg-white/45' : 'h-1.5 w-px bg-white/20'}`} />
          </div>
        ))}

        <div
          className="absolute bottom-1/2 left-1/2 origin-bottom rounded-full"
          style={{
            transform: `translateX(-50%) rotateZ(${hourDegrees}deg)`,
            width: compact ? '2.5px' : '4px',
            height: compact ? '14px' : '24px',
            background: 'linear-gradient(to top, rgba(255,255,255,0.8), rgba(255,255,255,0.35))',
          }}
        />

        <div
          className="absolute bottom-1/2 left-1/2 origin-bottom rounded-full"
          style={{
            transform: `translateX(-50%) rotateZ(${minuteDegrees}deg)`,
            width: compact ? '2px' : '3px',
            height: compact ? '18px' : '31px',
            background: 'linear-gradient(to top, rgba(255,255,255,0.9), rgba(255,255,255,0.45))',
          }}
        />

        <div
          className="absolute bottom-1/2 left-1/2 origin-bottom rounded-full"
          style={{
            transform: `translateX(-50%) rotateZ(${secondDegrees}deg)`,
            width: compact ? '1px' : '1.5px',
            height: compact ? '20px' : '35px',
            background: 'linear-gradient(to top, #ef4444, #f87171)',
            boxShadow: '0 0 6px rgba(239,68,68,0.55)',
          }}
        />

        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`${compact ? 'w-2 h-2' : 'w-2.5 h-2.5'} rounded-full bg-white/85 border border-white/30`} />
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className={`flex items-center text-white/45 uppercase tracking-widest ${compact ? 'gap-1.5 text-[10px] mb-1' : 'gap-2 text-xs mb-1.5'}`}>
          <Clock3 size={compact ? 11 : 13} className="text-potros-red/70" />
          Hora local
        </div>
        <div className={`${compact ? 'text-lg' : 'text-3xl'} leading-none font-black text-white tracking-tight font-mono`}>{timeStr}</div>
        {!compact && (
          <p className="text-xs text-white/45 mt-2 truncate">
            {dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}
          </p>
        )}
        <div className={`${compact ? 'mt-1.5 text-[10px] px-1.5 py-0.5' : 'mt-3 text-[11px] px-2 py-0.5'} inline-flex items-center gap-1.5 text-emerald-400/80 border border-emerald-400/20 bg-emerald-400/10 rounded-full`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Sincronizado CDMX
        </div>
      </div>
    </div>
  )
}
