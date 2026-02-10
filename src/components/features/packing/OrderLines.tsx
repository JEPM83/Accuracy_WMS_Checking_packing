import { useState } from 'react'
import type { OrderLineWithDetails } from '../../../types'
import LineRow from './LineRow'

interface OrderLinesProps {
  lines: OrderLineWithDetails[]
  onReportFaltante: (lineId: string) => void
  activeSkuId?: string
}

export default function OrderLines({ lines, onReportFaltante, activeSkuId }: OrderLinesProps) {
  const [hideCompleted, setHideCompleted] = useState(false)

  const filteredLines = hideCompleted
    ? lines.filter((line) => line.checkedQty < line.pickedQty)
    : lines

  const completedCount = lines.filter((line) => line.checkedQty >= line.pickedQty).length
  const totalCount = lines.length

  // Detectar SKUs que aparecen en múltiples líneas
  const skuCounts = lines.reduce((acc, line) => {
    acc[line.skuId] = (acc[line.skuId] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="bg-gradient-to-br from-white to-accuracy-light/10 rounded-xl shadow-lg border-2 border-accuracy-light/30 overflow-hidden">
      <div className="px-4 md:px-6 py-4 bg-gradient-to-r from-accuracy-light/20 to-accuracy-medium-light/20 border-b-2 border-accuracy-medium/30 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-accuracy-navy font-outfit flex items-center">
            <span className="mr-2">📋</span>
            Líneas del Pedido
          </h3>
          <p className="text-xs text-accuracy-gray mt-0.5 font-outfit">
            {completedCount} de {totalCount} completas
          </p>
        </div>

        <label className="flex items-center cursor-pointer select-none bg-white/50 rounded-lg px-3 py-2 hover:bg-white/70 transition">
          <input
            type="checkbox"
            checked={hideCompleted}
            onChange={(e) => setHideCompleted(e.target.checked)}
            className="w-4 h-4 text-accuracy-medium rounded focus:ring-2 focus:ring-accuracy-medium"
          />
          <span className="ml-2 text-sm font-medium text-accuracy-navy font-outfit">
            Ocultar completas ({completedCount})
          </span>
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-accuracy-light/10 to-accuracy-medium-light/10 border-b-2 border-accuracy-medium/20">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-accuracy-navy uppercase tracking-wide font-outfit">
                Estado
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-accuracy-navy uppercase tracking-wide font-outfit">
                SKU / Descripción
              </th>
              <th className="px-4 py-3 text-center text-xs font-bold text-accuracy-navy uppercase tracking-wide font-outfit">
                Ordenado
              </th>
              <th className="px-4 py-3 text-center text-xs font-bold text-accuracy-navy uppercase tracking-wide font-outfit">
                Picado
              </th>
              <th className="px-4 py-3 text-center text-xs font-bold text-accuracy-navy uppercase tracking-wide font-outfit">
                Chequeado
              </th>
              <th className="px-4 py-3 text-center text-xs font-bold text-accuracy-navy uppercase tracking-wide font-outfit">
                Pendiente
              </th>
              <th className="px-4 py-3 text-center text-xs font-bold text-accuracy-navy uppercase tracking-wide font-outfit w-24">
                Tipo
              </th>
              <th className="px-4 py-3 text-center text-xs font-bold text-accuracy-navy uppercase tracking-wide font-outfit w-20">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredLines.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-accuracy-gray">
                  <p className="font-outfit font-medium">
                    {hideCompleted ? '✓ Todas las líneas están completas' : 'No hay líneas en este pedido'}
                  </p>
                </td>
              </tr>
            ) : (
              filteredLines.map((line) => (
                <LineRow
                  key={line.lineId}
                  line={line}
                  onReportFaltante={onReportFaltante}
                  isActive={activeSkuId === line.skuId}
                  hasMultipleLines={skuCounts[line.skuId] > 1}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
