import Modal from '../../common/Modal'
import Button from '../../common/Button'
import type { LabelWithDetails } from '../../../types'

interface EmptyLabelsModalProps {
  isOpen: boolean
  onClose: () => void
  emptyLabels: LabelWithDetails[]
  onDeleteEmptyLabels: () => void
}

export default function EmptyLabelsModal({
  isOpen,
  onClose,
  emptyLabels,
  onDeleteEmptyLabels,
}: EmptyLabelsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="⚠️ Etiquetas Vacías Detectadas">
      <div className="space-y-4">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700 font-outfit">
                <strong>No se puede cerrar el pedido</strong> mientras existan etiquetas vacías (sin productos escaneados).
              </p>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold text-accuracy-navy mb-2 font-outfit">
            Etiquetas vacías encontradas:
          </h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {emptyLabels.map((label) => (
              <div
                key={label.labelId}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div>
                  <p className="text-sm font-bold text-accuracy-navy font-outfit">
                    Etiqueta #{label.seq.toString().padStart(2, '0')}
                    {label.totalSeq && `/${label.totalSeq.toString().padStart(2, '0')}`}
                    {!label.totalSeq && '/?'}
                  </p>
                  <p className="text-xs text-gray-500 font-mono font-outfit">
                    {label.labelId}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-red-600 font-outfit font-medium">
                    0 productos
                  </p>
                  <p className="text-xs text-gray-500 font-outfit">
                    {label.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-accuracy-light/10 border border-accuracy-light/30 rounded-lg p-3">
          <p className="text-sm text-accuracy-navy font-outfit">
            💡 <strong>Recomendación:</strong> Elimine las etiquetas vacías para poder cerrar el pedido.
          </p>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            onClick={onClose}
            variant="secondary"
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={onDeleteEmptyLabels}
            variant="danger"
            className="flex-1"
          >
            🗑️ Eliminar Etiquetas Vacías
          </Button>
        </div>
      </div>
    </Modal>
  )
}
