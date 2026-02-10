import { db } from './db'
import type {
  Order,
  OrderWithDetails,
  OrderLine,
  OrderLineWithDetails,
  Sociedad,
  OrderStatus,
} from '../types'
import { calcularSemaforo, calcularSemaforoPedido } from '../utils/validators'
import { withDelay, DELAYS } from '../utils/delays'

/**
 * Obtiene todos los pedidos con detalles filtrados por sociedad y clientes permitidos
 */
export async function getOrders(
  sociedad: Sociedad,
  allowedClients: string[],
  filters?: {
    clientId?: string
    fechaDesde?: string
    fechaHasta?: string
    status?: OrderStatus
  }
): Promise<OrderWithDetails[]> {
  return withDelay(async () => {
    let query = db.orders
      .where('sociedad')
      .equals(sociedad)
      .and((order) => allowedClients.includes(order.clientId))

    const orders = await query.toArray()

    let filteredOrders = orders

    // Aplicar filtros adicionales
    if (filters?.clientId) {
      filteredOrders = filteredOrders.filter((o) => o.clientId === filters.clientId)
    }

    if (filters?.fechaDesde) {
      filteredOrders = filteredOrders.filter(
        (o) => o.fechaCreacion >= filters.fechaDesde!
      )
    }

    if (filters?.fechaHasta) {
      filteredOrders = filteredOrders.filter(
        (o) => o.fechaCreacion <= filters.fechaHasta!
      )
    }

    if (filters?.status) {
      filteredOrders = filteredOrders.filter((o) => o.status === filters.status)
    }

    // Enriquecer con detalles
    const ordersWithDetails = await Promise.all(
      filteredOrders.map((order) => enrichOrderWithDetails(order))
    )

    return ordersWithDetails
  }, DELAYS.LOAD_LIST)
}

/**
 * Obtiene un pedido específico con todos sus detalles
 */
export async function getOrderById(orderId: string): Promise<OrderWithDetails | null> {
  return withDelay(async () => {
    const order = await db.orders.get(orderId)
    if (!order) return null

    return enrichOrderWithDetails(order)
  }, DELAYS.LOAD_ORDER)
}

/**
 * Enriquece un pedido con sus detalles completos
 */
async function enrichOrderWithDetails(order: Order): Promise<OrderWithDetails> {
  // Obtener cliente
  const client = await db.clients.get(order.clientId)
  if (!client) {
    throw new Error(`Cliente ${order.clientId} no encontrado`)
  }

  // Obtener dirección
  const address = client.addresses.find((a) => a.addressId === order.addressId)
  if (!address) {
    throw new Error(`Dirección ${order.addressId} no encontrada`)
  }

  // Obtener líneas del pedido
  const orderLines = await db.orderLines.where('orderId').equals(order.orderId).toArray()

  // Enriquecer líneas con detalles
  const linesWithDetails = await Promise.all(
    orderLines.map(async (line) => {
      const sku = await db.skuCatalog.get(line.skuId)
      if (!sku) {
        throw new Error(`SKU ${line.skuId} no encontrado`)
      }

      const lineWithDetails: OrderLineWithDetails = {
        ...line,
        orderedQty: Number(line.orderedQty) || 0,
        pickedQty: Number(line.pickedQty) || 0,
        checkedQty: Number(line.checkedQty) || 0,
        sku,
        trafficLight: calcularSemaforo(line),
        pendingQty: (Number(line.pickedQty) || 0) - (Number(line.checkedQty) || 0),
      }

      return lineWithDetails
    })
  )

  // Calcular totales
  const totalPicked = orderLines.reduce((sum, line) => sum + (Number(line.pickedQty) || 0), 0)
  const totalChecked = orderLines.reduce((sum, line) => sum + (Number(line.checkedQty) || 0), 0)
  const progressPercent = totalPicked > 0 ? (totalChecked / totalPicked) * 100 : 0

  // Verificar incidencias
  const incidents = await db.incidents.where('orderId').equals(order.orderId).toArray()
  const hasIncidents = incidents.length > 0

  // Calcular semáforo del pedido
  const trafficLight = calcularSemaforoPedido(orderLines)

  // Obtener conteo de etiquetas
  const labels = await db.labels.where('orderId').equals(order.orderId).toArray()
  const totalLabels = labels.length
  const openLabels = labels.filter((l) => l.status === 'OPEN').length
  const closedLabels = labels.filter((l) => l.status === 'CLOSED').length

  return {
    ...order,
    client,
    address,
    lines: linesWithDetails,
    totalPicked,
    totalChecked,
    progressPercent,
    trafficLight,
    hasIncidents,
    incidentCount: incidents.length,
    totalLabels,
    openLabels,
    closedLabels,
  }
}

/**
 * Actualiza el estado de un pedido
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  userId: string
): Promise<void> {
  await db.orders.update(orderId, {
    status,
    usuarioModificacion: userId,
    fechaModificacion: new Date().toISOString(),
  })
}

/**
 * Cambia el estado del pedido al hacer el primer scan
 */
export async function changeOrderToChkIfNeeded(orderId: string, userId: string): Promise<void> {
  const order = await db.orders.get(orderId)

  if (order && order.status === 'RECEP') {
    await updateOrderStatus(orderId, 'CHK', userId)
  }
}

/**
 * Cierra un pedido (cambia estado a CONFIRMADO WMS)
 */
export async function closeOrder(orderId: string, userId: string): Promise<void> {
  return withDelay(async () => {
    await updateOrderStatus(orderId, 'CONFIRMADO WMS', userId)

    // Congelar el SEQ/TOTAL de todas las etiquetas del pedido
    const labels = await db.labels.where('orderId').equals(orderId).toArray()
    const totalSeq = labels.length

    for (const label of labels) {
      await db.labels.update(label.labelId, {
        totalSeq,
      })
    }
  }, DELAYS.CLOSE_ORDER)
}

/**
 * Reabre un pedido (cambia estado a CHK)
 */
export async function reopenOrder(orderId: string, userId: string): Promise<void> {
  return withDelay(async () => {
    await updateOrderStatus(orderId, 'CHK', userId)

    // Descongelar el SEQ/TOTAL de todas las etiquetas
    const labels = await db.labels.where('orderId').equals(orderId).toArray()

    for (const label of labels) {
      await db.labels.update(label.labelId, {
        totalSeq: undefined,
      })
    }
  }, DELAYS.UPDATE)
}
