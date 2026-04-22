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

// BUG FIX v3: planes mensuales/anuales usan meses calendario, no días planos
// Así "2 de enero + mensual" vence el "2 de febrero" (no el 1)
const PLANS = {
  visita:       { days: 0,   months: 0,  price: 50,   label: 'Visita' },
  semana:       { days: 7,   months: 0,  price: 150,  label: '1 Semana' },
  '15dias':     { days: 15,  months: 0,  price: 250,  label: '15 Días' },
  mensualPromo: { days: 30,  months: 1,  price: 400,  label: 'Mensual Promo' },
  estudiante:   { days: 30,  months: 1,  price: 350,  label: 'Promo Estudiantes' },
  mensual:      { days: 30,  months: 1,  price: 500,  label: 'Mensual' },
  parejas:      { days: 30,  months: 1,  price: 400,  label: 'Parejas o Más' },
  anual:        { days: 365, months: 12, price: 5000, label: 'Anual' }
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

// Genera timestamp en formato ISO pero ajustado a hora local de México
function getLocalTimestamp() {
  // Construir fecha/hora en zona America/Mexico_City y devolver como 'YYYY-MM-DDTHH:mm:ss'
  // Usa offset manual (UTC-6) como fallback si Intl falla
  try {
    const fmt = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'America/Mexico_City',
      hour12: false,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    })
    const s = fmt.format(new Date())
    return s.replace(' ', 'T')
  } catch (e) {
    // Fallback: calcular manualmente con offset -6 horas (UTC-6 es CST México)
    const now = new Date()
    const mexicoTime = new Date(now.getTime() - 6 * 60 * 60 * 1000) // UTC a UTC-6
    const y = mexicoTime.getUTCFullYear()
    const m = String(mexicoTime.getUTCMonth() + 1).padStart(2, '0')
    const d = String(mexicoTime.getUTCDate()).padStart(2, '0')
    const h = String(mexicoTime.getUTCHours()).padStart(2, '0')
    const min = String(mexicoTime.getUTCMinutes()).padStart(2, '0')
    const s = String(mexicoTime.getUTCSeconds()).padStart(2, '0')
    return `${y}-${m}-${d}T${h}:${min}:${s}`
  }
}

// Obtiene la fecha local en formato YYYY-MM-DD
function getLocalDate() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City' }).format(new Date())
}

function addDays(iso, days) {
  const [y, m, d] = (iso || '').split('-').map(Number)
  const baseUtc = Date.UTC(y, (m || 1) - 1, d || 1)
  const added = new Date(baseUtc + Number(days || 0) * 24 * 60 * 60 * 1000)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City' }).format(added)
}

// BUG FIX v3: suma meses calendario (ene 2 + 1 mes = feb 2, no feb 1)
function addMonths(iso, months) {
  const [y, m, d] = (iso || '').split('-').map(Number)
  let newMonth = (m || 1) + (months || 0)
  let newYear = y
  while (newMonth > 12) { newMonth -= 12; newYear++ }
  while (newMonth < 1)  { newMonth += 12; newYear-- }
  // overflow: ej. ene 31 + 1 mes = feb 28/29
  const lastDay = new Date(newYear, newMonth, 0).getDate()
  const newDay = Math.min(d || 1, lastDay)
  return `${newYear}-${String(newMonth).padStart(2, '0')}-${String(newDay).padStart(2, '0')}`
}

function computeExpiry(joinDateISO, planType) {
  const p = PLANS[planType]
  if (!p) return null
  if (p.months === 0 && p.days === 0) return joinDateISO   // visita
  if (p.months > 0) return addMonths(joinDateISO, p.months) // mensual/anual
  return addDays(joinDateISO, p.days)                        // semana/15dias
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

// CORS configuration - allow frontend from both local and production
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:4000',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:4000',
      'http://127.0.0.1:3000',
      'https://potros-sistema.netlify.app',
      'https://www.potros-sistema.netlify.app',
      'https://potros-gym.onrender.com'
    ]

    const allowedPatterns = [
      /localhost:\d+$/, // permite cualquier puerto local
      /127\.0\.0\.1:\d+$/, // permite 127.0.0.1 con cualquier puerto
      /\.netlify\.app$/, // permite previews de Netlify
      /\.onrender\.com$/ // permite instancias de Render
    ]
    
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      allowedPatterns.some(re => re.test(origin))
    ) {
      callback(null, true)
    } else {
      console.warn(`CORS: Origen bloqueado: ${origin}`)
      callback(new Error('Not allowed by CORS'))
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
}))
app.use(express.json())
app.use(morgan('dev'))

// Preflight handler
app.options('*', cors())

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
  const { firstName, paterno = '', materno = '', email = '', phone = '', joinDate, planType = 'mensual', quantity = 1 } = req.body || {}
  if (!firstName || !phone || !paterno || !materno) return res.status(400).json({ error: 'firstName, phone, paterno y materno son requeridos' })
  const plan = PLANS[planType]
  if (!plan) return res.status(400).json({ error: 'planType inválido' })

  const id = uid()
  const joinISO = joinDate || getLocalDate()
  const qty = Math.max(1, parseInt(quantity) || 1)
  const basePrice = plan.price
  const totalPrice = basePrice * qty
  
  // Calcular expiración con cantidad - BUG FIX v3: meses calendario
  let expiry
  if (plan.months === 0 && plan.days === 0) {
    expiry = joinISO
  } else if (plan.months > 0) {
    expiry = addMonths(joinISO, plan.months * qty)
  } else {
    expiry = addDays(joinISO, plan.days * qty)
  }
  
  const createdAt = getLocalTimestamp()

  // Convert names to uppercase
  const firstNameUpper = firstName.trim().toUpperCase()
  const paternoUpper = paterno.trim().toUpperCase()
  const maternoUpper = materno.trim().toUpperCase()
  const fullName = `${firstNameUpper} ${paternoUpper} ${maternoUpper}`.trim()

  await Member.create({ id, firstName: firstNameUpper, paterno: paternoUpper, materno: maternoUpper, email, phone, joinDate: joinISO, planType, price: totalPrice, expiry, createdAt })
  await Payment.create({ memberId: id, memberName: fullName, at: createdAt, type: planType, amount: totalPrice, createdAt })
  // Auto-register entry for new member (method='new-member' distinguishes it from paid visits)
  await Visit.create({ memberId: id, name: fullName, at: createdAt, method: 'new-member', paymentType: null, createdAt })

  res.status(201).json({
    id, firstName: firstNameUpper, paterno: paternoUpper, materno: maternoUpper, email, phone,
    joinDate: joinISO,
    planType,
    price: totalPrice,
    expiry,
    visits: [],
    payments: [{ at: createdAt, type: planType, amount: totalPrice }]
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

  const timestamp = getLocalTimestamp()
  const today     = getLocalDate()   // YYYY-MM-DD en zona México
  const name      = buildFullName(member)

  // ── DEDUP: si ya existe una visita HOY para este socio, no crear duplicado ──
  // Solo dedup para entradas normales (no pagos ni registros de nuevo socio)
  if (!paymentType && method !== 'new-member') {
    const alreadyToday = await Visit.findOne({
      memberId: id,
      at: { $regex: `^${today}` },
      method:   { $nin: ['new-member'] },
    })
    if (alreadyToday) {
      // Ya registrado hoy — devolver datos actualizados sin crear duplicado
      const members = await loadMembers()
      const updated = members.find(m => m.id === id)
      return res.json(updated)
    }
  }

  await Visit.create({ memberId: id, name, at: timestamp, method, paymentType, createdAt: timestamp })

  if (paymentType) {
    const amount = paymentType === 'visita' ? PLANS['visita'].price : (PLANS[paymentType]?.price || member.price || 0)
    const memberName = buildFullName(member)
    await Payment.create({ memberId: id, memberName, at: timestamp, type: paymentType, amount, createdAt: timestamp })
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
  const timestamp = getLocalTimestamp()
  const memberName = buildFullName(member)
  await Payment.create({ memberId: id, memberName, at: timestamp, type, amount: amt, createdAt: timestamp })
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
  // Prevent creating a quick-visit for a name that exactly matches a registered member
  try {
    const members = await Member.find()
    const requested = (name || '').toString().trim().toLowerCase()
    const match = members.find(m => buildFullName(m).toLowerCase() === requested)
    if (match) {
      return res.status(400).json({ error: 'El nombre coincide con un socio registrado. Usa el registro de entrada para anotar su entrada.' })
    }
  } catch (e) {
    console.error('Error buscando miembros al validar quick-visit:', e.message)
    // proceed; we don't want to block quick visits if member lookup fails
  }
  const timestamp = getLocalTimestamp()
  const qv = await QuickVisit.create({ name: name.trim(), at: timestamp, amount, createdAt: timestamp })
  
  // Auto-register visitor entry (with name)
  await Visit.create({ memberId: 'visitor', name: name.trim(), at: timestamp, method: 'quick-visit', paymentType: 'visita', createdAt: timestamp })
  
  res.status(201).json({ id: qv._id, name: name.trim(), at: timestamp, amount })
})

// Get all payments with member names
app.get('/payments', async (req, res) => {
  const payments = await Payment.find().sort({ at: -1 })
  res.json(payments.map(p => p.toObject()))
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

// Mantenimiento: Rellenar 'memberName' en pagos existentes
app.post('/maintenance/backfill-payment-names', async (req, res) => {
  const paymentsToFix = await Payment.find({ $or: [ { memberName: { $exists: false } }, { memberName: null }, { memberName: '' } ] })
  let updated = 0
  for (const p of paymentsToFix) {
    if (p.memberId) {
      const m = await Member.findOne({ id: p.memberId })
      if (m) {
        p.memberName = buildFullName(m)
        await p.save()
        updated++
      }
    }
  }
  res.json({ updated, message: `${updated} pagos actualizados con nombres de miembros` })
})

app.listen(PORT, () => {
  console.log(`✅ MongoDB conectado`)
  console.log(`🚀 API escuchando en puerto ${PORT}`)
  console.log(`📍 Frontend: https://potros-sistema.netlify.app`)
})
