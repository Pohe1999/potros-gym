import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

export default function CustomCursor() {
  const [isPointer, setIsPointer] = useState(false)
  const [isHidden,  setIsHidden]  = useState(true)
  const [isClick,   setIsClick]   = useState(false)

  const cursorX = useMotionValue(-200)
  const cursorY = useMotionValue(-200)

  // Dot — respuesta ultra rápida
  const dotX = useSpring(cursorX, { damping: 22, stiffness: 820, mass: 0.28 })
  const dotY = useSpring(cursorY, { damping: 22, stiffness: 820, mass: 0.28 })

  // Ring — sigue con inercia
  const ringX = useSpring(cursorX, { damping: 30, stiffness: 320, mass: 0.72 })
  const ringY = useSpring(cursorY, { damping: 30, stiffness: 320, mass: 0.72 })

  useEffect(() => {
    // Ocultar cursor nativo en desktop
    const style = document.createElement('style')
    style.id = 'custom-cursor-style'
    style.textContent = `@media (min-width: 768px) { *, *::before, *::after { cursor: none !important; } }`
    document.head.appendChild(style)

    const onMove = (e) => {
      cursorX.set(e.clientX)
      cursorY.set(e.clientY)
      if (isHidden) setIsHidden(false)

      const el = e.target
      if (!(el instanceof Element)) {
        setIsPointer(false)
        return
      }
      const pointer =
        el.tagName === 'BUTTON' || el.tagName === 'A' ||
        el.tagName === 'INPUT'  || el.tagName === 'SELECT' ||
        el.tagName === 'TEXTAREA' || el.tagName === 'LABEL' ||
        !!el.closest('button') || !!el.closest('a') ||
        window.getComputedStyle(el).cursor === 'pointer'
      setIsPointer(!!pointer)
    }

    const onDown  = () => setIsClick(true)
    const onUp    = () => setIsClick(false)
    const onLeave = () => setIsHidden(true)
    const onEnter = () => setIsHidden(false)

    window.addEventListener('mousemove',   onMove,  { passive: true })
    window.addEventListener('mousedown',   onDown)
    window.addEventListener('mouseup',     onUp)
    document.addEventListener('mouseleave', onLeave)
    document.addEventListener('mouseenter', onEnter)

    return () => {
      document.getElementById('custom-cursor-style')?.remove()
      window.removeEventListener('mousemove',   onMove)
      window.removeEventListener('mousedown',   onDown)
      window.removeEventListener('mouseup',     onUp)
      document.removeEventListener('mouseleave', onLeave)
      document.removeEventListener('mouseenter', onEnter)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // No renderizar en móvil/ táctil — se oculta con CSS también
  return (
    <div className="hidden md:block" aria-hidden="true">
      {/* Ring exterior con inercia */}
      <motion.div
        className="fixed top-0 left-0 z-[9998] pointer-events-none"
        style={{ x: ringX, y: ringY, translateX: '-50%', translateY: '-50%' }}
      >
        <motion.div
          animate={{
            width:   isPointer ? 48 : 36,
            height:  isPointer ? 48 : 36,
            opacity: isHidden  ? 0  : isPointer ? 0.75 : 0.22,
            scale:   isClick   ? 0.8 : 1,
            borderColor: isPointer ? 'rgba(214,40,40,1)' : 'rgba(255,255,255,0.5)',
          }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          style={{ borderRadius: '50%', border: '1.5px solid' }}
        />
        {/* Glow cuando hay pointer */}
        {isPointer && (
          <motion.div
            animate={{ opacity: isHidden ? 0 : 0.25 }}
            style={{
              position: 'absolute', inset: -8, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(214,40,40,0.6) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
        )}
      </motion.div>

      {/* Punto central — super responsivo */}
      <motion.div
        className="fixed top-0 left-0 z-[9999] pointer-events-none"
        style={{ x: dotX, y: dotY, translateX: '-50%', translateY: '-50%' }}
      >
        <motion.div
          animate={{
            width:           isClick ? 4 : isPointer ? 10 : 6,
            height:          isClick ? 4 : isPointer ? 10 : 6,
            backgroundColor: isPointer ? '#d62828' : '#ffffff',
            opacity:         isHidden ? 0 : 1,
            boxShadow:       isPointer
              ? '0 0 16px 5px rgba(214,40,40,0.55)'
              : '0 0 8px 2px rgba(255,255,255,0.3)',
            scale:           isClick ? 0.6 : 1,
          }}
          transition={{ duration: 0.12, ease: 'easeOut' }}
          style={{ borderRadius: '50%' }}
        />
      </motion.div>
    </div>
  )
}
