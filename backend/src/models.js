import mongoose from 'mongoose'

const memberSchema = new mongoose.Schema({
  id: String,
  firstName: String,
  paterno: String,
  materno: String,
  email: String,
  phone: String,
  joinDate: String,
  planType: String,
  price: Number,
  expiry: String,
  createdAt: { type: Date, default: Date.now }
})

const visitSchema = new mongoose.Schema({
  memberId: String,
  name: String,
  at: String,
  method: String,
  paymentType: String,
  createdAt: { type: Date, default: Date.now }
})

const paymentSchema = new mongoose.Schema({
  memberId: String,
  at: String,
  type: String,
  amount: Number,
  createdAt: { type: Date, default: Date.now }
})

const quickVisitSchema = new mongoose.Schema({
  name: String,
  at: String,
  amount: Number,
  createdAt: { type: Date, default: Date.now }
})

export const Member = mongoose.model('Member', memberSchema)
export const Visit = mongoose.model('Visit', visitSchema)
export const Payment = mongoose.model('Payment', paymentSchema)
export const QuickVisit = mongoose.model('QuickVisit', quickVisitSchema)
