import { db } from '../services/db'
import type { TrafficLight, OrderLine } from '../types'

/**
 * Calcula el semáforo (traffic light) para una línea de pedido
 */
export function calcularSemaforo(line: OrderLine): TrafficLight {
  const pickedQty = Number(line.pickedQty) || 0
  const checkedQty = Number(line.checkedQty) || 0

  // Verde: Checked == Picked (100% completado)
  if (checkedQty === pickedQty) {
    return 'green'
  }

  // Amarillo: Checked > 0 (tiene progreso parcial)
  if (checkedQty > 0) {
    return 'yellow'
  }

  // Rojo: Checked == 0 (no ha empezado)
  return 'red'
}

/**
 * Calcula el semáforo para un pedido completo
 */
export function calcularSemaforoPedido(lines: OrderLine[]): TrafficLight {
  if (lines.length === 0) return 'green'

  // Verde: Todas las líneas completadas
  const allComplete = lines.every((line) => (Number(line.checkedQty) || 0) === (Number(line.pickedQty) || 0))
  if (allComplete) return 'green'

  // Rojo: Ninguna línea tiene progreso
  const hasProgress = lines.some((line) => (Number(line.checkedQty) || 0) > 0)
  if (!hasProgress) return 'red'

  // Amarillo: Hay progreso parcial
  return 'yellow'
}

/**
 * Valida si una serie es única globalmente
 */
export async function validarSerieUnica(serie: string): Promise<boolean> {
  const existingScan = await db.scans.where('serie').equals(serie).first()
  return !existingScan
}

/**
 * Valida si un SKU pertenece a un pedido
 */
export async function validarSKUEnPedido(
  skuId: string,
  orderId: string
): Promise<boolean> {
  const line = await db.orderLines
    .where('[orderId+skuId]')
    .equals([orderId, skuId])
    .first()

  return !!line
}

/**
 * Calcula el peso teórico de una etiqueta
 */
export async function calcularPesoTeorico(labelId: string): Promise<number> {
  const scans = await db.scans.where('labelId').equals(labelId).toArray()

  let totalWeight = 0

  for (const scan of scans) {
    const sku = await db.skuCatalog.get(scan.skuId)
    if (sku) {
      totalWeight += sku.weightPerEA * scan.qtyInEA
    }
  }

  return totalWeight
}

/**
 * Valida si la diferencia de peso supera el umbral
 * @param pesoTeorico - Peso teórico en kg
 * @param pesoReal - Peso real en kg
 * @param umbralPorcentaje - Umbral en porcentaje (default 5%)
 * @param umbralAbsoluto - Umbral absoluto en kg (default 0.5kg)
 */
export function validarDiferenciaPeso(
  pesoTeorico: number,
  pesoReal: number,
  umbralPorcentaje: number = 5,
  umbralAbsoluto: number = 0.5
): boolean {
  const diferencia = Math.abs(pesoReal - pesoTeorico)
  const porcentajeDiferencia = (diferencia / pesoTeorico) * 100

  return porcentajeDiferencia > umbralPorcentaje || diferencia > umbralAbsoluto
}
