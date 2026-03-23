'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from '@/hooks/useTheme'

export default function MouseGlow() {
  const glowRef = useRef<HTMLDivElement>(null)
  const isDarkMode = useTheme()

  useEffect(() => {
    if (!isDarkMode) return

    const handleMouseMove = (e: MouseEvent) => {
      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${e.clientX - 200}px, ${e.clientY - 200}px)`
      }
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [isDarkMode])

  if (!isDarkMode) return null

  return <div ref={glowRef} className="mouse-glow" />
}
