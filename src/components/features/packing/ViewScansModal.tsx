import { useEffect, useState } from 'react'
import Modal from '../../common/Modal'
import Button from '../../common/Button'
import Spinner from '../../common/Spinner'
import { db } from '../../../services/db'
import type { Scan } from '../../../types'
import { formatearFecha } from '../../../utils/formatters'
import { useConfirm } from '../../../hooks/useConfirm'

interface ScanWithDetails extends Scan {
  skuDescription?: string
  username?: string
}

interface ViewScansModalProps {
  isOpen: boolean
  labelId: string
  labelStatus: 'OPEN' | 'CLOSED'
  onClose: () => void
  onDeleteScan: (scanId: string) => void
  onDeleteAllScans: () => void
}

export default function ViewScansModal({
  isOpen,
  labelId,
  labelStatus,
  onClose,
  onDeleteScan,
  onDeleteAllScans,
}: ViewScansModalProps) {
  const [scans, setScans] = useState<ScanWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const { confirm, ConfirmDialogComponent } = useConfirm()

  useEffect(() => {
    if (isOpen) {
      loadScans()
    }
  }, [isOpen, labelId])

  const loadScans = async () => {
    try {
      setLoading(true)

      // Obtener scans de la etiqueta
      const scanData = await db.scans
        .where('labelId')
        .equals(labelId)
        .sortBy('timestamp')

      // Enriquecer con información adicional
      const enrichedScans = await Promise.all(
        scanData.map(async (scan) => {
          const sku = await db.skuCatalog.get(scan.skuId)
          const user = await db.users.get(scan.userId)

          return {
            ...scan,
            skuDescription: sku?.description || scan.skuId,
            username: user?.fullName || scan.userId,
          }
        })
      )

      setScans(enrichedScans)
    } catch (error) {
      console.error('Error cargando scans:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteScan = async (scanId: string) => {
    const confirmed = await confirm({
      title: 'Eliminar Scan',
      message: '¿Está seguro de eliminar este scan?\n\nEsta acción actualizará las cantidades del pedido.',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    })

    if (confirmed) {
      onDeleteScan(scanId)
    }
  }

  const handleDeleteAllScans = async () => {
    if (scans.length === 0) return

    const confirmed = await confirm({
      title: 'Eliminar Todos los Scans',
      message: `¿Está seguro de eliminar TODOS los scans (${scans.length}) de esta etiqueta?\n\nEsta acción actualizará las cantidades del pedido y no se puede deshacer.`,
      confirmText: 'Sí, eliminar todos',
      cancelText: 'Cancelar',
      variant: 'danger',
    })

    if (confirmed) {
      onDeleteAllScans()
    }
  }

  const getTipoScan = (scan: Scan): { label: string; style: string } => {
    if (scan.isRepack) {
      if (scan.qty < 0) {
        return { label: 'REPACK OUT', style: 'bg-orange-100 text-orange-800 border border-orange-300' }
      } else {
        return { label: 'REPACK IN', style: 'bg-accuracy-light/30 text-accuracy-navy border border-accuracy-medium' }
      }
    }
    return { label: 'NORMAL', style: 'bg-green-100 text-green-800 border border-green-300' }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="📋 Detalle de Scans" size="lg">
      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : scans.length === 0 ? (
        <div className="text-center py-12 bg-gradient-to-br from-accuracy-light/10 to-accuracy-medium-light/10 rounded-xl border border-accuracy-light/30">
          <div className="text-4xl mb-3">📦</div>
          <p className="text-accuracy-navy/70 font-outfit font-medium">No hay scans registrados en esta etiqueta</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
          {scans.map((scan) => {
            const tipoInfo = getTipoScan(scan)
            return (
              <div
                key={scan.scanId}
                className="bg-gradient-to-br from-white to-accuracy-light/10 border-2 border-accuracy-light/30 rounded-xl p-4 hover:border-accuracy-medium/50 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-accuracy-navy text-base font-outfit">{scan.skuId}</span>
                      <span className={`text-xs px-2 py-1 rounded-md font-semibold font-outfit ${tipoInfo.style}`}>
                        {tipoInfo.label}
                      </span>
                    </div>
                    <p className="text-sm text-accuracy-gray mb-3 font-outfit font-light">{scan.skuDescription}</p>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="text-accuracy-gray font-outfit">Cantidad:</span>
                        <span className="font-bold text-accuracy-navy font-outfit">
                          {scan.qty > 0 ? '+' : ''}{scan.qty} {scan.uom}
                        </span>
                        {scan.uom !== 'EA' && scan.qtyInEA && (
                          <span className="text-accuracy-gray font-outfit"> ({scan.qtyInEA} EA)</span>
                        )}
                      </div>

                      {scan.serie && (
                        <div className="flex items-center gap-1">
                          <span className="text-accuracy-gray font-outfit">Serie:</span>
                          <span className="font-bold font-mono text-accuracy-medium">{scan.serie}</span>
                        </div>
                      )}

                      {scan.lote && (
                        <div className="flex items-center gap-1">
                          <span className="text-accuracy-gray font-outfit">Lote:</span>
                          <span className="font-bold font-mono text-accuracy-navy">{scan.lote}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1">
                        <span className="text-accuracy-gray font-outfit">Usuario:</span>
                        <span className="font-semibold text-accuracy-navy font-outfit">{scan.username}</span>
                      </div>

                      <div className="col-span-2 flex items-center gap-1">
                        <span className="text-accuracy-gray font-outfit">Fecha:</span>
                        <span className="font-semibold text-accuracy-navy font-outfit">{formatearFecha(scan.timestamp)}</span>
                      </div>

                      {scan.repackFrom && (
                        <div className="col-span-2 flex items-center gap-1">
                          <span className="text-accuracy-gray font-outfit">Repack desde:</span>
                          <span className="font-bold text-orange-600 font-outfit">{scan.repackFrom}</span>
                        </div>
                      )}

                      {scan.repackTo && (
                        <div className="col-span-2 flex items-center gap-1">
                          <span className="text-accuracy-gray font-outfit">Repack hacia:</span>
                          <span className="font-bold text-accuracy-medium font-outfit">{scan.repackTo}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDeleteScan(scan.scanId)}
                    className="shrink-0 !px-3"
                    title="Eliminar scan"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="flex justify-between items-center mt-6 pt-4 border-t-2 border-accuracy-light/30">
        {scans.length > 0 && (
          <Button
            variant="danger"
            onClick={handleDeleteAllScans}
            className="flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Eliminar Todos ({scans.length})</span>
          </Button>
        )}
        <div className="flex-1"></div>
        <Button variant="secondary" onClick={onClose}>
          Cerrar
        </Button>
      </div>

      {/* Diálogo de confirmación */}
      {ConfirmDialogComponent}
    </Modal>
  )
}
