import React, { useState, useEffect } from 'react'
import membersService from '../services/membersService'

export default function MemberForm({ onSave }) {
  const [firstName, setFirstName] = useState('')
  const [paterno, setPaterno] = useState('')
  const [materno, setMaterno] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [joinDate, setJoinDate] = useState(new Date().toISOString().slice(0,10))
  const [planType, setPlanType] = useState('mensual')
  const [pricePreview, setPricePreview] = useState(membersService.PLANS['mensual'].price)
  const [expiryPreview, setExpiryPreview] = useState(membersService.computeExpiry(joinDate, 'mensual'))
  const [error, setError] = useState('')

  useEffect(() => {
    const p = membersService.PLANS[planType] || { price: 0 }
    setPricePreview(p.price)
    setExpiryPreview(membersService.computeExpiry(joinDate, planType))
  }, [planType, joinDate])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!firstName.trim()) {
      setError('El nombre es requerido')
      return
    }
    try {
      await membersService.addMember({ firstName, paterno, materno, email, phone, joinDate, planType })
      setFirstName('')
      setPaterno('')
      setMaterno('')
      setEmail('')
      setPhone('')
      setJoinDate(new Date().toISOString().slice(0,10))
      setPlanType('mensual')
      onSave()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="bg-gray-900 p-6 rounded-lg card-shadow border-2 border-gray-800">
      <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
        <span>➕</span> Registrar Nuevo Socio
      </h2>
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-900 border border-red-700 text-red-200 rounded-lg text-sm flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}
        
        <div className="bg-gray-800 p-4 rounded-lg space-y-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase">Datos Personales</h3>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Nombre(s) *</label>
            <input 
              className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 focus:border-potros-red focus:outline-none transition-all text-lg" 
              value={firstName} 
              onChange={e => setFirstName(e.target.value)} 
              required 
              placeholder="Ej: Juan Carlos"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Apellido Paterno</label>
              <input 
                className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 focus:border-potros-red focus:outline-none transition-all" 
                value={paterno} 
                onChange={e => setPaterno(e.target.value)}
                placeholder="Ej: López" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Apellido Materno</label>
              <input 
                className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 focus:border-potros-red focus:outline-none transition-all" 
                value={materno} 
                onChange={e => setMaterno(e.target.value)}
                placeholder="Ej: García" 
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg space-y-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase">Contacto</h3>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Teléfono (WhatsApp) *</label>
            <input 
              className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 focus:border-potros-red focus:outline-none transition-all text-lg" 
              value={phone} 
              onChange={e => setPhone(e.target.value)} 
              placeholder="55 1234 5678" 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email (opcional)</label>
            <input 
              type="email" 
              className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 focus:border-potros-red focus:outline-none transition-all" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com" 
            />
          </div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg space-y-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase">Membresía</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Fecha de ingreso</label>
              <input 
                type="date" 
                className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 focus:border-potros-red focus:outline-none transition-all" 
                value={joinDate} 
                onChange={e=>setJoinDate(e.target.value)} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Tipo de plan</label>
              <select 
                className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 focus:border-potros-red focus:outline-none transition-all" 
                value={planType} 
                onChange={e=>setPlanType(e.target.value)}
              >
                <option value="semana">📅 1 Semana — $150</option>
                <option value="15dias">📅 15 Días — $250</option>
                <option value="mensualPromo">📆 Mensual Promo Dic — $400</option>
                <option value="mensual">📆 Mensual — $500</option>
                <option value="anual">🎉 Anual — $5,000</option>
              </select>
            </div>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-400">Precio del plan</div>
                <div className="text-3xl font-bold text-potros-red">${pricePreview}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Vencimiento</div>
                <div className="text-lg font-semibold text-green-400">{expiryPreview}</div>
              </div>
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          className="w-full bg-gradient-to-r from-potros-red to-red-700 text-white px-6 py-4 rounded-lg font-bold text-lg hover:from-red-700 hover:to-potros-red transition-all shadow-lg"
        >
          ✅ Registrar Socio
        </button>
      </form>
    </div>
  )
}
