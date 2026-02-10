import type { LabelWithDetails } from '../../../types'
import LabelCard from './LabelCard'
import Button from '../../common/Button'

interface LabelsListProps {
  labels: LabelWithDetails[]
  orderClosed: boolean
  onCreateLabel: () => void
  onCloseLabel: (labelId: string) => void
  onReopenLabel: (labelId: string) => void
  onDeleteLabel: (labelId: string) => void
  onViewScans: (labelId: string) => void
  isExpanded: boolean
  onToggleExpand: () => void
}

export default function LabelsList({
  labels,
  orderClosed,
  onCreateLabel,
  onCloseLabel,
  onReopenLabel,
  onDeleteLabel,
  onViewScans,
  isExpanded,
  onToggleExpand,
}: LabelsListProps) {
  return (
    <div className="bg-gradient-to-br from-white to-accuracy-light/10 rounded-xl shadow-lg border-2 border-accuracy-light/30 p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleExpand}
            className="text-accuracy-navy hover:text-accuracy-medium transition-colors"
            title={isExpanded ? 'Ocultar etiquetas' : 'Mostrar etiquetas'}
          >
            <svg className="w-5 h-5 transition-transform" style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <h3 className="text-lg font-bold text-accuracy-navy font-outfit flex items-center">
            <span className="mr-2">📦</span>
            Etiquetas / Bultos
          </h3>
          {!isExpanded && labels.length > 0 && (
            <span className="text-sm text-accuracy-gray font-outfit">
              ({labels.length} {labels.length === 1 ? 'etiqueta' : 'etiquetas'})
            </span>
          )}
        </div>
        {!orderClosed && isExpanded && (
          <Button size="sm" onClick={onCreateLabel} className="!px-3" title="Nueva Etiqueta">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </Button>
        )}
      </div>

      {isExpanded && (
        <>
          {labels.length === 0 ? (
            <div className="text-center py-8 text-accuracy-gray">
              <p className="font-outfit font-medium">No hay etiquetas creadas</p>
              <p className="text-sm mt-1 font-outfit font-light">Cree una etiqueta para comenzar a escanear productos</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {labels.map((label) => (
                <LabelCard
                  key={label.labelId}
                  label={label}
                  orderClosed={orderClosed}
                  onClose={onCloseLabel}
                  onReopen={onReopenLabel}
                  onDelete={onDeleteLabel}
                  onViewScans={onViewScans}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
