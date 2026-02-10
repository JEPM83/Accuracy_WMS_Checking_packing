import type { LabelWithDetails } from '../../../types'
import Card from '../../common/Card'
import Chip from '../../common/Chip'
import Button from '../../common/Button'
import { formatearPeso } from '../../../utils/formatters'

interface LabelCardProps {
  label: LabelWithDetails
  orderClosed: boolean
  onClose: (labelId: string) => void
  onReopen: (labelId: string) => void
  onDelete: (labelId: string) => void
  onViewScans: (labelId: string) => void
}

export default function LabelCard({
  label,
  orderClosed,
  onClose,
  onReopen,
  onDelete,
  onViewScans,
}: LabelCardProps) {
  const labelIdDisplay = label.totalSeq
    ? `${label.seq.toString().padStart(2, '0')}/${label.totalSeq.toString().padStart(2, '0')}`
    : `${label.seq.toString().padStart(2, '0')}/?`

  const canDelete = label.scans.length === 0 && label.status === 'OPEN'
  const canClose = label.scans.length > 0 && label.status === 'OPEN'

  return (
    <Card className="hover:shadow-lg transition-all hover:border-accuracy-medium/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-accuracy-navy font-outfit">#{labelIdDisplay}</span>
          <Chip variant={label.status === 'OPEN' ? 'success' : 'default'}>
            {label.status === 'OPEN' ? 'ABIERTA' : 'CERRADA'}
          </Chip>
        </div>
        <span className="text-sm text-accuracy-gray font-outfit">{label.itemCount} items</span>
      </div>

      <div className="space-y-2 mb-3">
        {label.skuSummary.length > 0 ? (
          label.skuSummary.map((sku, idx) => (
            <div key={idx} className="text-sm">
              <span className="font-medium text-accuracy-medium font-outfit">{sku.qty}x</span>{' '}
              <span className="text-accuracy-gray font-outfit font-light">{sku.description}</span>
            </div>
          ))
        ) : (
          <p className="text-sm text-accuracy-gray/50 italic font-outfit">Sin productos</p>
        )}
      </div>

      {label.status === 'CLOSED' && label.realWeight && (
        <div className="bg-gradient-to-r from-accuracy-light/10 to-accuracy-medium-light/10 rounded-lg p-3 mb-3 space-y-1 border border-accuracy-medium/20">
          <div className="flex justify-between text-xs">
            <span className="text-accuracy-gray font-outfit">Peso teórico:</span>
            <span className="font-medium text-accuracy-navy font-outfit">{formatearPeso(label.theoreticalWeight)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-accuracy-gray font-outfit">Peso real:</span>
            <span className="font-medium text-accuracy-navy font-outfit">{formatearPeso(label.realWeight)}</span>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {label.status === 'OPEN' && !orderClosed && (
          <>
            {canClose && (
              <Button
                size="sm"
                onClick={() => onClose(label.labelId)}
                className="flex-1 !px-2 md:!px-3 !py-1.5 flex items-center justify-center"
                title="Cerrar etiqueta"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="hidden md:inline ml-1.5 text-xs font-semibold">Cerrar</span>
              </Button>
            )}
            {canDelete && (
              <Button
                size="sm"
                variant="danger"
                onClick={() => onDelete(label.labelId)}
                className="flex-1 !px-2 md:!px-3 !py-1.5 flex items-center justify-center"
                title="Eliminar etiqueta"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="hidden md:inline ml-1.5 text-xs font-semibold">Eliminar</span>
              </Button>
            )}
          </>
        )}

        {label.status === 'CLOSED' && !orderClosed && (
          <Button
            size="sm"
            variant="warning"
            onClick={() => onReopen(label.labelId)}
            className="flex-1 !px-2 md:!px-3 !py-1.5 flex items-center justify-center"
            title="Reabrir etiqueta"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="hidden md:inline ml-1.5 text-xs font-semibold">Reabrir</span>
          </Button>
        )}

        {label.scans.length > 0 && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onViewScans(label.labelId)}
            className="flex-1 !px-2 md:!px-3 !py-1.5 flex items-center justify-center"
            title="Ver scans"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="hidden md:inline ml-1.5 text-xs font-semibold">Ver Scans</span>
          </Button>
        )}
      </div>
    </Card>
  )
}
