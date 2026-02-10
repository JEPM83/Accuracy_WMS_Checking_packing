import type { LabelWithDetails } from '../../../types'

interface LabelCardsProps {
  labels: LabelWithDetails[]
  selectedLabelId: string
  onLabelChange: (labelId: string) => void
  disabled: boolean
  onCloseLabel?: (label: LabelWithDetails) => void
  onViewScans?: (label: LabelWithDetails) => void
}

export default function LabelCards({
  labels,
  selectedLabelId,
  onLabelChange,
  disabled,
  onCloseLabel,
  onViewScans,
}: LabelCardsProps) {
  const openLabels = labels.filter((l) => l.status === 'OPEN')

  if (openLabels.length === 0) {
    return (
      <div className="text-center py-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <p className="text-yellow-800 font-medium">No hay etiquetas abiertas</p>
        <p className="text-sm text-yellow-700 mt-1">
          Cree una etiqueta primero para poder escanear productos
        </p>
      </div>
    )
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {openLabels.map((label, index) => {
        const isSelected = label.labelId === selectedLabelId
        const progress = label.theoreticalWeight > 0
          ? (label.itemCount / label.theoreticalWeight) * 100
          : 0

        return (
          <div
            key={label.labelId}
            className={`
              flex-shrink-0 min-w-[200px] rounded-lg border-2 transition-all font-outfit
              ${
                isSelected
                  ? 'bg-gradient-to-br from-accuracy-medium to-accuracy-navy border-accuracy-medium text-white shadow-lg scale-105'
                  : 'bg-white border-gray-300 text-gray-900 hover:border-accuracy-medium-light hover:shadow-md'
              }
              ${disabled ? 'opacity-50' : ''}
            `}
          >
            <button
              onClick={() => !disabled && onLabelChange(label.labelId)}
              disabled={disabled}
              className={`w-full p-4 text-left ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-bold">
                  Etiqueta #{label.seq.toString().padStart(2, '0')}
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    isSelected ? 'bg-white/20' : 'bg-gray-100'
                  }`}
                >
                  {index + 1}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm mb-2">
                <span className={isSelected ? 'text-white/90' : 'text-gray-600'}>
                  Items:
                </span>
                <span className="font-bold">{label.itemCount}</span>
              </div>

              {/* Barra de progreso mini */}
              <div
                className={`h-2 rounded-full overflow-hidden ${
                  isSelected ? 'bg-white/20' : 'bg-gray-200'
                }`}
              >
                <div
                  className={`h-full transition-all ${
                    isSelected ? 'bg-white' : 'bg-accuracy-medium'
                  }`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>

              {isSelected && (
                <div className="mt-2 text-xs text-white/90 font-medium">
                  ✓ ACTIVA
                </div>
              )}
            </button>

            {/* Botones de acción - Solo visible si está seleccionada */}
            {isSelected && (onCloseLabel || onViewScans) && (
              <div className="px-4 pb-3 flex gap-2">
                {onViewScans && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onViewScans(label)
                    }}
                    title="Ver scans"
                    className="flex-1 flex items-center justify-center py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all hover:scale-105"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                )}
                {onCloseLabel && label.itemCount > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onCloseLabel(label)
                    }}
                    title="Cerrar etiqueta"
                    className="flex-1 flex items-center justify-center py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all hover:scale-105"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
