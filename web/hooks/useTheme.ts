import { useEffect, useState } from 'react'

export function useTheme() {
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const check = () => {
      setIsDarkMode(document.documentElement.getAttribute('data-theme') === 'dark')
    }
    check()
    const observer = new MutationObserver(check)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  return isDarkMode
}
