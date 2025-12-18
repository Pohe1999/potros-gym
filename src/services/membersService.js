const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export const PLANS = {
  visita: { days: 0, price: 50, label: 'Visita' },
  semana: { days: 7, price: 150, label: '1 Semana' },
  '15dias': { days: 15, price: 250, label: '15 Días' },
  mensualPromo: { days: 30, price: 400, label: 'Mensual Promo Dic' },
  mensual: { days: 30, price: 500, label: 'Mensual' },
  anual: { days: 365, price: 5000, label: 'Anual' }
}

function addDays(iso, days) {
  const d = new Date(iso)
  d.setDate(d.getDate() + Number(days || 0))
  return d.toISOString().slice(0, 10)
}

function computeExpiry(joinDateISO, planType) {
  const p = PLANS[planType]
  if (!p) return null
  if (p.days === 0) return joinDateISO
  return addDays(joinDateISO, p.days)
}

async function fetchJSON(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  })
  if (!res.ok) {
    let message = `Error ${res.status}`
    try {
      const data = await res.json()
      if (data?.error) message = data.error
    } catch (e) {
      // ignore json parse errors
    }
    throw new Error(message)
  }
  if (res.status === 204) return null
  return res.json()
}

const membersService = {
  PLANS,
  computeExpiry,
  getPlanInfo(planType) {
    return PLANS[planType] || null
  },
  async getMembers() {
    return fetchJSON(`${API_URL}/members`)
  },
  async getPlans() {
    return fetchJSON(`${API_URL}/plans`)
  },
  async addMember(data) {
    return fetchJSON(`${API_URL}/members`, { method: 'POST', body: JSON.stringify(data) })
  },
  async updateMember(id, changes) {
    return fetchJSON(`${API_URL}/members/${id}`, { method: 'PUT', body: JSON.stringify(changes) })
  },
  async deleteMember(id) {
    await fetchJSON(`${API_URL}/members/${id}`, { method: 'DELETE' })
  },
  async registerVisit(memberId, payload = {}) {
    return fetchJSON(`${API_URL}/members/${memberId}/visit`, { method: 'POST', body: JSON.stringify(payload) })
  },
  async registerPayment(memberId, payload = {}) {
    return fetchJSON(`${API_URL}/members/${memberId}/payment`, { method: 'POST', body: JSON.stringify(payload) })
  },
  async getQuickVisits() {
    return fetchJSON(`${API_URL}/quick-visits`)
  },
  async addQuickVisit(payload) {
    return fetchJSON(`${API_URL}/quick-visits`, { method: 'POST', body: JSON.stringify(payload) })
  },
  async exportToExcel(members, quickVisits) {
    // Use browser-friendly build of ExcelJS and support default/named exports
    const ExcelJSImport = await import('exceljs/dist/exceljs.min.js')
    const ExcelJS = ExcelJSImport.default || ExcelJSImport
    const workbook = new ExcelJS.Workbook()
    // Ganancias (pagos de socios + visitas rápidas)
    const earningsSheet = workbook.addWorksheet('Ganancias')
    earningsSheet.columns = [
      { header: 'Nombre', key: 'name', width: 25 },
      { header: 'Concepto', key: 'label', width: 20 },
      { header: 'Fuente', key: 'source', width: 15 },
      { header: 'Fecha/Hora', key: 'at', width: 20 },
      { header: 'Monto', key: 'amount', width: 12 }
    ]

    let totalIncome = 0

    const buildFullName = (m) => {
      const parts = [m.firstName ?? m.name, m.paterno, m.materno]
        .map(v => (typeof v === 'string' ? v : (v ?? '')))
        .map(s => s.trim())
        .filter(s => s.length > 0)
      return parts.join(' ')
    }

    members.forEach(m => {
      const fullName = buildFullName(m)
      (m.payments || []).forEach(p => {
        const amount = p.amount || 0
        earningsSheet.addRow({
          name: fullName,
          label: this.PLANS[p.type]?.label || p.type,
          source: 'Socio',
          at: p.at,
          amount
        })
        totalIncome += amount
      })
    })

    quickVisits.forEach(qv => {
      const amount = qv.amount || 0
      earningsSheet.addRow({
        name: qv.name || 'Visitante',
        label: 'Visita',
        source: 'Visitante',
        at: qv.at,
        amount
      })
      totalIncome += amount
    })

    // Visitas (entradas) con nombre y fecha
    const visitsSheet = workbook.addWorksheet('Visitas')
    visitsSheet.columns = [
      { header: 'Nombre', key: 'name', width: 25 },
      { header: 'Tipo', key: 'type', width: 12 },
      { header: 'Fecha/Hora', key: 'at', width: 20 }
    ]

    members.forEach(m => {
      const fullName = buildFullName(m)
      ;(m.visits || []).forEach(v => {
        visitsSheet.addRow({
          name: fullName,
          type: 'Socio',
          at: v.at
        })
      })
    })

    quickVisits.forEach(v => {
      visitsSheet.addRow({
        name: v.name || 'Visitante',
        type: 'Visitante',
        at: v.at
      })
    })

    // Resumen
    const summarySheet = workbook.addWorksheet('Resumen')
    summarySheet.columns = [
      { header: 'Métrica', key: 'metric', width: 25 },
      { header: 'Valor', key: 'value', width: 20 }
    ]
    summarySheet.addRow({ metric: 'Ingresos Totales', value: `$${totalIncome.toLocaleString()}` })
    summarySheet.addRow({ metric: 'Pagos Registrados', value: earningsSheet.rowCount - 1 })
    summarySheet.addRow({ metric: 'Visitas Registradas', value: visitsSheet.rowCount - 1 })
    summarySheet.addRow({ metric: 'Fecha Exportación', value: new Date().toLocaleString() })

    // Style headers
    [earningsSheet, visitsSheet, summarySheet].forEach(sheet => {
      sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
      sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F1F1F' } }
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `analisis-potros-${new Date().toISOString().slice(0, 10)}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)
  }
}

export default membersService
