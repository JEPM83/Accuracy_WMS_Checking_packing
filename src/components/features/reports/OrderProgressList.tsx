import { useState } from 'react'
import type { OrderWithDetails } from '../../../types'
import { PieChart, Pie, Cell } from 'recharts'
import TrafficLight from '../../common/TrafficLight'
import Button from '../../common/Button'

interface OrderProgressListProps {
  orders: OrderWithDetails[]
  onSelectOrder: (orderId: string) => void
  selectedOrderId?: string
}

const COLORS = {
  checked: '#2578b5', // accuracy-medium
  pending: '#e5e7eb', // gray light
}

const ITEMS_PER_PAGE = 5

export default function OrderProgressList({
  orders,
  onSelectOrder,
  selectedOrderId,
}: OrderProgressListProps) {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(orders.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedOrders = orders.slice(startIndex, endIndex)

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {paginatedOrders.map((order) => {
        const percent = order.totalPicked > 0 ? (order.totalChecked / order.totalPicked) * 100 : 0
        const pending = order.totalPicked - order.totalChecked

        const data = [
          { value: order.totalChecked },
          { value: pending },
        ]

        const isSelected = selectedOrderId === order.orderId

        return (
          <div
            key={order.orderId}
            onClick={() => onSelectOrder(order.orderId)}
            className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
              isSelected
                ? 'border-accuracy-medium bg-gradient-to-r from-accuracy-light/20 to-accuracy-medium/10 shadow-lg scale-[1.02]'
                : 'border-accuracy-light/30 bg-white hover:border-accuracy-medium/50 hover:shadow-md hover:scale-[1.01]'
            } ${order.hasIncidents ? 'border-l-4 !border-l-red-500' : ''}`}
          >
            <div className="flex items-center space-x-4 flex-1">
              <TrafficLight status={order.trafficLight} size="md" />

              <PieChart width={50} height={50}>
                <Pie
                  data={data}
                  cx={25}
                  cy={25}
                  innerRadius={15}
                  outerRadius={20}
                  dataKey="value"
                  paddingAngle={2}
                >
                  <Cell fill={COLORS.checked} />
                  <Cell fill={COLORS.pending} />
                </Pie>
              </PieChart>

              <div className="flex-1">
                <p className="font-bold text-accuracy-navy font-outfit">{order.orderId}</p>
                <p className="text-sm text-accuracy-gray font-outfit font-light">{order.client.clientName}</p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xl font-bold text-accuracy-medium font-outfit">{percent.toFixed(0)}%</p>
              <p className="text-xs text-accuracy-gray font-outfit mt-0.5">
                {order.totalChecked} / {order.totalPicked}
              </p>
              {order.hasIncidents && (
                <span className="inline-flex items-center gap-1 mt-1 text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-outfit font-semibold">
                  ⚠️ {order.incidentCount}
                </span>
              )}
            </div>
          </div>
        )
      })}
      </div>

      {/* Controles de paginación */}
      {totalPages > 1 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-sm text-gray-600">
              Mostrando {startIndex + 1}-{Math.min(endIndex, orders.length)} de {orders.length} pedidos
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                ‹ Anterior
              </Button>

              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`min-w-[32px] px-2 py-1 text-sm font-semibold rounded transition ${
                        currentPage === pageNum
                          ? 'bg-gradient-to-r from-accuracy-medium to-accuracy-medium-light text-white'
                          : 'bg-white text-accuracy-navy hover:bg-accuracy-light hover:bg-opacity-20 border border-gray-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>

              <Button
                size="sm"
                variant="secondary"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Siguiente ›
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
