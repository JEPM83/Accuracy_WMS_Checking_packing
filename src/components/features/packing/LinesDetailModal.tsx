import { useState, useMemo } from 'react'
import Modal from '../../common/Modal'
import Button from '../../common/Button'
import Input from '../../common/Input'
import type { OrderLineWithDetails, TrafficLight } from '../../../types'
import ProgressBar from '../../common/ProgressBar'

interface LinesDetailModalProps {
  isOpen: boolean
  onClose: () => void
  lines: OrderLineWithDetails[]
  onReportFaltante: (lineId: string) => void
  activeSkuId?: string
}

type FilterType = 'all' | 'green' | 'yellow' | 'red'

export default function LinesDetailModal({
  isOpen,
  onClose,
  lines,
  onReportFaltante,
  activeSkuId,
}: LinesDetailModalProps) {
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Filtrar líneas
  const filteredLines = useMemo(() => {
    let result = lines

    // Filtro por semáforo
    if (filter !== 'all') {
      result = result.filter((l) => l.trafficLight === filter)
    }

    // Búsqueda por SKU o descripción
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (l) =>
          l.skuId.toLowerCase().includes(query) ||
          l.sku.description.toLowerCase().includes(query)
      )
    }

    return result
  }, [lines, filter, searchQuery])

  const filterButtons: { type: FilterType; label: string; icon: string; color: string }[] = [
    { type: 'all', label: 'Todas', icon: '📋', color: 'bg-gray-100 text-gray-700 border-gray-300' },
    { type: 'green', label: 'Completas', icon: '✅', color: 'bg-green-100 text-green-700 border-green-300' },
    { type: 'yellow', label: 'Pendientes', icon: '🟡', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
    { type: 'red', label: 'Faltantes', icon: '🔴', color: 'bg-red-100 text-red-700 border-red-300' },
  ]

  const getTrafficLightEmoji = (status: TrafficLight) => {
    switch (status) {
      case 'green': return '✅'
      case 'yellow': return '🟡'
      case 'red': return '🔴'
    }
  }

  const getTrafficLightColor = (status: TrafficLight) => {
    switch (status) {
      case 'green': return 'border-green-400 bg-green-50'
      case 'yellow': return 'border-yellow-400 bg-yellow-50'
      case 'red': return 'border-red-400 bg-red-50'
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="📋 Líneas del Pedido" size="full">
      <div className="space-y-4">
        {/* Buscador */}
        <div>
          <Input
            label=""
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Buscar por SKU o descripción..."
            className="text-base"
          />
        </div>

        {/* Filtros */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {filterButtons.map((btn) => (
            <button
              key={btn.type}
              onClick={() => setFilter(btn.type)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border-2 font-medium text-sm transition whitespace-nowrap font-outfit ${
                filter === btn.type
                  ? btn.color + ' shadow-md'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              }`}
            >
              <span>{btn.icon}</span>
              <span>{btn.label}</span>
              <span className="ml-1 bg-white/50 px-1.5 py-0.5 rounded text-xs font-bold">
                {btn.type === 'all' ? lines.length : lines.filter((l) => l.trafficLight === btn.type).length}
              </span>
            </button>
          ))}
        </div>

        {/* Contador de resultados */}
        <div className="text-sm text-accuracy-gray font-outfit">
          Mostrando <strong>{filteredLines.length}</strong> de <strong>{lines.length}</strong> líneas
        </div>

        {/* Lista de líneas */}
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {filteredLines.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg font-outfit">No se encontraron líneas</p>
              <p className="text-sm font-outfit">Intenta cambiar los filtros o la búsqueda</p>
            </div>
          ) : (
            filteredLines.map((line) => {
              const isActive = activeSkuId === line.skuId
              const progressPercent = line.pickedQty > 0 ? (line.checkedQty / line.pickedQty) * 100 : 0

              return (
                <div
                  key={line.lineId}
                  className={`rounded-xl border-2 p-4 transition-all ${
                    getTrafficLightColor(line.trafficLight)
                  } ${
                    isActive ? 'ring-4 ring-accuracy-medium shadow-xl scale-[1.02]' : 'shadow-sm hover:shadow-md'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">{getTrafficLightEmoji(line.trafficLight)}</span>
                        <h4 className="font-bold text-accuracy-navy text-lg font-outfit truncate">
                          {line.skuId}
                        </h4>
                        {isActive && (
                          <span className="bg-accuracy-medium text-white text-xs px-2 py-0.5 rounded-full font-outfit font-bold animate-pulse">
                            ACTIVO
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-accuracy-gray font-outfit line-clamp-2">
                        {line.sku.description}
                      </p>
                    </div>
                  </div>

                  {/* Cantidades */}
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="bg-white/50 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-500 font-outfit">Pedido</p>
                      <p className="text-lg font-bold text-gray-700 font-outfit">{line.orderedQty}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-2 text-center">
                      <p className="text-xs text-blue-600 font-outfit">Pickeado</p>
                      <p className="text-lg font-bold text-blue-700 font-outfit">{line.pickedQty}</p>
                    </div>
                    <div className={`rounded-lg p-2 text-center ${
                      line.checkedQty >= line.pickedQty ? 'bg-green-50' : 'bg-yellow-50'
                    }`}>
                      <p className={`text-xs font-outfit ${
                        line.checkedQty >= line.pickedQty ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        Chequeado
                      </p>
                      <p className={`text-lg font-bold font-outfit ${
                        line.checkedQty >= line.pickedQty ? 'text-green-700' : 'text-yellow-700'
                      }`}>
                        {line.checkedQty}
                      </p>
                    </div>
                  </div>

                  {/* Progreso */}
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-600 font-outfit">Progreso</span>
                      <span className="text-xs font-bold font-outfit">
                        {progressPercent.toFixed(0)}%
                      </span>
                    </div>
                    <ProgressBar
                      value={line.checkedQty}
                      max={line.pickedQty}
                      showLabel={false}
                      color={line.trafficLight}
                    />
                  </div>

                  {/* Info adicional */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    {line.sku.requiresSeries && (
                      <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-outfit font-medium">
                        🔢 Requiere Serie
                      </span>
                    )}
                    {line.sku.requiresLot && (
                      <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-outfit font-medium">
                        📦 Requiere Lote
                      </span>
                    )}
                    {line.pendingQty > 0 && (
                      <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-outfit font-medium">
                        ⏳ Pendiente: {line.pendingQty} EA
                      </span>
                    )}
                  </div>

                  {/* Botón reportar faltante */}
                  {line.trafficLight !== 'green' && line.pendingQty > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <Button
                        onClick={() => {
                          onReportFaltante(line.lineId)
                          onClose()
                        }}
                        variant="warning"
                        size="sm"
                        className="w-full"
                      >
                        ⚠️ Reportar Faltante
                      </Button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t">
          <Button onClick={onClose} variant="secondary" className="w-full">
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
