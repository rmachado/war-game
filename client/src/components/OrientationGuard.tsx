import { useState, useEffect, type ReactNode } from 'react'
import { RotateCw } from 'lucide-react'

export default function OrientationGuard({ children }: { children: ReactNode }) {
  const [showOverlay, setShowOverlay] = useState(false)

  useEffect(() => {
    function check() {
      const isMobile = window.matchMedia('(pointer: coarse)').matches
      const isPortrait = window.matchMedia('(orientation: portrait)').matches
      setShowOverlay(isMobile && isPortrait)
    }
    check()
    const mqOrient = window.matchMedia('(orientation: portrait)')
    const mqPointer = window.matchMedia('(pointer: coarse)')
    mqOrient.addEventListener('change', check)
    mqPointer.addEventListener('change', check)
    return () => {
      mqOrient.removeEventListener('change', check)
      mqPointer.removeEventListener('change', check)
    }
  }, [])

  if (!showOverlay) return <>{children}</>

  return (
    <div className="fixed inset-0 z-50 bg-stone-950 flex flex-col items-center justify-center p-8">
      <div className="animate-bounce mb-8">
        <RotateCw size={64} className="text-amber-400" />
      </div>
      <h2 className="text-xl font-bold text-white text-center mb-2">Gira tu dispositivo</h2>
      <p className="text-stone-400 text-center">Usa el juego en modo horizontal para una mejor experiencia</p>
    </div>
  )
}
