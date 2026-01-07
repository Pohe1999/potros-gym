import React, { useEffect, useState } from 'react'
import { FiClock } from 'react-icons/fi'

export default function ClockDisplay() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Obtener hora en zona America/Mexico_City
  const formatter = new Intl.DateTimeFormat('es-MX', {
    timeZone: 'America/Mexico_City',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
  
  const timeStr = formatter.format(time)
  
  // Obtener fecha en zona America/Mexico_City
  const dateFormatter = new Intl.DateTimeFormat('es-MX', {
    timeZone: 'America/Mexico_City',
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })
  
  const dateStr = dateFormatter.format(time)

  // Calcular ángulos para el reloj analógico con smoothness
  const hours = time.getHours() % 12
  const minutes = time.getMinutes()
  const seconds = time.getSeconds()
  const milliseconds = time.getMilliseconds()
  
  // Suavizar el movimiento del segundero
  const smoothSeconds = seconds + milliseconds / 1000
  const secondDegrees = (smoothSeconds / 60) * 360
  const minuteDegrees = (minutes / 60) * 360 + (smoothSeconds / 60) * 6
  const hourDegrees = (hours / 12) * 360 + (minutes / 60) * 30

  return (
    <div className="flex flex-col items-center gap-3 md:gap-4 p-4 md:p-6 bg-gradient-to-br from-gray-950 via-gray-900 to-black rounded-xl md:rounded-2xl border border-gray-800 shadow-2xl">
      {/* Reloj Cartier Santos Style */}
      <div className="relative w-20 h-20 md:w-28 md:h-28 rounded-lg md:rounded-xl bg-gradient-to-br from-gray-900 to-black border-4 md:border-8 border-gray-700 shadow-2xl" 
           style={{
             boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8), 0 10px 30px rgba(0,0,0,0.9)'
           }}>
        
        {/* Decoración cuadrícula Cartier */}
        <div className="absolute inset-0 rounded-lg opacity-10">
          <div className="absolute top-1 left-1 w-2 h-2 border border-gray-500"></div>
          <div className="absolute top-1 right-1 w-2 h-2 border border-gray-500"></div>
          <div className="absolute bottom-1 left-1 w-2 h-2 border border-gray-500"></div>
          <div className="absolute bottom-1 right-1 w-2 h-2 border border-gray-500"></div>
        </div>

        {/* Centro del reloj */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 bg-gradient-to-br from-gray-300 to-gray-600 rounded-full z-20 shadow-lg"></div>
        </div>

        {/* Marcas horarias - estilo Cartier (simples y elegantes) */}
        {[...Array(12)].map((_, i) => {
          const angle = (i * 30) * (Math.PI / 180)
          const outerX = Math.sin(angle) * 50
          const outerY = -Math.cos(angle) * 50
          
          return (
            <div key={i} className="absolute w-full h-full"
              style={{
                transform: `rotate(${i * 30}deg)`
              }}>
              {/* Marcas principales (cada 3 horas) */}
              {i % 3 === 0 ? (
                <div className="absolute top-2 left-1/2 w-1 h-2.5 bg-gradient-to-b from-gray-200 to-gray-400 rounded-full transform -translate-x-1/2 shadow-sm"></div>
              ) : (
                <div className="absolute top-3 left-1/2 w-0.5 h-1.5 bg-gray-500 rounded-full transform -translate-x-1/2"></div>
              )}
            </div>
          )
        })}

        {/* Manecilla de horas - corta y gruesa */}
        <div
          className="absolute bottom-1/2 left-1/2 origin-bottom rounded-full shadow-lg transition-all"
          style={{
            transform: `translateX(-50%) rotateZ(${hourDegrees}deg)`,
            width: '5px',
            height: '24px',
            background: 'linear-gradient(to top, #d1d5db, #f3f4f6)',
            boxShadow: '0 0 4px rgba(0,0,0,0.5)'
          }}
        ></div>

        {/* Manecilla de minutos - mediana */}
        <div
          className="absolute bottom-1/2 left-1/2 origin-bottom rounded-full shadow-lg transition-all"
          style={{
            transform: `translateX(-50%) rotateZ(${minuteDegrees}deg)`,
            width: '3.5px',
            height: '32px',
            background: 'linear-gradient(to top, #e5e7eb, #f9fafb)',
            boxShadow: '0 0 3px rgba(0,0,0,0.4)'
          }}
        ></div>

        {/* Segundero - delgado y rojo elegante */}
        <div
          className="absolute bottom-1/2 left-1/2 origin-bottom rounded-full"
          style={{
            transform: `translateX(-50%) rotateZ(${secondDegrees}deg)`,
            width: '1.5px',
            height: '36px',
            background: 'linear-gradient(to top, #dc2626, #ef4444)',
            boxShadow: '0 0 2px rgba(220, 38, 38, 0.6)'
          }}
        ></div>

        {/* Pequeño círculo en base del segundero */}
        <div className="absolute bottom-1/2 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 bg-red-500 rounded-full z-10 shadow-md"></div>
      </div>

      {/* Hora Digital */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <FiClock className="text-gray-400 text-base md:text-lg" />
          <span className="text-xl md:text-2xl font-mono font-bold text-gray-200 tracking-wider">
            {timeStr}
          </span>
        </div>
        <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-widest">
          {dateStr} • México
        </p>
      </div>

      {/* Indicador de sincronización */}
      <div className="w-full pt-2 md:pt-3 border-t border-gray-700">
        <p className="text-[10px] md:text-xs text-gray-500 text-center flex items-center justify-center gap-1">
          <span className="inline-block w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full animate-pulse"></span>
          Sincronizado
        </p>
      </div>
    </div>
  )
}
