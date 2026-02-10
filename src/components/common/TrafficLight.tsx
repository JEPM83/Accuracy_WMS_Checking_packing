import type { TrafficLight as TrafficLightType } from '../../types'

interface TrafficLightProps {
  status: TrafficLightType
  size?: 'sm' | 'md' | 'lg'
}

export default function TrafficLight({ status, size = 'md' }: TrafficLightProps) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  const colorClasses = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  }

  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizeClasses[size]} ${colorClasses[status]} rounded-full shadow-sm`}
        title={status === 'green' ? 'Completo' : status === 'yellow' ? 'En progreso' : 'Incompleto'}
      />
    </div>
  )
}
