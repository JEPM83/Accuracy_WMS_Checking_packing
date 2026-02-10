import { useState, useEffect } from 'react'
import Modal from '../../common/Modal'
import Input from '../../common/Input'
import Button from '../../common/Button'
import { formatearPeso } from '../../../utils/formatters'

interface CloseLabelModalProps {
  isOpen: boolean
  labelId: string
  theoreticalWeight: number
  onClose: (realWeight?: number) => void
  onCancel: () => void
}

export default function CloseLabelModal({
  isOpen,
  labelId: _labelId,
  theoreticalWeight,
  onClose,
  onCancel,
}: CloseLabelModalProps) {
  const [simulatingWeight, setSimulatingWeight] = useState(true)
  const [realWeight, setRealWeight] = useState(0)
  const [editMode, setEditMode] = useState(false)
  const [editedWeight, setEditedWeight] = useState('')

  useEffect(() => {
    if (isOpen) {
      // Simular balanza
      setSimulatingWeight(true)
      setTimeout(() => {
        // Peso real cercano al teórico (±3%)
        const variacion = (Math.random() - 0.5) * 0.06
        const simulated = theoreticalWeight * (1 + variacion)
        setRealWeight(Math.round(simulated * 100) / 100)
        setSimulatingWeight(false)
      }, 2000)
    } else {
      setSimulatingWeight(true)
      setRealWeight(0)
      setEditMode(false)
      setEditedWeight('')
    }
  }, [isOpen, theoreticalWeight])

  const handleConfirm = () => {
    if (editMode) {
      const weight = parseFloat(editedWeight)
      if (isNaN(weight) || weight <= 0) {
        return
      }
      onClose(weight)
    } else {
      onClose(realWeight)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="Cerrar Etiqueta" size="md">
      <div className="space-y-4">
        {simulatingWeight ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium">Leyendo balanza...</p>
            <p className="text-sm text-gray-500 mt-1">Por favor espere</p>
          </div>
        ) : (
          <>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Peso Teórico:</span>
                <span className="text-lg font-bold text-gray-900">
                  {formatearPeso(theoreticalWeight)}
                </span>
              </div>

              <div className="flex justify-between items-center border-t pt-3">
                <span className="text-gray-600">Peso Real (Balanza):</span>
                <span className="text-lg font-bold text-blue-600">
                  {formatearPeso(editMode ? parseFloat(editedWeight) || 0 : realWeight)}
                </span>
              </div>

              <div className="flex justify-between items-center border-t pt-3">
                <span className="text-gray-600">Diferencia:</span>
                <span
                  className={`text-lg font-bold ${
                    Math.abs((editMode ? parseFloat(editedWeight) || 0 : realWeight) - theoreticalWeight) >
                    0.5
                      ? 'text-red-600'
                      : 'text-green-600'
                  }`}
                >
                  {formatearPeso(
                    Math.abs((editMode ? parseFloat(editedWeight) || 0 : realWeight) - theoreticalWeight)
                  )}
                </span>
              </div>
            </div>

            {editMode ? (
              <Input
                type="number"
                label="Editar Peso Real (kg)"
                value={editedWeight}
                onChange={(e) => setEditedWeight(e.target.value)}
                step="0.01"
                min="0"
                helperText="Requiere autorización para operarios"
              />
            ) : (
              <Button variant="secondary" size="sm" onClick={() => setEditMode(true)} className="w-full">
                Editar Peso Manualmente
              </Button>
            )}

            <div className="flex space-x-2">
              <Button onClick={handleConfirm} className="flex-1">
                Confirmar y Cerrar
              </Button>
              <Button onClick={onCancel} variant="secondary" className="flex-1">
                Cancelar
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
