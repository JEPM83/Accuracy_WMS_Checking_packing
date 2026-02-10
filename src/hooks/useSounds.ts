import { useCallback, useState, useEffect } from 'react'

export function useSounds() {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const stored = localStorage.getItem('soundEnabled')
    return stored !== null ? stored === 'true' : true
  })

  useEffect(() => {
    localStorage.setItem('soundEnabled', String(soundEnabled))
  }, [soundEnabled])

  const playBeep = useCallback(
    (frequency: number, duration: number) => {
      if (!soundEnabled) return

      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.frequency.value = frequency
        oscillator.type = 'sine'

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration)

        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + duration)
      } catch (error) {
        console.error('Error reproduciendo sonido:', error)
      }
    },
    [soundEnabled]
  )

  const playSuccess = useCallback(() => {
    playBeep(800, 0.1) // Beep corto agudo
  }, [playBeep])

  const playError = useCallback(() => {
    playBeep(200, 0.2) // Beep largo grave
  }, [playBeep])

  return {
    soundEnabled,
    setSoundEnabled,
    playSuccess,
    playError,
  }
}
