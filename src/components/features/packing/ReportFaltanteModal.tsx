import { useState, useRef, useEffect } from 'react'
import Modal from '../../common/Modal'
import Input from '../../common/Input'
import Button from '../../common/Button'
import type { OrderLineWithDetails } from '../../../types'

interface ReportFaltanteModalProps {
  isOpen: boolean
  line: OrderLineWithDetails | null
  onReport: (lineId: string, comentario?: string) => void
  onCancel: () => void
}

export default function ReportFaltanteModal({
  isOpen,
  line,
  onReport,
  onCancel,
}: ReportFaltanteModalProps) {
  const [comentario, setComentario] = useState('')
  const comentarioInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Auto-focus en el comentario cuando el modal se abre
    if (isOpen && comentarioInputRef.current) {
      setTimeout(() => {
        comentarioInputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  const handleReport = () => {
    if (line) {
      onReport(line.lineId, comentario || undefined)
      setComentario('')
    }
  }

  if (!line) return null

  const qtyFaltante = line.pickedQty - line.checkedQty

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="Reportar Faltante" size="md">
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm font-medium text-red-900 mb-2">
            SKU: {line.skuId}
          </p>
          <p className="text-sm text-red-800">{line.sku.description}</p>

          <div className="grid grid-cols-3 gap-4 mt-4 text-center">
            <div>
              <p className="text-xs text-red-600">Picado</p>
              <p className="text-lg font-bold text-red-900">{line.pickedQty}</p>
            </div>
            <div>
              <p className="text-xs text-red-600">Chequeado</p>
              <p className="text-lg font-bold text-red-900">{line.checkedQty}</p>
            </div>
            <div>
              <p className="text-xs text-red-600">Faltante</p>
              <p className="text-lg font-bold text-red-700">{qtyFaltante}</p>
            </div>
          </div>
        </div>

        <Input
          ref={comentarioInputRef}
          label="Comentario (Opcional)"
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleReport()
            }
          }}
          placeholder="Ej: Producto no encontrado en ubicación"
        />

        <div className="flex space-x-2">
          <Button onClick={handleReport} variant="danger" className="flex-1">
            Confirmar Faltante
          </Button>
          <Button onClick={onCancel} variant="secondary" className="flex-1">
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
