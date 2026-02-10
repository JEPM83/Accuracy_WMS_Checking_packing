import { useState, useEffect } from 'react'

interface SessionStatsProps {
  orderId: string
  totalScans: number
  completedLines: number
  totalLines: number
  sessionStartTime: number
}

export default function SessionStats({
  orderId,
  totalScans,
  completedLines,
  totalLines,
  sessionStartTime,
}: SessionStatsProps) {
  const [elapsedTime, setElapsedTime] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Date.now() - sessionStartTime)
    }, 1000)

    return () => clearInterval(interval)
  }, [sessionStartTime])

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const avgSpeed = elapsedTime > 0 ? (totalScans / (elapsedTime / 1000 / 60)).toFixed(1) : '0.0'

  const stats = [
    {
      icon: '⏱️',
      label: 'Tiempo',
      value: formatTime(elapsedTime),
      unit: 'min:seg',
      color: 'from-accuracy-light to-accuracy-medium-light',
      textColor: 'text-accuracy-navy',
    },
    {
      icon: '📦',
      label: 'Scans',
      value: totalScans.toString(),
      unit: 'registrados',
      color: 'from-accuracy-medium to-accuracy-navy',
      textColor: 'text-white',
    },
    {
      icon: '⚡',
      label: 'Velocidad',
      value: avgSpeed,
      unit: 'items/min',
      color: 'from-accuracy-medium-light to-accuracy-medium',
      textColor: 'text-white',
    },
    {
      icon: '🎯',
      label: 'Líneas',
      value: `${completedLines}/${totalLines}`,
      unit: 'completas',
      color: 'from-accuracy-navy to-accuracy-gray',
      textColor: 'text-white',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat, index) => (
        <div
          key={index}
          className={`bg-gradient-to-br ${stat.color} rounded-xl shadow-lg hover:shadow-xl transition-all p-4 border border-white/20`}
        >
          <div className="flex flex-col items-center text-center">
            <span className="text-3xl mb-2">{stat.icon}</span>
            <p className={`text-2xl font-bold ${stat.textColor} font-outfit leading-tight`}>
              {stat.value}
            </p>
            <p className={`text-xs ${stat.textColor} opacity-90 mt-1 font-outfit font-light uppercase tracking-wide`}>
              {stat.label}
            </p>
            <p className={`text-[10px] ${stat.textColor} opacity-70 mt-0.5 font-outfit`}>
              {stat.unit}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
