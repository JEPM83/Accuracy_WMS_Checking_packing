import { useState } from 'react'
import Modal from '../../common/Modal'
import Button from '../../common/Button'
import type { LabelWithDetails } from '../../../types'

interface SelectLabelModalProps {
  isOpen: boolean
  labels: LabelWithDetails[]
  onSelect: (labelId: string) => void
  onCancel: () => void
}

export default function SelectLabelModal({
  isOpen,
  labels,
  onSelect,
  onCancel,
}: SelectLabelModalProps) {
  const [selectedLabelId, setSelectedLabelId] = useState<string>('')

  const handleConfirm = () => {
    if (selectedLabelId) {
      onSelect(selectedLabelId)
      setSelectedLabelId('')
    }
  }

  const openLabels = labels.filter((l) => l.status === 'OPEN')

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title="Seleccionar Etiqueta"
      size="md"
    >
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-900 font-medium font-outfit">
            📦 Hay {openLabels.length} etiquetas abiertas
          </p>
          <p className="text-xs text-blue-700 mt-1 font-outfit font-light">
            Seleccione a cuál etiqueta desea agregar los productos escaneados
          </p>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {openLabels.map((label) => {
            const isSelected = selectedLabelId === label.labelId
            const progress = label.itemCount > 0 ? 100 : 0

            return (
              <button
                key={label.labelId}
                onClick={() => setSelectedLabelId(label.labelId)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'bg-gradient-to-r from-accuracy-medium to-accuracy-navy border-accuracy-medium text-white shadow-lg'
                    : 'bg-white border-gray-300 hover:border-accuracy-medium-light hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-lg font-bold font-outfit ${
                    isSelected ? 'text-white' : 'text-accuracy-navy'
                  }`}>
                    Etiqueta #{label.seq.toString().padStart(2, '0')}
                  </span>
                  {isSelected && (
                    <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-white font-outfit">
                      ✓ SELECCIONADA
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className={`font-outfit ${
                    isSelected ? 'text-white/90' : 'text-gray-600'
                  }`}>
                    Items: <span className="font-bold">{label.itemCount}</span>
                  </span>
                  <span className={`font-outfit ${
                    isSelected ? 'text-white/90' : 'text-gray-600'
                  }`}>
                    Peso: <span className="font-bold">{label.theoreticalWeight.toFixed(2)} kg</span>
                  </span>
                </div>

                {/* Mini barra de progreso */}
                <div className={`mt-3 h-2 rounded-full overflow-hidden ${
                  isSelected ? 'bg-white/20' : 'bg-gray-200'
                }`}>
                  <div
                    className={`h-full transition-all ${
                      isSelected ? 'bg-white' : 'bg-accuracy-medium'
                    }`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </button>
            )
          })}
        </div>

        <div className="flex space-x-2 pt-4 border-t">
          <Button
            onClick={handleConfirm}
            className="flex-1"
            disabled={!selectedLabelId}
            variant="primary"
          >
            Confirmar Selección
          </Button>
          <Button onClick={onCancel} variant="secondary" className="flex-1">
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
