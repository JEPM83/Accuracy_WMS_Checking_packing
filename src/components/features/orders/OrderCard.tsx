import { useNavigate } from 'react-router-dom'
import type { OrderWithDetails } from '../../../types'
import Chip from '../../common/Chip'
import TrafficLight from '../../common/TrafficLight'
import ProgressBar from '../../common/ProgressBar'
import { formatearFecha } from '../../../utils/formatters'

interface OrderCardProps {
  order: OrderWithDetails
}

export default function OrderCard({ order }: OrderCardProps) {
  const navigate = useNavigate()

  const statusVariant = {
    'RECEP': 'info' as const,
    'CHK': 'warning' as const,
    'CONFIRMADO WMS': 'success' as const,
    'CONFIRMADO DESPACHO': 'default' as const,
  }

  return (
    <div
      onClick={() => navigate(`/outbound/${order.orderId}`)}
      className="bg-gradient-to-br from-white to-accuracy-light/10 rounded-xl shadow-lg border-2 border-accuracy-light/30 p-5 hover:border-accuracy-medium hover:shadow-2xl hover:scale-[1.02] transition-all duration-200 cursor-pointer group"
    >
      {/* Header con semáforo y estado */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative">
            <TrafficLight status={order.trafficLight} size="lg" />
            {order.hasIncidents && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg animate-pulse">
                <span className="text-white text-xs font-bold">{order.incidentCount}</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-accuracy-navy font-outfit truncate group-hover:text-accuracy-medium transition-colors">
              {order.orderId}
            </h3>
            <p className="text-sm text-accuracy-gray font-outfit truncate">{order.client.clientName}</p>
          </div>
        </div>
        <Chip variant={statusVariant[order.status]} className="shrink-0">{order.status}</Chip>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white/50 rounded-lg p-2.5 border border-accuracy-light/20">
          <div className="flex items-center gap-1.5 mb-1">
            <svg className="w-3.5 h-3.5 text-accuracy-medium" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="text-[10px] text-accuracy-gray font-outfit uppercase tracking-wide">Sociedad</p>
          </div>
          <p className="text-sm font-bold text-accuracy-navy font-outfit">{order.sociedad}</p>
        </div>
        <div className="bg-white/50 rounded-lg p-2.5 border border-accuracy-light/20">
          <div className="flex items-center gap-1.5 mb-1">
            <svg className="w-3.5 h-3.5 text-accuracy-medium" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-[10px] text-accuracy-gray font-outfit uppercase tracking-wide">Fecha</p>
          </div>
          <p className="text-sm font-bold text-accuracy-navy font-outfit">
            {formatearFecha(order.fechaCreacion, false)}
          </p>
        </div>
      </div>

      {/* Progreso */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-accuracy-gray font-outfit font-semibold uppercase tracking-wide">Progreso</span>
          <span className="text-sm font-bold text-accuracy-navy font-outfit">
            {order.totalChecked} / {order.totalPicked}
          </span>
        </div>
        <ProgressBar
          value={order.totalChecked}
          max={order.totalPicked}
          showLabel={false}
          color={order.trafficLight === 'green' ? 'green' : order.trafficLight === 'yellow' ? 'yellow' : 'red'}
        />
        <div className="text-right mt-1">
          <span className={`text-xs font-bold font-outfit ${
            order.progressPercent === 100 ? 'text-green-600' : 'text-accuracy-medium'
          }`}>
            {order.progressPercent.toFixed(0)}% completado
          </span>
        </div>
      </div>

      {/* Etiquetas */}
      {order.totalLabels > 0 && (
        <div className="mb-4 pb-4 border-b border-accuracy-light/30">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-accuracy-gray font-outfit font-semibold uppercase tracking-wide">📦 Etiquetas:</span>
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-gradient-to-r from-accuracy-light/30 to-accuracy-medium-light/30 text-accuracy-navy border border-accuracy-medium/30 font-outfit">
              {order.totalLabels}
            </span>
            {order.openLabels > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-green-100 text-green-800 border border-green-300 font-outfit">
                {order.openLabels} abiertas
              </span>
            )}
            {order.closedLabels > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-accuracy-navy/10 text-accuracy-navy border border-accuracy-navy/30 font-outfit">
                {order.closedLabels} cerradas
              </span>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-accuracy-medium" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span className="text-sm font-semibold text-accuracy-navy font-outfit">{order.lines.length} líneas</span>
        </div>
        <div className="flex items-center gap-1 text-accuracy-medium group-hover:text-accuracy-navy transition-colors">
          <span className="text-xs font-semibold font-outfit">Ver detalle</span>
          <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  )
}
