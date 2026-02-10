import { db } from './db'
import type { Incident, IncidentType, IncidentSummary } from '../types'

/**
 * Crea una nueva incidencia
 */
export async function createIncident(
  orderId: string,
  tipo: IncidentType,
  userId: string,
  data: {
    authorizedBy?: string
    skuId?: string
    labelId?: string
    lineId?: string
    qty?: number
    lote?: string
    pesoTeorico?: number
    pesoReal?: number
    comentario?: string
  }
): Promise<Incident> {
  const incident: Incident = {
    incidentId: `INC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    orderId,
    tipo,
    timestamp: new Date().toISOString(),
    userId,
    resolved: false,
    ...data,
  }

  await db.incidents.add(incident)
  return incident
}

/**
 * Obtiene todas las incidencias de un pedido
 */
export async function getIncidentsForOrder(orderId: string): Promise<Incident[]> {
  return db.incidents.where('orderId').equals(orderId).sortBy('timestamp')
}

/**
 * Obtiene resumen de incidencias agrupadas por tipo
 */
export async function getIncidentsSummary(filters?: {
  sociedad?: string
  clientId?: string
  fechaDesde?: string
  fechaHasta?: string
  tipo?: IncidentType
}): Promise<IncidentSummary[]> {
  let incidents = await db.incidents.toArray()

  // Aplicar filtros
  if (filters?.tipo) {
    incidents = incidents.filter((i) => i.tipo === filters.tipo)
  }

  if (filters?.fechaDesde) {
    incidents = incidents.filter((i) => i.timestamp >= filters.fechaDesde!)
  }

  if (filters?.fechaHasta) {
    incidents = incidents.filter((i) => i.timestamp <= filters.fechaHasta!)
  }

  // Si hay filtros de sociedad o cliente, necesitamos filtrar por orders
  if (filters?.sociedad || filters?.clientId) {
    const orderIds = new Set<string>()
    const orders = await db.orders.toArray()

    orders.forEach((order) => {
      if (filters.sociedad && order.sociedad !== filters.sociedad) return
      if (filters.clientId && order.clientId !== filters.clientId) return
      orderIds.add(order.orderId)
    })

    incidents = incidents.filter((i) => orderIds.has(i.orderId))
  }

  // Agrupar por tipo
  const summaryMap = new Map<IncidentType, { count: number; orders: Set<string> }>()

  incidents.forEach((incident) => {
    const existing = summaryMap.get(incident.tipo)
    if (existing) {
      existing.count++
      existing.orders.add(incident.orderId)
    } else {
      summaryMap.set(incident.tipo, {
        count: 1,
        orders: new Set([incident.orderId]),
      })
    }
  })

  const summary: IncidentSummary[] = Array.from(summaryMap.entries()).map(
    ([tipo, data]) => ({
      tipo,
      count: data.count,
      ordersAffected: data.orders.size,
    })
  )

  return summary
}

/**
 * Marca una incidencia como resuelta
 */
export async function resolveIncident(incidentId: string): Promise<void> {
  await db.incidents.update(incidentId, { resolved: true })
}

/**
 * Exporta incidencias a CSV
 */
export async function exportIncidentsToCSV(incidents: Incident[]): Promise<string> {
  // Headers
  const headers = [
    'ID Incidencia',
    'Pedido',
    'Tipo',
    'Fecha/Hora',
    'Usuario',
    'Autorizado Por',
    'SKU',
    'Etiqueta',
    'Cantidad',
    'Lote',
    'Peso Teórico',
    'Peso Real',
    'Comentario',
    'Resuelta',
  ]

  // Rows
  const rows = incidents.map((incident) => [
    incident.incidentId,
    incident.orderId,
    incident.tipo,
    new Date(incident.timestamp).toLocaleString('es-PE'),
    incident.userId,
    incident.authorizedBy || '',
    incident.skuId || '',
    incident.labelId || '',
    incident.qty?.toString() || '',
    incident.lote || '',
    incident.pesoTeorico?.toFixed(2) || '',
    incident.pesoReal?.toFixed(2) || '',
    incident.comentario || '',
    incident.resolved ? 'Sí' : 'No',
  ])

  // Crear CSV
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n')

  return csvContent
}

/**
 * Descarga un CSV en el navegador
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
