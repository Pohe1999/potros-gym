import React, { useMemo, useState } from 'react'
import membersService from '../services/membersService'

export default function IncomePanel({ members = [], quickVisits = [] }) {
  const [showDetails, setShowDetails] = useState(false)
  const [password, setPassword] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [error, setError] = useState('')

  const labels = {
    visita: 'Visita',
    semana: '1 Semana',
    '15dias': '15 Días',
    mensualPromo: 'Mensual Promo Dic',
    estudiante: 'Promo Estudiantes',
    mensual: 'Mensual',
    parejas: 'Parejas o Más',
    anual: 'Anual'
  }

  const summary = useMemo(() => {
    const res = { 
      total: 0, 
      byType: {}, 
      count: 0, 
      today: 0, 
      thisWeek: 0,
      thisMonth: 0,
      avgDaily: 0,
      todayCount: 0,
      weekCount: 0,
      monthCount: 0
    }
    const today = new Date().toISOString().slice(0, 10)
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    
    // Contar pagos de miembros
    members.forEach(m => {
      (m.payments || []).forEach(p => {
        const amount = p.amount || 0
        res.total += amount
        res.count++
        res.byType[p.type] = (res.byType[p.type] || 0) + amount
        
        if (p.at && p.at.startsWith(today)) {
          res.today += amount
          res.todayCount++
        }
        if (p.at && p.at >= weekAgo) {
          res.thisWeek += amount
          res.weekCount++
        }
        if (p.at && p.at >= monthAgo) {
          res.thisMonth += amount
          res.monthCount++
        }
      })
    })

    // Contar visitas rápidas de visitantes
    quickVisits.forEach(v => {
      const amount = v.amount || 0
      if (amount > 0) {
        res.total += amount
        res.count++
        res.byType['visita'] = (res.byType['visita'] || 0) + amount
        
        if (v.at && v.at.startsWith(today)) {
          res.today += amount
          res.todayCount++
        }
        if (v.at && v.at >= weekAgo) {
          res.thisWeek += amount
          res.weekCount++
        }
        if (v.at && v.at >= monthAgo) {
          res.thisMonth += amount
          res.monthCount++
        }
      }
    })
    
    if (res.count > 0) {
      res.avgDaily = Math.round(res.total / Math.max(1, Math.ceil((now - new Date(members[0]?.joinDate || now)) / (1000 * 60 * 60 * 24))))
    }
    
    return res
  }, [members, quickVisits])

  const todayItems = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const items = []

    members.forEach(m => {
      const fullName = `${m.firstName || m.name || ''} ${m.paterno || ''} ${m.materno || ''}`.trim()
      ;(m.payments || []).forEach(p => {
        if (p.at && p.at.startsWith(today)) {
          items.push({
            kind: 'payment',
            at: p.at,
            name: fullName,
            label: labels[p.type] || p.type,
            amount: p.amount || 0
          })
        }
      })
    })

    quickVisits
      .filter(v => v.at && v.at.startsWith(today))
      .forEach(v => {
        items.push({
          kind: 'quick',
          at: v.at,
          name: v.name,
          label: 'Visita (visitante)',
          amount: v.amount || 0
        })
      })

    return items.sort((a, b) => (b.at || '').localeCompare(a.at || ''))
  }, [members, quickVisits])
  

  const handleUnlock = (e) => {
    e.preventDefault()
    if (password === '123') {
      setUnlocked(true)
      setError('')
      setShowDetails(true)
    } else {
      setError('Contraseña incorrecta')
    }
  }

  const exportToExcel = async () => {
    try {
      // Recopilar todos los pagos de miembros
      const allPayments = []
      
      members.forEach(m => {
        const fullName = `${m.firstName || m.name || ''} ${m.paterno || ''} ${m.materno || ''}`.trim()
        ;(m.payments || []).forEach(p => {
          allPayments.push({
            at: p.at,
            memberName: fullName,
            type: p.type,
            amount: p.amount || 0
          })
        })
      })
      
      // Agregar visitas rápidas
      quickVisits.forEach(v => {
        if (v.amount > 0) {
          allPayments.push({
            at: v.at,
            memberName: v.name || 'Visitante',
            type: 'visita',
            amount: v.amount || 0
          })
        }
      })
      
      // Ordenar por fecha (más reciente primero)
      allPayments.sort((a, b) => (b.at || '').localeCompare(a.at || ''))
      
      // Crear CSV content
      let csvContent = 'Fecha,Hora,Nombre del Socio,Plan/Tipo,Monto\n'
      
      allPayments.forEach(payment => {
        const date = new Date(payment.at)
        const dateStr = date.toLocaleDateString('es-MX')
        const timeStr = date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
        const name = payment.memberName || 'Sin nombre'
        const planLabel = labels[payment.type] || payment.type
        const amount = payment.amount || 0
        
        csvContent += `${dateStr},${timeStr},"${name}","${planLabel}",${amount}\n`
      })
      
      // Crear blob y descargar
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      const today = new Date().toISOString().slice(0, 10)
      link.setAttribute('href', url)
      link.setAttribute('download', `pagos-potros-gym-${today}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error('Error al exportar:', err)
      alert('Error al exportar los datos: ' + err.message)
    }
  }

  return (
    <div className="bg-gray-900 p-6 rounded-lg card-shadow border border-gray-800">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <span>💰</span> Panel de Ingresos
      </h2>
      
      {/* Ingresos de hoy - siempre visible */}
      <div className="bg-gradient-to-br from-green-900 to-green-800 p-4 rounded-lg mb-4">
        <div className="text-sm text-green-200 uppercase font-semibold">Ingresos Hoy</div>
        <div className="text-4xl font-bold text-white mt-1">${summary.today.toLocaleString()}</div>
        <div className="text-xs text-green-300 mt-1">{summary.todayCount} pago{summary.todayCount !== 1 ? 's' : ''} registrado{summary.todayCount !== 1 ? 's' : ''}</div>
      </div>

      {/* Botón para ver análisis completo */}
      {!unlocked ? (
        <div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full bg-gray-800 hover:bg-gray-700 p-3 rounded-lg transition-colors flex items-center justify-between"
          >
            <span className="font-semibold">🔒 Ver análisis completo</span>
            <span>{showDetails ? '▲' : '▼'}</span>
          </button>
          
          {showDetails && (
            <form onSubmit={handleUnlock} className="mt-3 space-y-3">
              <input
                type="password"
                placeholder="Ingresa la clave"
                className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-potros-red focus:outline-none"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoFocus
              />
              {error && <div className="text-red-400 text-sm">{error}</div>}
              <button
                type="submit"
                className="w-full bg-potros-red hover:bg-red-700 p-3 rounded-lg font-semibold transition-colors"
              >
                Desbloquear
              </button>
            </form>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">✅ Análisis desbloqueado</span>
            <button
              onClick={() => { setUnlocked(false); setPassword(''); setShowDetails(false); }}
              className="text-xs text-gray-500 hover:text-gray-300"
            >
              🔒 Bloquear
            </button>
          </div>

          {/* Total acumulado */}
          <div className="bg-gradient-to-br from-blue-900 to-blue-800 p-4 rounded-lg">
            <div className="text-sm text-blue-200 uppercase font-semibold">Total Acumulado</div>
            <div className="text-3xl font-bold text-white mt-1">${summary.total.toLocaleString()}</div>
            <div className="text-xs text-blue-300 mt-1">{summary.count} pagos totales</div>
          </div>

          {/* Botón de exportar a Excel */}
          <button
            onClick={exportToExcel}
            className="w-full bg-green-600 hover:bg-green-700 p-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <span>📊</span>
            <span>Exportar Base Completa a Excel</span>
          </button>

          {/* Movimientos de hoy */}
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-gray-300 font-semibold">Movimientos de Hoy</div>
              <div className="text-xs text-gray-500">{todayItems.length} registro{todayItems.length !== 1 ? 's' : ''}</div>
            </div>

            {todayItems.length === 0 ? (
              <div className="text-gray-500 text-sm text-center py-3">Sin movimientos hoy</div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {todayItems.map((item, idx) => {
                  const time = item.at ? new Date(item.at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : ''
                  const icon = item.kind === 'quick' ? '🧾' : '💳'
                  return (
                    <div key={`${item.at}-${idx}`} className="flex items-center justify-between bg-gray-900 p-3 rounded border border-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="text-xl">{icon}</div>
                        <div>
                          <div className="font-semibold text-gray-100">{item.name || 'Visitante'}</div>
                          <div className="text-xs text-gray-500">{item.label}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-300">${item.amount.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">{time}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Estadísticas de periodo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-gray-800 p-3 rounded-lg">
              <div className="text-xs text-gray-400 uppercase">Esta Semana</div>
              <div className="text-xl font-bold text-yellow-400">${summary.thisWeek.toLocaleString()}</div>
              <div className="text-xs text-gray-500">{summary.weekCount} pagos</div>
            </div>
            <div className="bg-gray-800 p-3 rounded-lg">
              <div className="text-xs text-gray-400 uppercase">Este Mes</div>
              <div className="text-xl font-bold text-purple-400">${summary.thisMonth.toLocaleString()}</div>
              <div className="text-xs text-gray-500">{summary.monthCount} pagos</div>
            </div>
          </div>

          {/* Promedio diario */}
          <div className="bg-gray-800 p-3 rounded-lg">
            <div className="text-xs text-gray-400 uppercase">Promedio Diario</div>
            <div className="text-2xl font-bold text-cyan-400">${summary.avgDaily.toLocaleString()}</div>
          </div>

          {/* Desglose por tipo */}
          <div className="space-y-2">
            <div className="text-sm text-gray-400 uppercase font-semibold mb-2">Desglose por Plan</div>
            {Object.keys(summary.byType).length === 0 && (
              <div className="text-gray-500 text-center py-4 text-sm">Sin ingresos registrados</div>
            )}
            {Object.entries(summary.byType)
              .sort((a, b) => b[1] - a[1])
              .map(([k, v]) => {
                const percentage = ((v / summary.total) * 100).toFixed(1)
                return (
                  <div key={k} className="bg-gray-800 p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <div className="text-sm text-gray-300">{labels[k] || k}</div>
                      <div className="text-lg font-semibold text-potros-red">${v.toLocaleString()}</div>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-potros-red h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{percentage}% del total</div>
                  </div>
                )
              })}
          </div>

          {/* Proyección mensual */}
          <div className="bg-gradient-to-br from-purple-900 to-purple-800 p-4 rounded-lg">
            <div className="text-sm text-purple-200 uppercase font-semibold">Proyección Mensual</div>
            <div className="text-2xl font-bold text-white mt-1">
              ${Math.round((summary.thisWeek / 7) * 30).toLocaleString()}
            </div>
            <div className="text-xs text-purple-300 mt-1">Basado en promedio semanal</div>
          </div>
        </div>
      )}
    </div>
  )
}
