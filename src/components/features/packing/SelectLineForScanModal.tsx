import Modal from '../../common/Modal'
import Button from '../../common/Button'
import type { OrderLine } from '../../../types'

interface SelectLineForScanModalProps {
  isOpen: boolean
  skuId: string
  description: string
  lines: OrderLine[]
  onSelect: (lineId: string) => void
  onCancel: () => void
}

export default function SelectLineForScanModal({
  isOpen,
  skuId,
  description,
  lines,
  onSelect,
  onCancel,
}: SelectLineForScanModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title="📦 Seleccionar Línea"
      size="md"
      allowBodyScroll={true}
    >
      <div className="space-y-4">
        {/* Info del SKU */}
        <div className="bg-gradient-to-r from-accuracy-light/20 to-accuracy-medium/10 border-2 border-accuracy-light/30 rounded-xl p-4">
          <p className="text-sm text-accuracy-gray font-outfit mb-1">SKU a escanear:</p>
          <p className="text-lg font-bold text-accuracy-navy font-outfit">{skuId}</p>
          <p className="text-sm text-accuracy-gray font-outfit font-light mt-1">{description}</p>
        </div>

        {/* Mensaje explicativo */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-900 font-outfit">
            <strong>ℹ️ Este SKU aparece en múltiples líneas.</strong>
            <br />
            <span className="font-light">
              Seleccione la línea específica a la que desea asignar este escaneo.
            </span>
          </p>
        </div>

        {/* Lista de líneas disponibles */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {lines.map((line, index) => {
            const pendingQty = line.pickedQty - line.checkedQty
            const progress = line.pickedQty > 0 ? (line.checkedQty / line.pickedQty) * 100 : 0

            return (
              <button
                key={line.lineId}
                onClick={() => onSelect(line.lineId)}
                className="w-full bg-gradient-to-br from-white to-accuracy-light/5 border-2 border-accuracy-light/30 hover:border-accuracy-medium hover:shadow-lg rounded-xl p-4 text-left transition-all hover:scale-[1.02] group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* Número de línea */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-accuracy-medium text-white text-sm font-bold font-outfit">
                        {index + 1}
                      </span>
                      <span className="text-xs text-accuracy-gray font-outfit">Línea #{index + 1}</span>
                    </div>

                    {/* Cantidades */}
                    <div className="grid grid-cols-3 gap-3 mb-2">
                      <div>
                        <p className="text-xs text-accuracy-gray font-outfit">Pedido</p>
                        <p className="text-lg font-bold text-accuracy-navy font-outfit">{line.pickedQty}</p>
                      </div>
                      <div>
                        <p className="text-xs text-accuracy-gray font-outfit">Chequeado</p>
                        <p className="text-lg font-bold text-accuracy-medium font-outfit">{line.checkedQty}</p>
                      </div>
                      <div>
                        <p className="text-xs text-accuracy-gray font-outfit">Pendiente</p>
                        <p className={`text-lg font-bold font-outfit ${pendingQty > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                          {pendingQty}
                        </p>
                      </div>
                    </div>

                    {/* Barra de progreso */}
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          progress === 100 ? 'bg-green-500' : 'bg-accuracy-medium'
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>

                    {/* Indicadores de trazabilidad */}
                    <div className="flex items-center gap-2 mt-2">
                      {line.requiresSeries && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-outfit font-semibold">
                          🔢 Serie
                        </span>
                      )}
                      {line.requiresLot && (
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded font-outfit font-semibold">
                          📦 Lote
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Icono de selección */}
                  <div className="flex-shrink-0 text-accuracy-medium group-hover:text-accuracy-navy group-hover:scale-125 transition-all">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Botón cancelar */}
        <div className="flex justify-end pt-2 border-t border-accuracy-light/30">
          <Button onClick={onCancel} variant="secondary">
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
