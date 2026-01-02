import React, { useState, useEffect } from 'react'
import membersService from '../services/membersService'

export default function MemberForm({ onSave }) {
  const [firstName, setFirstName] = useState('')
  const [paterno, setPaterno] = useState('')
  const [materno, setMaterno] = useState('')
  const [phone, setPhone] = useState('')
  const [joinDate, setJoinDate] = useState(new Date().toISOString().slice(0,10))
  const [planType, setPlanType] = useState('mensual')
  const [quantity, setQuantity] = useState(1)
  const [pricePreview, setPricePreview] = useState(membersService.PLANS['mensual'].price)
  const [expiryPreview, setExpiryPreview] = useState(membersService.computeExpiry(joinDate, 'mensual'))
  const [error, setError] = useState('')

  useEffect(() => {
    const p = membersService.PLANS[planType] || { price: 0 }
    const baseDays = p.days || 0
    const totalDays = baseDays === 0 ? 0 : baseDays * quantity
    
    setPricePreview(p.price * quantity)
    
    // Calcular fecha de expiración con multiplicador
    if (planType === 'visita') {
      setExpiryPreview(joinDate)
    } else if (planType === 'mensualPromo' && quantity === 1) {
      setExpiryPreview('2026-02-01')
    } else {
      const d = new Date(joinDate)
      d.setDate(d.getDate() + totalDays)
      setExpiryPreview(d.toISOString().slice(0, 10))
    }
  }, [planType, joinDate, quantity])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!firstName.trim() || !paterno.trim() || !materno.trim()) {
      setError('Nombre, apellido paterno y materno son requeridos')
      return
    }
    try {
      await membersService.addMember({ firstName, paterno, materno, phone, joinDate, planType, quantity })
      setFirstName('')
      setPaterno('')
      setMaterno('')
      setPhone('')
      setJoinDate(new Date().toISOString().slice(0,10))
      setPlanType('mensual')
      setQuantity(1)
      onSave()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="bg-gray-900 -mx-4 md:mx-0 p-3 md:p-6 rounded-none md:rounded-lg card-shadow md:border-2 border-gray-800">
      <h2 className="text-lg md:text-2xl font-semibold mb-6 flex items-center gap-2 px-1 md:px-0">
        <span>➕</span> Registrar Nuevo Socio
      </h2>
      <form onSubmit={submit} className="space-y-4 px-1 md:px-0">
        {error && (
          <div className="p-3 bg-red-900 border border-red-700 text-red-200 rounded-lg text-sm flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}
        
        <div className="bg-gray-800 p-3 md:p-4 rounded-lg space-y-3 md:space-y-4">
          <h3 className="text-xs md:text-sm font-semibold text-gray-400 uppercase">Datos Personales</h3>
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-300 mb-2">Nombre(s) *</label>
            <input 
              className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 focus:border-potros-red focus:outline-none transition-all text-sm md:text-lg" 
              value={firstName} 
              onChange={e => setFirstName(e.target.value.toUpperCase())} 
              required 
              placeholder="Ej: JUAN CARLOS"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-300 mb-1">Apellido Paterno *</label>
              <input 
                className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 focus:border-potros-red focus:outline-none transition-all text-sm md:text-base" 
                value={paterno} 
                onChange={e => setPaterno(e.target.value.toUpperCase())}
                placeholder="Ej: LÓPEZ" 
                required
              />
            </div>
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-300 mb-1">Apellido Materno *</label>
              <input 
                className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 focus:border-potros-red focus:outline-none transition-all text-sm md:text-base" 
                value={materno} 
                onChange={e => setMaterno(e.target.value.toUpperCase())}
                placeholder="Ej: GARCÍA" 
                required
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-3 md:p-4 rounded-lg space-y-3 md:space-y-4">
          <h3 className="text-xs md:text-sm font-semibold text-gray-400 uppercase">Contacto</h3>
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-300 mb-1">Teléfono (WhatsApp) *</label>
            <input 
              className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 focus:border-potros-red focus:outline-none transition-all text-sm md:text-lg" 
              value={phone} 
              onChange={e => setPhone(e.target.value)} 
              placeholder="55 1234 5678" 
              required 
            />
          </div>
        </div>
        <div className="bg-gray-800 p-3 md:p-4 rounded-lg space-y-3 md:space-y-4">
          <h3 className="text-xs md:text-sm font-semibold text-gray-400 uppercase">Membresía</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-300 mb-1">Fecha de ingreso</label>
              <input 
                type="date" 
                className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 focus:border-potros-red focus:outline-none transition-all text-sm md:text-base" 
                value={joinDate} 
                onChange={e=>setJoinDate(e.target.value)} 
              />
            </div>
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-300 mb-1">Tipo de plan</label>
              <select 
                className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 focus:border-potros-red focus:outline-none transition-all text-sm md:text-base" 
                value={planType} 
                onChange={e=>setPlanType(e.target.value)}
              >
                <option value="semana">📅 1 Semana — $150</option>
                <option value="15dias">📅 15 Días — $250</option>
                <option value="estudiante">🎓 Promo Estudiantes — $350</option>
                <option value="mensual">📆 Mensual — $500</option>
                <option value="parejas">👫 Parejas o Más — $400</option>
                <option value="anual">🎉 Anual — $5,000</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-300 mb-1">
              {planType === 'anual' ? 'Cantidad de años' : planType === '15dias' ? 'Cantidad de períodos' : 'Cantidad de meses'}
            </label>
            <div className="flex gap-2 items-center">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-3 bg-gray-900 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors font-semibold text-potros-red"
              >
                −
              </button>
              <input 
                type="number" 
                min="1" 
                max="24"
                className="flex-1 p-3 rounded-lg bg-gray-900 border border-gray-700 focus:border-potros-red focus:outline-none transition-all text-sm md:text-base text-center font-semibold" 
                value={quantity}
                onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              />
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 py-3 bg-gray-900 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors font-semibold text-potros-red"
              >
                +
              </button>
            </div>
          </div>
          
          <div className="bg-gray-900 p-2 md:p-4 rounded-lg border border-gray-700">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-400">Precio total</div>
                <div className="text-2xl md:text-3xl font-bold text-potros-red">${pricePreview.toLocaleString()}</div>
                {quantity > 1 && (
                  <div className="text-xs text-gray-500 mt-1">${(pricePreview / quantity).toLocaleString()} × {quantity}</div>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Vencimiento</div>
                <div className="text-base md:text-lg font-semibold text-green-400">{membersService.formatSpanishDate(expiryPreview)}</div>
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
