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
  createdAt: String
})

const visitSchema = new mongoose.Schema({
  memberId: String,
  name: String,
  at: String,
  method: String,
  paymentType: String,
  createdAt: String
})

const paymentSchema = new mongoose.Schema({
  memberId: String,
  memberName: String,
  at: String,
  type: String,
  amount: Number,
  createdAt: String
})

const quickVisitSchema = new mongoose.Schema({
  name: String,
  at: String,
  amount: Number,
  createdAt: String
})

export const Member = mongoose.model('Member', memberSchema)
export const Visit = mongoose.model('Visit', visitSchema)
export const Payment = mongoose.model('Payment', paymentSchema)
export const QuickVisit = mongoose.model('QuickVisit', quickVisitSchema)
