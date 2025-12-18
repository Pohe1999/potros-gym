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
  }
}

export default membersService
