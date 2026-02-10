import type { OrderLineWithDetails } from '../../../types'
import TrafficLight from '../../common/TrafficLight'

interface LineRowProps {
  line: OrderLineWithDetails
  onReportFaltante: (lineId: string) => void
  isActive?: boolean
  hasMultipleLines?: boolean
}

export default function LineRow({ line, onReportFaltante, isActive, hasMultipleLines }: LineRowProps) {
  // Auto-scroll deshabilitado para evitar movimiento automático del scroll
  // El usuario prefiere mantener el scroll fijo y solo moverlo manualmente

  return (
    <tr
      className={`border-b border-accuracy-light/20 transition-all duration-300 ${
        isActive
          ? 'bg-gradient-to-r from-accuracy-medium/20 via-accuracy-light/30 to-accuracy-medium/20 border-l-4 border-accuracy-medium shadow-lg scale-[1.01] animate-pulse-slow'
          : 'hover:bg-accuracy-light/5'
      }`}
    >
      <td className="px-4 py-3">
        <TrafficLight status={line.trafficLight} />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <p className="font-medium text-accuracy-navy font-outfit">{line.skuId}</p>
          {hasMultipleLines && (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-300"
              title="Este SKU aparece en múltiples líneas - Se solicitará selección al escanear"
            >
              📌 x{line.sku.requiresLot || line.sku.requiresSeries ? 'N' : 'Auto'}
            </span>
          )}
        </div>
        <p className="text-sm text-accuracy-gray font-outfit font-light">{line.sku.description}</p>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="text-accuracy-gray font-outfit">{line.orderedQty}</span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="font-medium text-accuracy-navy font-outfit">{line.pickedQty}</span>
      </td>
      <td className="px-4 py-3 text-center">
        <span
          className={`font-bold font-outfit text-lg transition-all ${
            line.checkedQty === line.pickedQty ? 'text-green-600' : 'text-accuracy-medium'
          } ${isActive ? 'animate-bounce-slight scale-125' : ''}`}
        >
          {line.checkedQty}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className={`font-medium font-outfit ${line.pendingQty === 0 ? 'text-accuracy-gray/50' : 'text-orange-600'}`}>
          {line.pendingQty}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-1">
          {line.sku.requiresSeries && (
            <span className="inline-flex items-center justify-center w-7 h-7 text-base" title="Requiere Serie">
              🔢
            </span>
          )}
          {line.sku.requiresLot && (
            <span className="inline-flex items-center justify-center w-7 h-7 text-base" title="Requiere Lote">
              📦
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        {line.pendingQty > 0 && (
          <button
            onClick={() => onReportFaltante(line.lineId)}
            title="Reportar faltante"
            className="inline-flex items-center justify-center w-8 h-8 text-accuracy-medium hover:text-accuracy-navy transition-all hover:scale-125"
          >
            <span className="text-base">⚠️</span>
          </button>
        )}
      </td>
    </tr>
  )
}
