'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from '@/hooks/useTheme'

interface Star {
  x: number
  y: number
  size: number
  opacity: number
  speed: number
  vx: number
  vy: number
}

export default function StarfieldBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const starsRef = useRef<Star[]>([])
  const mouseRef = useRef({ x: 0, y: 0 })
  const animationFrameRef = useRef<number>()
  const isDarkMode = useTheme()

  useEffect(() => {
    if (!isDarkMode) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const initStars = () => {
      const stars: Star[] = []
      const starCount = Math.floor((canvas.width * canvas.height) / 8000)
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 0.5,
          opacity: Math.random() * 0.5 + 0.3,
          speed: Math.random() * 0.05 + 0.02,
          vx: 0,
          vy: 0,
        })
      }
      starsRef.current = stars
    }
    initStars()

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', handleMouseMove, { passive: true })

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const mouse = mouseRef.current
      const stars = starsRef.current
      const maxMouseDist = 200
      const maxLineDist = 100

      // Update and draw stars
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i]
        const dx = mouse.x - star.x
        const dy = mouse.y - star.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < maxMouseDist && dist > 0) {
          const force = (maxMouseDist - dist) / maxMouseDist
          star.vx -= (dx / dist) * force * 0.5
          star.vy -= (dy / dist) * force * 0.5
        }

        star.x += star.vx
        star.y += star.vy
        star.vx *= 0.95
        star.vy *= 0.95

        star.opacity += (Math.random() - 0.5) * 0.02
        star.opacity = Math.max(0.1, Math.min(0.8, star.opacity))

        if (star.x < 0) star.x = canvas.width
        if (star.x > canvas.width) star.x = 0
        if (star.y < 0) star.y = canvas.height
        if (star.y > canvas.height) star.y = 0

        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        if (star.size > 1.5) {
          const gradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * 3)
          gradient.addColorStop(0, `rgba(255, 255, 255, ${star.opacity})`)
          gradient.addColorStop(0.5, `rgba(147, 197, 253, ${star.opacity * 0.3})`)
          gradient.addColorStop(1, 'rgba(59, 130, 246, 0)')
          ctx.fillStyle = gradient
        } else {
          ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`
        }
        ctx.fill()
      }

      // Draw connections — each pair once (i < j), batch into single path per stroke call
      ctx.beginPath()
      ctx.lineWidth = 0.5
      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const dx = stars[j].x - stars[i].x
          const dy = stars[j].y - stars[i].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < maxLineDist) {
            ctx.moveTo(stars[i].x, stars[i].y)
            ctx.lineTo(stars[j].x, stars[j].y)
          }
        }
      }
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.08)'
      ctx.stroke()

      animationFrameRef.current = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      window.removeEventListener('mousemove', handleMouseMove)
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    }
  }, [isDarkMode])

  if (!isDarkMode) return null

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  )
}
