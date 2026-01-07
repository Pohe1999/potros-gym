import React, { useState, useMemo } from 'react'
import membersService from '../services/membersService'

export default function DashboardAnalytics({ members = [], quickVisits = [], onClose }) {
  const [filterType, setFilterType] = useState('all') // 'all', 'plan', 'visita'
  const [startDate, setStartDate] = useState(membersService.getLocalDateAgo(30))
  const [endDate, setEndDate] = useState(membersService.getTodayLocal())
  const [selectedPlan, setSelectedPlan] = useState('all') // filtro por plan específico

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

  // Combinar todos los pagos
  const allPayments = useMemo(() => {
    const payments = []
    
    members.forEach(m => {
      const fullName = `${m.firstName || m.name || ''} ${m.paterno || ''} ${m.materno || ''}`.trim()
      ;(m.payments || []).forEach(p => {
        payments.push({
          id: `member-${m.id}-${p.id}`,
          at: p.at,
          memberName: fullName,
          type: p.type,
          amount: p.amount || 0,
          source: 'member'
        })
      })
    })

    quickVisits.forEach(v => {
      payments.push({
        id: `quick-${v.id}`,
        at: v.at,
        memberName: v.name || 'Visitante',
        type: 'visita',
        amount: v.amount || 0,
        source: 'quickVisit'
      })
    })

    return payments.sort((a, b) => (b.at || '').localeCompare(a.at || ''))
  }, [members, quickVisits])

  // Filtrar pagos por rango de fecha y tipo
  const filteredPayments = useMemo(() => {
    return allPayments.filter(p => {
      const dateOk = p.at >= startDate && p.at <= endDate + 'T23:59:59'
      const typeOk = filterType === 'all' || 
        (filterType === 'plan' && p.type !== 'visita') ||
        (filterType === 'visita' && p.type === 'visita')
      const planOk = selectedPlan === 'all' || p.type === selectedPlan
      return dateOk && typeOk && planOk
    })
  }, [allPayments, startDate, endDate, filterType, selectedPlan])

  // Análisis
  const analytics = useMemo(() => {
    const res = {
      total: 0,
      count: 0,
      byType: {},
      byPlan: {},
      avgPerTransaction: 0,
      dailyAverage: 0,
      topPlans: [],
      topMembers: {}
    }

    filteredPayments.forEach(p => {
      res.total += p.amount
      res.count++
      res.byType[p.type] = (res.byType[p.type] || 0) + p.amount
      res.topMembers[p.memberName] = (res.topMembers[p.memberName] || 0) + p.amount
      
      if (p.type !== 'visita') {
        res.byPlan[p.type] = (res.byPlan[p.type] || 0) + p.amount
      }
    })

    if (res.count > 0) {
      res.avgPerTransaction = Math.round(res.total / res.count)
    }

    // Calcular días en rango
    const startD = new Date(startDate)
    const endD = new Date(endDate)
    const daysInRange = Math.max(1, Math.ceil((endD - startD) / (1000 * 60 * 60 * 24)) + 1)
    res.dailyAverage = Math.round(res.total / daysInRange)

    // Top 5 planes
    res.topPlans = Object.entries(res.byPlan)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    // Top 5 miembros
    res.topMembers = Object.entries(res.topMembers)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    return res
  }, [filteredPayments, startDate, endDate])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 overflow-y-auto">
      <div className="min-h-screen p-3 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-8 gap-3">
            <h1 className="text-2xl md:text-4xl font-bold text-potros-red">📊 Dashboard de Análisis</h1>
            <button
              onClick={onClose}
              className="w-full md:w-auto bg-gray-700 hover:bg-gray-600 text-white px-4 md:px-6 py-2 rounded-lg font-semibold transition"
            >
              ✕ Cerrar
            </button>
          </div>

          {/* Filtros */}
          <div className="bg-gray-900 p-3 md:p-6 rounded-lg border border-gray-700 mb-4 md:mb-6 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div>
              <label className="block text-[10px] md:text-xs text-gray-400 uppercase mb-1 md:mb-2">Desde</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full p-1.5 md:p-2 bg-gray-800 border border-gray-700 rounded text-white text-xs md:text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] md:text-xs text-gray-400 uppercase mb-1 md:mb-2">Hasta</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full p-1.5 md:p-2 bg-gray-800 border border-gray-700 rounded text-white text-xs md:text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] md:text-xs text-gray-400 uppercase mb-1 md:mb-2">Tipo</label>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="w-full p-1.5 md:p-2 bg-gray-800 border border-gray-700 rounded text-white text-xs md:text-sm"
              >
                <option value="all">Todos</option>
                <option value="plan">Solo Planes</option>
                <option value="visita">Solo Visitas</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] md:text-xs text-gray-400 uppercase mb-1 md:mb-2">Plan</label>
              <select
                value={selectedPlan}
                onChange={e => setSelectedPlan(e.target.value)}
                className="w-full p-1.5 md:p-2 bg-gray-800 border border-gray-700 rounded text-white text-xs md:text-sm"
              >
                <option value="all">Todos los planes</option>
                <option value="visita">Visita</option>
                <option value="semana">1 Semana</option>
                <option value="15dias">15 Días</option>
                <option value="estudiante">Promo Estudiantes</option>
                <option value="mensual">Mensual</option>
                <option value="parejas">Parejas o Más</option>
                <option value="anual">Anual</option>
              </select>
            </div>
          </div>

          {/* KPIs principales */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-6">
            <div className="bg-gradient-to-br from-blue-900 to-blue-800 p-3 md:p-4 rounded-lg border border-blue-700">
              <div className="text-[10px] md:text-sm text-blue-200 uppercase">Total Ingresos</div>
              <div className="text-2xl md:text-4xl font-bold text-white mt-1 md:mt-2">${analytics.total.toLocaleString()}</div>
              <div className="text-[9px] md:text-xs text-blue-300 mt-1">{analytics.count} transacciones</div>
            </div>
            <div className="bg-gradient-to-br from-green-900 to-green-800 p-3 md:p-4 rounded-lg border border-green-700">
              <div className="text-[10px] md:text-sm text-green-200 uppercase">Promedio</div>
              <div className="text-2xl md:text-4xl font-bold text-white mt-1 md:mt-2">${analytics.avgPerTransaction.toLocaleString()}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-900 to-purple-800 p-3 md:p-4 rounded-lg border border-purple-700">
              <div className="text-[10px] md:text-sm text-purple-200 uppercase">Promedio Diario</div>
              <div className="text-2xl md:text-4xl font-bold text-white mt-1 md:mt-2">${analytics.dailyAverage.toLocaleString()}</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-900 to-yellow-800 p-3 md:p-4 rounded-lg border border-yellow-700">
              <div className="text-[10px] md:text-sm text-yellow-200 uppercase">Días</div>
              <div className="text-2xl md:text-4xl font-bold text-white mt-1 md:mt-2">
                {Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1}
              </div>
            </div>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6 mb-4 md:mb-6">
            {/* Desglose por tipo */}
            <div className="bg-gray-900 p-3 md:p-6 rounded-lg border border-gray-700">
              <h3 className="text-base md:text-xl font-semibold text-white mb-3 md:mb-4">Ingresos por Tipo</h3>
              <div className="space-y-2 md:space-y-3">
                {Object.entries(analytics.byType)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, amount]) => {
                    const percentage = ((amount / analytics.total) * 100).toFixed(1)
                    return (
                      <div key={type}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-gray-300">{labels[type] || type}</span>
                          <span className="font-semibold text-potros-red">${amount.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-potros-red h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{percentage}%</div>
                      </div>
                    )
                  })}
              </div>
            </div>

            {/* Top Planes */}
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-4">Top 5 Planes</h3>
              <div className="space-y-2">
                {analytics.topPlans.map(([plan, amount], idx) => (
                  <div key={plan} className="flex items-center justify-between p-3 bg-gray-800 rounded">
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold text-potros-red">#{idx + 1}</span>
                      <span className="text-gray-300">{labels[plan] || plan}</span>
                    </div>
                    <span className="font-semibold">${amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Miembros y Tabla de transacciones */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Top Miembros */}
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-4">Top 5 Miembros</h3>
              <div className="space-y-2">
                {analytics.topMembers.map(([member, amount], idx) => (
                  <div key={member} className="flex items-center justify-between p-3 bg-gray-800 rounded">
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold text-blue-400">#{idx + 1}</span>
                      <span className="text-gray-300 truncate">{member}</span>
                    </div>
                    <span className="font-semibold">${amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumen por plan */}
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-4">Ingresos por Plan</h3>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {Object.entries(analytics.byPlan)
                  .sort((a, b) => b[1] - a[1])
                  .map(([plan, amount]) => (
                    <div key={plan} className="flex justify-between items-center p-3 bg-gray-800 rounded">
                      <span className="text-gray-300">{labels[plan] || plan}</span>
                      <div className="text-right">
                        <div className="font-semibold text-green-400">${amount.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">
                          {((amount / analytics.total) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Tabla de transacciones filtradas */}
          <div className="bg-gray-900 p-3 md:p-6 rounded-lg border border-gray-700">
            <h3 className="text-base md:text-xl font-semibold text-white mb-3 md:mb-4">
              Transacciones ({filteredPayments.length})
            </h3>
            <div className="overflow-x-auto max-h-64 md:max-h-96 overflow-y-auto">
              <table className="w-full text-xs md:text-sm">
                <thead className="bg-gray-800 sticky top-0">
                  <tr>
                    <th className="px-2 md:px-4 py-2 text-left text-gray-300 text-[10px] md:text-sm">Fecha/Hora</th>
                    <th className="px-2 md:px-4 py-2 text-left text-gray-300 text-[10px] md:text-sm">Miembro</th>
                    <th className="px-2 md:px-4 py-2 text-left text-gray-300 text-[10px] md:text-sm">Plan/Tipo</th>
                    <th className="px-2 md:px-4 py-2 text-right text-gray-300 text-[10px] md:text-sm">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((p, idx) => (
                    <tr key={p.id || idx} className="border-t border-gray-700 hover:bg-gray-800">
                      <td className="px-2 md:px-4 py-2 md:py-3 text-gray-300 text-[10px] md:text-xs whitespace-nowrap">
                        {new Date(p.at).toLocaleDateString('es-MX', { month: 'numeric', day: 'numeric' })} {' '}
                        {new Date(p.at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-2 md:px-4 py-2 md:py-3 text-gray-300 truncate max-w-[100px] md:max-w-xs text-[10px] md:text-sm">{p.memberName}</td>
                      <td className="px-2 md:px-4 py-2 md:py-3 text-gray-300 text-[10px] md:text-sm">{labels[p.type] || p.type}</td>
                      <td className="px-2 md:px-4 py-2 md:py-3 text-right font-semibold text-green-400 text-[10px] md:text-sm whitespace-nowrap">
                        ${p.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
