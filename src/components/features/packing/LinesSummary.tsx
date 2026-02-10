import type { OrderLineWithDetails } from '../../../types'
import ProgressBar from '../../common/ProgressBar'
import Button from '../../common/Button'

interface LinesSummaryProps {
  lines: OrderLineWithDetails[]
  totalPicked: number
  totalChecked: number
  onToggleDetail: () => void
  showDetailButton?: boolean
  activeSkuId?: string
}

export default function LinesSummary({
  lines,
  totalPicked,
  totalChecked,
  onToggleDetail,
  showDetailButton = true,
  activeSkuId,
}: LinesSummaryProps) {
  // Contar líneas por estado
  const greenLines = lines.filter((l) => l.trafficLight === 'green').length
  const yellowLines = lines.filter((l) => l.trafficLight === 'yellow').length
  const redLines = lines.filter((l) => l.trafficLight === 'red').length

  const progressPercent = totalPicked > 0 ? (totalChecked / totalPicked) * 100 : 0

  // Encontrar línea activa
  const activeLine = activeSkuId ? lines.find((l) => l.skuId === activeSkuId) : null

  return (
    <div className="bg-gradient-to-br from-white to-accuracy-light/10 rounded-xl shadow-lg border-2 border-accuracy-light/30 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base md:text-lg font-bold text-accuracy-navy font-outfit flex items-center">
          <span className="mr-2">📋</span>
          Líneas del Pedido
        </h3>
        <span className="text-sm font-medium text-accuracy-gray font-outfit">
          {lines.length} total
        </span>
      </div>

      {/* Contadores por semáforo */}
      <div className="flex items-center justify-center gap-3 md:gap-4 mb-4">
        <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          <span className="text-xl">✅</span>
          <div className="text-center">
            <p className="text-lg md:text-xl font-bold text-green-700 font-outfit leading-none">
              {greenLines}
            </p>
            <p className="text-[10px] text-green-600 font-outfit uppercase">OK</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
          <span className="text-xl">🟡</span>
          <div className="text-center">
            <p className="text-lg md:text-xl font-bold text-yellow-700 font-outfit leading-none">
              {yellowLines}
            </p>
            <p className="text-[10px] text-yellow-600 font-outfit uppercase">Pendiente</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <span className="text-xl">🔴</span>
          <div className="text-center">
            <p className="text-lg md:text-xl font-bold text-red-700 font-outfit leading-none">
              {redLines}
            </p>
            <p className="text-[10px] text-red-600 font-outfit uppercase">Faltante</p>
          </div>
        </div>
      </div>

      {/* Progreso Global */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-accuracy-navy font-outfit">
            Progreso Global
          </span>
          <span className="text-sm font-bold text-accuracy-medium font-outfit">
            {totalChecked} / {totalPicked} items ({progressPercent.toFixed(1)}%)
          </span>
        </div>
        <ProgressBar
          value={totalChecked}
          max={totalPicked}
          showLabel={false}
          color={progressPercent === 100 ? 'green' : progressPercent > 0 ? 'yellow' : 'red'}
        />
      </div>

      {/* Indicador de SKU Activo */}
      {activeLine && (
        <div className="mb-3 p-3 bg-gradient-to-r from-accuracy-medium/10 via-accuracy-light/20 to-accuracy-medium/10 rounded-lg border-2 border-accuracy-medium/30 animate-pulse-slow">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎯</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-accuracy-gray font-outfit">Escaneando ahora:</p>
              <p className="font-bold text-accuracy-navy font-outfit truncate">{activeLine.skuId}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-accuracy-gray font-outfit">{activeLine.checkedQty}/{activeLine.pickedQty}</p>
            </div>
          </div>
        </div>
      )}

      {/* Botón Ver Detalle (solo mobile/tablet) */}
      {showDetailButton && (
        <Button
          onClick={onToggleDetail}
          variant="secondary"
          className="w-full text-sm font-outfit"
        >
          👁️ Ver detalle completo
        </Button>
      )}
    </div>
  )
}
