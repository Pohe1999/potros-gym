const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export const PLANS = {
  visita: { days: 0, price: 50, label: 'Visita' },
  semana: { days: 7, price: 150, label: '1 Semana' },
  '15dias': { days: 15, price: 250, label: '15 Días' },
  mensualPromo: { days: 30, price: 400, label: 'Mensual Promo Dic' },
  estudiante: { days: 30, price: 350, label: 'Promo Estudiantes' },
  mensual: { days: 30, price: 500, label: 'Mensual' },
  parejas: { days: 30, price: 400, label: 'Parejas o Más' },
  anual: { days: 365, price: 5000, label: 'Anual' }
}

// Obtiene la fecha local en formato YYYY-MM-DD en la zona America/Mexico_City
function getTodayLocal() {
  // 'en-CA' produce YYYY-MM-DD que es fácil de parsear
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City' }).format(new Date())
}

function addDays(iso, days) {
  // iso = 'YYYY-MM-DD'
  const [y, m, d] = (iso || '').split('-').map(Number)
  const baseUtc = Date.UTC(y, (m || 1) - 1, d || 1)
  const added = new Date(baseUtc + Number(days || 0) * 24 * 60 * 60 * 1000)
  // Formatear en zona de México a YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City' }).format(added)
}

function computeExpiry(joinDateISO, planType) {
  const p = PLANS[planType]
  if (!p) return null
  if (p.days === 0) return joinDateISO
  
  // Special case: Mensual Promo Dic expires on Feb 1, 2026
  if (planType === 'mensualPromo') {
    return '2026-02-01'
  }
  
  return addDays(joinDateISO, p.days)
}

function formatSpanishDate(isoDate) {
  if (!isoDate) return ''
  // Mostrar la fecha respetando la zona de México
  const date = new Date((isoDate || '') + 'T00:00:00')
  const options = { timeZone: 'America/Mexico_City', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
  const formatted = date.toLocaleDateString('es-ES', options)
  // Capitalize first letter
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
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
  formatSpanishDate,
  getTodayLocal,
  getLocalDateAgo,
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
  async getPayments() {
    return fetchJSON(`${API_URL}/payments`)
  }
}

// Helper para calcular fechas en zona Mexico (YYYY-MM-DD) hace X días
function getLocalDateAgo(daysAgo) {
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City' }).format(new Date())
  const [y, m, d] = todayStr.split('-').map(Number)
  const baseUtc = Date.UTC(y, m - 1, d)
  const target = new Date(baseUtc - daysAgo * 24 * 60 * 60 * 1000)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City' }).format(target)
}

export default membersService
