import { useEffect, useState } from 'react'
import { db } from '../../../services/db'
import type { Scan } from '../../../types'

interface ScanWithSku extends Scan {
  skuDescription?: string
  labelSeq?: number
}

interface RecentScansProps {
  orderId: string
  refreshTrigger?: number
}

export default function RecentScans({ orderId, refreshTrigger }: RecentScansProps) {
  const [recentScans, setRecentScans] = useState<ScanWithSku[]>([])

  useEffect(() => {
    loadRecentScans()
  }, [orderId, refreshTrigger])

  const loadRecentScans = async () => {
    try {
      // Obtener últimos 5 scans del pedido
      const scans = await db.scans
        .where('orderId')
        .equals(orderId)
        .reverse()
        .limit(5)
        .toArray()

      // Enriquecer con descripción del SKU y número de etiqueta
      const enrichedScans = await Promise.all(
        scans.map(async (scan) => {
          const sku = await db.skuCatalog.get(scan.skuId)
          const label = await db.labels.get(scan.labelId)
          return {
            ...scan,
            skuDescription: sku?.description || scan.skuId,
            labelSeq: label?.seq,
          }
        })
      )

      setRecentScans(enrichedScans)
    } catch (error) {
      console.error('Error cargando scans recientes:', error)
    }
  }

  if (recentScans.length === 0) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-2">
          <h4 className="text-xs font-bold text-accuracy-navy uppercase tracking-wide font-outfit flex items-center">
            <span className="mr-1.5 text-sm">📋</span>
            Últimos Scans
          </h4>
          <span className="text-[10px] text-accuracy-gray font-outfit">(0)</span>
        </div>
        <div className="bg-white/50 rounded-md p-3 flex items-center justify-center border border-accuracy-light/30">
          <p className="text-xs text-accuracy-navy/70 font-outfit">📦 No hay scans recientes</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-2">
      {/* Título vertical al costado */}
      <div className="flex flex-col items-center justify-center min-w-[24px]">
        <span className="text-sm mb-1">📋</span>
        <div className="flex flex-col items-center">
          <h4 className="text-[10px] font-bold text-accuracy-navy uppercase tracking-wide font-outfit whitespace-nowrap" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
            Últimos Scans
          </h4>
          <span className="text-[9px] text-accuracy-gray font-outfit mt-1">
            ({recentScans.length})
          </span>
        </div>
      </div>

      {/* Lista horizontal de scans con scroll invisible - Ultra compacta */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 flex-1">
          {recentScans.map((scan, index) => (
            <div
              key={scan.scanId}
              className={`flex-shrink-0 w-40 h-32 rounded-md p-3 border transition-all flex flex-col justify-between ${
                index === 0
                  ? 'bg-gradient-to-br from-accuracy-light/50 to-accuracy-medium-light/50 border-accuracy-medium'
                  : 'bg-white border-accuracy-light/30'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <p className={`font-bold truncate font-outfit ${
                      index === 0 ? 'text-accuracy-navy text-sm' : 'text-accuracy-navy text-xs'
                    }`}>
                      {scan.skuId}
                    </p>
                    {scan.labelSeq !== undefined && (
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-outfit flex-shrink-0 ${
                        index === 0
                          ? 'bg-accuracy-navy/20 text-accuracy-navy'
                          : 'bg-accuracy-medium/20 text-accuracy-medium'
                      }`}>
                        #{scan.labelSeq.toString().padStart(2, '0')}
                      </span>
                    )}
                  </div>
                  <p className={`truncate text-[10px] font-outfit font-light leading-tight ${
                    index === 0 ? 'text-accuracy-navy/80' : 'text-accuracy-gray'
                  }`}>
                    {scan.skuDescription}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-accuracy-navy/10">
                <div className="flex-1">
                  <p className={`font-bold font-outfit text-sm ${
                    index === 0 ? 'text-accuracy-navy' : 'text-accuracy-medium'
                  }`}>
                    {scan.qty > 0 ? '+' : ''}{scan.qty} {scan.uom}
                  </p>
                  {scan.serie && (
                    <p className="text-[9px] font-mono text-accuracy-gray mt-0.5 truncate">
                      #{scan.serie}
                    </p>
                  )}
                </div>
                {scan.lote && (
                  <div className="text-right flex-shrink-0 ml-1">
                    <p className="text-[9px] text-accuracy-gray font-outfit">Lote</p>
                    <p className="text-[10px] font-mono font-bold text-accuracy-medium truncate max-w-[60px]">{scan.lote}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
