import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { Member, Visit, Payment, QuickVisit } from './models.js'

dotenv.config()

const PORT = process.env.PORT || 4000
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/potros-gym'

// Connect to MongoDB
mongoose.connect(MONGO_URI).then(() => {
  console.log(`✅ MongoDB conectado: ${MONGO_URI}`)
}).catch(err => {
  console.error(`❌ Error conectando MongoDB:`, err.message)
  process.exit(1)
})

const PLANS = {
  visita: { days: 0, price: 50, label: 'Visita' },
  semana: { days: 7, price: 150, label: '1 Semana' },
  '15dias': { days: 15, price: 250, label: '15 Días' },
  mensualPromo: { days: 30, price: 400, label: 'Mensual Promo Dic' },
  mensual: { days: 30, price: 500, label: 'Mensual' },
  anual: { days: 365, price: 5000, label: 'Anual' }
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
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

function buildFullName(m) {
  const parts = [m.firstName ?? m.name, m.paterno, m.materno]
    .map(v => (typeof v === 'string' ? v : (v ?? '')))
    .map(s => s.trim())
    .filter(s => s.length > 0)
  return parts.join(' ')
}

async function loadMembers() {
  const members = await Member.find().sort({ createdAt: -1 })
  const visits = await Visit.find()
  const payments = await Payment.find()

  const visitsByMember = visits.reduce((acc, v) => {
    acc[v.memberId] = acc[v.memberId] || []
    acc[v.memberId].push({ id: v._id, at: v.at, method: v.method, paymentType: v.paymentType, name: v.name })
    return acc
  }, {})

  const paymentsByMember = payments.reduce((acc, p) => {
    acc[p.memberId] = acc[p.memberId] || []
    acc[p.memberId].push({ id: p._id, at: p.at, type: p.type, amount: p.amount })
    return acc
  }, {})

  return members.map(m => ({
    ...m.toObject(),
    visits: visitsByMember[m.id] || [],
    payments: paymentsByMember[m.id] || []
  }))
}

const app = express()
app.use(cors())
app.use(express.json())
app.use(morgan('dev'))

app.get('/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() })
})

app.get('/plans', (req, res) => {
  res.json(PLANS)
})

app.get('/members', async (req, res) => {
  const members = await loadMembers()
  res.json(members)
})

app.post('/members', async (req, res) => {
  const { firstName, paterno = '', materno = '', email = '', phone = '', joinDate, planType = 'mensual' } = req.body || {}
  if (!firstName || !phone) return res.status(400).json({ error: 'firstName y phone son requeridos' })
  const plan = PLANS[planType]
  if (!plan) return res.status(400).json({ error: 'planType inválido' })

  const id = uid()
  const joinISO = joinDate || new Date().toISOString().slice(0, 10)
  const price = plan.price
  const expiry = computeExpiry(joinISO, planType)
  const createdAt = new Date().toISOString()

  await Member.create({ id, firstName, paterno, materno, email, phone, joinDate: joinISO, planType, price, expiry, createdAt })
  await Payment.create({ memberId: id, at: createdAt, type: planType, amount: price })

  res.status(201).json({
    id, firstName, paterno, materno, email, phone,
    joinDate: joinISO,
    planType,
    price,
    expiry,
    visits: [],
    payments: [{ at: createdAt, type: planType, amount: price }]
  })
})

app.put('/members/:id', async (req, res) => {
  const { id } = req.params
  const current = await Member.findOne({ id })
  if (!current) return res.status(404).json({ error: 'No encontrado' })

  const {
    firstName = current.firstName,
    paterno = current.paterno,
    materno = current.materno,
    email = current.email,
    phone = current.phone,
    joinDate = current.joinDate,
    planType = current.planType
  } = req.body || {}

  const plan = PLANS[planType]
  if (!plan) return res.status(400).json({ error: 'planType inválido' })

  const price = plan.price
  const expiry = computeExpiry(joinDate, planType)

  await Member.updateOne({ id }, { firstName, paterno, materno, email, phone, joinDate, planType, price, expiry })

  const members = await loadMembers()
  const member = members.find(m => m.id === id)
  res.json(member)
})

app.delete('/members/:id', async (req, res) => {
  const { id } = req.params
  await Visit.deleteMany({ memberId: id })
  await Payment.deleteMany({ memberId: id })
  await Member.deleteOne({ id })
  res.status(204).end()
})

app.post('/members/:id/visit', async (req, res) => {
  const { id } = req.params
  const { paymentType = null, method = 'manual' } = req.body || {}
  const member = await Member.findOne({ id })
  if (!member) return res.status(404).json({ error: 'No encontrado' })

  const timestamp = new Date().toISOString()
  const name = buildFullName(member)
  await Visit.create({ memberId: id, name, at: timestamp, method, paymentType })

  if (paymentType) {
    const amount = paymentType === 'visita' ? PLANS['visita'].price : (PLANS[paymentType]?.price || member.price || 0)
    await Payment.create({ memberId: id, at: timestamp, type: paymentType, amount })
  }

  const members = await loadMembers()
  const updated = members.find(m => m.id === id)
  res.json(updated)
})

app.post('/members/:id/payment', async (req, res) => {
  const { id } = req.params
  const { type, amount } = req.body || {}
  const member = await Member.findOne({ id })
  if (!member) return res.status(404).json({ error: 'No encontrado' })
  if (!type) return res.status(400).json({ error: 'type requerido' })
  const amt = amount ?? PLANS[type]?.price ?? member.price ?? 0
  const timestamp = new Date().toISOString()
  await Payment.create({ memberId: id, at: timestamp, type, amount: amt })
  const members = await loadMembers()
  const updated = members.find(m => m.id === id)
  res.json(updated)
})

app.get('/quick-visits', async (req, res) => {
  const rows = await QuickVisit.find().sort({ at: -1 })
  res.json(rows.map(r => ({ ...r.toObject(), id: r._id })))
})

app.post('/quick-visits', async (req, res) => {
  const { name, amount = 50 } = req.body || {}
  if (!name) return res.status(400).json({ error: 'name requerido' })
  const timestamp = new Date().toISOString()
  const qv = await QuickVisit.create({ name: name.trim(), at: timestamp, amount })
  
  // Auto-register visitor entry (with name)
  await Visit.create({ memberId: 'visitor', name: name.trim(), at: timestamp, method: 'quick-visit', paymentType: 'visita' })
  
  res.status(201).json({ id: qv._id, name: name.trim(), at: timestamp, amount })
})

// Mantenimiento: Rellenar 'name' en visitas existentes
app.post('/maintenance/backfill-visit-names', async (req, res) => {
  const toFix = await Visit.find({ $or: [ { name: { $exists: false } }, { name: null }, { name: '' } ] })
  let updated = 0
  for (const v of toFix) {
    let name = null
    if (v.memberId && v.memberId !== 'visitor') {
      const m = await Member.findOne({ id: v.memberId })
      if (m) name = buildFullName(m)
    } else if (v.memberId === 'visitor') {
      const qv = await QuickVisit.findOne({ at: v.at })
      if (qv?.name) name = qv.name.trim()
    }
    if (name) {
      v.name = name
      await v.save()
      updated++
    }
  }
  res.json({ updated })
})

app.listen(PORT, () => {
  console.log(`🚀 API escuchando en http://localhost:${PORT}`)
})
