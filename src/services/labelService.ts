import { db } from './db'
import type { Label, LabelStatus, LabelWithDetails, Scan } from '../types'
import { calcularPesoTeorico, validarDiferenciaPeso } from '../utils/validators'
import { withDelay, DELAYS } from '../utils/delays'

/**
 * Genera un ID único para una etiqueta
 */
function generateLabelId(): string {
  return `LBL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Crea una nueva etiqueta para un pedido
 */
export async function createLabel(orderId: string, userId: string): Promise<Label> {
  return withDelay(async () => {
    const order = await db.orders.get(orderId)
    if (!order) {
      throw new Error('Pedido no encontrado')
    }

    // Obtener el siguiente SEQ
    const existingLabels = await db.labels.where('orderId').equals(orderId).toArray()
    const nextSeq = existingLabels.length + 1

    const label: Label = {
      labelId: generateLabelId(),
      orderId,
      seq: nextSeq,
      status: 'OPEN',
      fechaCreacion: new Date().toISOString(),
      requiresReprint: false,
    }

    await db.labels.add(label)
    return label
  }, DELAYS.CREATE)
}

/**
 * Obtiene todas las etiquetas de un pedido con sus detalles
 */
export async function getLabelsForOrder(orderId: string): Promise<LabelWithDetails[]> {
  const labels = await db.labels.where('orderId').equals(orderId).toArray()

  const labelsWithDetails = await Promise.all(
    labels.map(async (label) => {
      const scans = await db.scans.where('labelId').equals(label.labelId).toArray()

      // Calcular cantidad total de items
      const itemCount = scans.reduce((sum, scan) => sum + scan.qtyInEA, 0)

      // Calcular peso teórico
      const theoreticalWeight = await calcularPesoTeorico(label.labelId)

      // Agrupar scans por SKU
      const skuMap = new Map<string, { description: string; qty: number }>()

      for (const scan of scans) {
        const sku = await db.skuCatalog.get(scan.skuId)
        if (sku) {
          const existing = skuMap.get(scan.skuId)
          if (existing) {
            existing.qty += scan.qtyInEA
          } else {
            skuMap.set(scan.skuId, {
              description: sku.description,
              qty: scan.qtyInEA,
            })
          }
        }
      }

      const skuSummary = Array.from(skuMap.entries()).map(([skuId, data]) => ({
        skuId,
        description: data.description,
        qty: data.qty,
      }))

      const labelWithDetails: LabelWithDetails = {
        ...label,
        scans,
        itemCount,
        theoreticalWeight,
        skuSummary,
      }

      return labelWithDetails
    })
  )

  return labelsWithDetails.sort((a, b) => a.seq - b.seq)
}

/**
 * Elimina una etiqueta (solo si no tiene scans) y resecuencia las demás
 */
export async function deleteLabel(labelId: string): Promise<void> {
  return withDelay(async () => {
    const label = await db.labels.get(labelId)
    if (!label) {
      throw new Error('Etiqueta no encontrada')
    }

    const scans = await db.scans.where('labelId').equals(labelId).toArray()

    if (scans.length > 0) {
      throw new Error(
        'No se puede eliminar una etiqueta con scans asignados. Elimine primero todos los scans manualmente.'
      )
    }

    const orderId = label.orderId

    // Eliminar la etiqueta
    await db.labels.delete(labelId)

    // Obtener todas las etiquetas restantes del pedido
    const remainingLabels = await db.labels
      .where('orderId')
      .equals(orderId)
      .toArray()

    // Ordenar por seq actual
    remainingLabels.sort((a, b) => a.seq - b.seq)

    // Resecuenciar las etiquetas restantes
    for (let i = 0; i < remainingLabels.length; i++) {
      const newSeq = i + 1
      if (remainingLabels[i].seq !== newSeq) {
        await db.labels.update(remainingLabels[i].labelId, {
          seq: newSeq,
        })
      }
    }
  }, DELAYS.DELETE)
}

/**
 * Cierra una etiqueta con simulación de balanza
 */
export async function closeLabel(
  labelId: string,
  userId: string,
  pesoRealEditado?: number
): Promise<{ label: Label; incidentCreated: boolean }> {
  return withDelay(async () => {
    const label = await db.labels.get(labelId)
    if (!label) {
      throw new Error('Etiqueta no encontrada')
    }

    if (label.status === 'CLOSED') {
      throw new Error('La etiqueta ya está cerrada')
    }

    // Calcular peso teórico
    const pesoTeorico = await calcularPesoTeorico(labelId)

    // Simular balanza: peso real cercano al teórico (±3%)
    let pesoReal: number
    if (pesoRealEditado !== undefined) {
      pesoReal = pesoRealEditado
    } else {
      const variacion = (Math.random() - 0.5) * 0.06 // ±3%
      pesoReal = pesoTeorico * (1 + variacion)
      pesoReal = Math.round(pesoReal * 100) / 100 // 2 decimales
    }

    // Verificar diferencia de peso
    let incidentCreated = false
    const hayDiferencia = validarDiferenciaPeso(pesoTeorico, pesoReal)

    if (hayDiferencia) {
      // Crear incidencia DIF_PESO
      const incident = {
        incidentId: `INC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        orderId: label.orderId,
        tipo: 'DIF_PESO' as const,
        timestamp: new Date().toISOString(),
        userId,
        labelId,
        pesoTeorico,
        pesoReal,
        comentario: `Diferencia de peso detectada: ${Math.abs(pesoReal - pesoTeorico).toFixed(2)} kg`,
        resolved: false,
      }

      await db.incidents.add(incident)
      incidentCreated = true
    }

    // Cerrar etiqueta
    await db.labels.update(labelId, {
      status: 'CLOSED',
      theoreticalWeight: pesoTeorico,
      realWeight: pesoReal,
      fechaCierre: new Date().toISOString(),
      usuarioCierre: userId,
      requiresReprint: true,
    })

    const updatedLabel = await db.labels.get(labelId)
    return { label: updatedLabel!, incidentCreated }
  }, DELAYS.CLOSE_LABEL)
}

/**
 * Reabre una etiqueta cerrada (requiere autorización)
 */
export async function reopenLabel(labelId: string): Promise<void> {
  return withDelay(async () => {
    const label = await db.labels.get(labelId)
    if (!label) {
      throw new Error('Etiqueta no encontrada')
    }

    if (label.status !== 'CLOSED') {
      throw new Error('La etiqueta ya está abierta')
    }

    await db.labels.update(labelId, {
      status: 'OPEN',
      fechaCierre: undefined,
      usuarioCierre: undefined,
    })
  }, DELAYS.UPDATE)
}

/**
 * Elimina un scan específico
 */
export async function deleteScan(scanId: string): Promise<void> {
  const scan = await db.scans.get(scanId)
  if (!scan) {
    throw new Error('Scan no encontrado')
  }

  // Actualizar CheckedQty en order_lines
  const line = await db.orderLines.get(scan.lineId)
  if (line) {
    const newCheckedQty = Math.max(0, (Number(line.checkedQty) || 0) - scan.qtyInEA)
    await db.orderLines.update(scan.lineId, {
      checkedQty: newCheckedQty,
    })
  }

  await db.scans.delete(scanId)
}

/**
 * Repack: mueve scans de una etiqueta a otra
 */
export async function repackScans(
  fromLabelId: string,
  toLabelId: string,
  scanIds: string[],
  userId: string
): Promise<void> {
  const fromLabel = await db.labels.get(fromLabelId)
  const toLabel = await db.labels.get(toLabelId)

  if (!fromLabel || !toLabel) {
    throw new Error('Etiquetas no encontradas')
  }

  if (fromLabel.status !== 'OPEN' || toLabel.status !== 'OPEN') {
    throw new Error('Ambas etiquetas deben estar abiertas para hacer repack')
  }

  // Obtener scans a mover
  const scansToMove = await Promise.all(
    scanIds.map((id) => db.scans.get(id))
  )

  if (scansToMove.some((s) => !s)) {
    throw new Error('Algunos scans no fueron encontrados')
  }

  // Para cada scan, crear uno negativo en origen y uno positivo en destino
  for (const scan of scansToMove as Scan[]) {
    // Scan negativo en origen
    const negativeScan: Scan = {
      ...scan,
      scanId: `SCN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      qty: -scan.qty,
      qtyInEA: -scan.qtyInEA,
      timestamp: new Date().toISOString(),
      userId,
      isRepack: true,
      repackFrom: fromLabelId,
      repackTo: toLabelId,
    }

    // Scan positivo en destino
    const positiveScan: Scan = {
      ...scan,
      scanId: `SCN-${Date.now()}-${Math.random().toString(36).substr(2, 9) + '1'}`,
      labelId: toLabelId,
      timestamp: new Date().toISOString(),
      userId,
      isRepack: true,
      repackFrom: fromLabelId,
      repackTo: toLabelId,
    }

    await db.scans.add(negativeScan)
    await db.scans.add(positiveScan)
  }
}
