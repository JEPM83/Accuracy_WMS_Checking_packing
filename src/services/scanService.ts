import { db } from './db'
import type { Scan, SKU, OrderLine, ScanResult } from '../types'
import { validarSerieUnica } from '../utils/validators'
import { changeOrderToChkIfNeeded } from './orderService'
import { createIncident } from './incidentService'
import { withDelay, DELAYS } from '../utils/delays'

/**
 * Mapea EAN a SKU(s) y devuelve la UOM asociada si existe
 */
async function mapEanToSkus(ean: string): Promise<Array<{ sku: SKU; uom?: string }>> {
  const allSkus = await db.skuCatalog.toArray()
  const results: Array<{ sku: SKU; uom?: string }> = []

  for (const sku of allSkus) {
    for (const eanEntry of sku.eans) {
      // El EAN puede ser string o objeto {ean, uom}
      if (typeof eanEntry === 'string') {
        if (eanEntry === ean) {
          results.push({ sku, uom: undefined })
        }
      } else if (eanEntry.ean === ean) {
        results.push({ sku, uom: eanEntry.uom })
      }
    }
  }

  return results
}

/**
 * Obtiene las líneas del pedido que contienen un SKU
 */
async function getLinesForSku(orderId: string, skuId: string): Promise<OrderLine[]> {
  return db.orderLines
    .where('[orderId+skuId]')
    .equals([orderId, skuId])
    .toArray()
}

/**
 * Selecciona automáticamente la línea apropiada para el SKU
 * Retorna { line, requiresSelection } para implementar lógica híbrida
 */
async function autoSelectLine(
  orderId: string,
  skuId: string,
  lote?: string,
  lineId?: string // Si se proporciona lineId específico, usar ese
): Promise<{ line: OrderLine | null; requiresSelection: boolean; availableLines?: OrderLine[] }> {
  let lines = await getLinesForSku(orderId, skuId)

  if (lines.length === 0) return { line: null, requiresSelection: false }

  // Si se especificó un lineId, usar esa línea
  if (lineId) {
    const specificLine = lines.find((l) => l.lineId === lineId)
    return { line: specificLine || null, requiresSelection: false }
  }

  // Si hay una sola línea, usar esa
  if (lines.length === 1) return { line: lines[0], requiresSelection: false }

  // LÓGICA HÍBRIDA: Si hay múltiples líneas del mismo SKU
  const sku = await db.skuCatalog.get(skuId)

  if (sku && (sku.requiresLot || sku.requiresSeries)) {
    // SKU requiere trazabilidad → PREGUNTAR al usuario (más seguro)
    // Las líneas pueden tener diferentes requisitos de lote/serie
    const linesWithPending = lines.filter((line) => line.checkedQty < line.pickedQty)
    return {
      line: null,
      requiresSelection: true,
      availableLines: linesWithPending.length > 0 ? linesWithPending : lines
    }
  } else {
    // SKU NO requiere trazabilidad → AUTO-ASIGNAR secuencial (más rápido)
    // Las líneas son intercambiables
    const lineWithPending = lines.find((line) => line.checkedQty < line.pickedQty)
    return { line: lineWithPending || lines[0], requiresSelection: false }
  }
}

/**
 * Procesa el escaneo de un código (EAN o SKU)
 */
export async function processScan(
  input: string,
  orderId: string,
  labelId: string,
  userId: string,
  additionalData?: {
    skuId?: string // Para cuando hay EAN duplicado
    eanUom?: string // UOM asociada al EAN seleccionado
    serie?: string
    lote?: string
    qty?: number
    uom?: string
    quickMode?: boolean // Modo rápido: asume qty=1 y UOM=EA
    lineId?: string // Para cuando usuario selecciona línea específica
  }
): Promise<ScanResult> {
  return withDelay(async () => {
    // Paso 1: Determinar SKU y UOM asociada al EAN si existe
  let sku: SKU | undefined
  let skuId: string | undefined = additionalData?.skuId
  let eanUom: string | undefined = additionalData?.eanUom // UOM puede venir de selección previa

  if (!skuId) {
    // Intentar mapear EAN a SKU
    const skusForEan = await mapEanToSkus(input)

    if (skusForEan.length === 0) {
      // No es EAN, intentar como SKU directo
      sku = await db.skuCatalog.get(input)
      if (!sku) {
        return {
          success: false,
          message: 'Código no encontrado en el catálogo',
        }
      }
      skuId = input
    } else if (skusForEan.length === 1) {
      sku = skusForEan[0].sku
      skuId = sku.skuId
      eanUom = skusForEan[0].uom // Capturar UOM si el EAN la tiene asociada
    } else {
      // EAN duplicado - requiere selección manual
      // Pasar SKUs con sus UOMs asociadas
      return {
        success: false,
        message: 'EAN duplicado - seleccione el SKU correcto',
        requiresInput: {
          type: 'SKU_SELECTION',
          data: {
            ean: input,
            skus: skusForEan.map((s) => ({
              sku: s.sku,
              uom: s.uom
            }))
          },
        },
      }
    }
  } else {
    sku = await db.skuCatalog.get(skuId)
    if (!sku) {
      return {
        success: false,
        message: 'SKU no encontrado',
      }
    }
  }

  // Paso 2: Validar si el SKU pertenece al pedido y seleccionar línea
  const lineSelection = await autoSelectLine(orderId, skuId, additionalData?.lote, additionalData?.lineId)

  if (!lineSelection.line && !lineSelection.requiresSelection) {
    // TRUEQUE - SKU no pertenece al pedido
    const incident = await createIncident(orderId, 'TRUEQUE', userId, {
      skuId,
      labelId,
      lote: additionalData?.lote,
      comentario: `SKU ${skuId} no pertenece al pedido ${orderId}`,
    })

    return {
      success: false,
      message: `⚠️ TRUEQUE DETECTADO: Este producto no pertenece al pedido`,
      incident,
    }
  }

  // Si requiere selección de línea (múltiples líneas con trazabilidad)
  if (lineSelection.requiresSelection && lineSelection.availableLines) {
    return {
      success: false,
      message: 'Seleccione la línea específica para este SKU',
      requiresInput: {
        type: 'LINE_SELECTION',
        data: {
          skuId,
          description: sku!.description,
          lines: lineSelection.availableLines,
          eanUom,
        },
      },
    }
  }

  const line = lineSelection.line!

  // Paso 3: Validar si requiere serie
  if (sku.requiresSeries && !additionalData?.serie) {
    return {
      success: false,
      message: 'Este producto requiere serie',
      requiresInput: {
        type: 'SERIE',
        data: { skuId, description: sku.description, lineId: line.lineId },
      },
    }
  }

  // Validar serie única si se proporciona
  if (additionalData?.serie) {
    const esUnica = await validarSerieUnica(additionalData.serie)
    if (!esUnica) {
      return {
        success: false,
        message: '❌ Esta serie ya fue registrada anteriormente',
      }
    }
  }

  // Paso 4: Validar si requiere lote
  if (sku.requiresLot && !additionalData?.lote) {
    return {
      success: false,
      message: 'Este producto requiere lote',
      requiresInput: {
        type: 'LOTE',
        data: { skuId, description: sku.description, lineId: line.lineId },
      },
    }
  }

  // Paso 5: Determinar cantidad
  let qty = 1
  let qtyInEA = 1
  let uom = 'EA'

  if (sku.requiresSeries) {
    // Si requiere serie, qty siempre es 1
    qty = 1
    qtyInEA = 1
    uom = 'EA'
  } else {
    // Pedir cantidad y UOM si no se proporcionaron
    if (additionalData?.qty === undefined) {
      // En modo rápido, asumir qty=1 y UOM=EA automáticamente
      if (additionalData?.quickMode) {
        qty = 1
        uom = eanUom || 'EA'
        qtyInEA = sku.uomConversions[uom] || 1
      } else {
        return {
          success: false,
          message: 'Ingrese cantidad y unidad de medida',
          requiresInput: {
            type: 'QTY_UOM',
            data: {
              skuId,
              description: sku.description,
              lineId: line.lineId,
              availableUoms: sku.uomConversions,
              preselectedUom: eanUom, // Pre-seleccionar UOM si el EAN la tiene asociada
            },
          },
        }
      }
    }

    qty = additionalData.qty || 1
    uom = additionalData.uom || eanUom || 'EA' // Usar UOM del EAN si no se proporciona otra

    // Calcular cantidad en unidad base (EA)
    const conversion = sku.uomConversions[uom]
    if (!conversion) {
      return {
        success: false,
        message: `UOM ${uom} no válida para este producto`,
      }
    }

    qtyInEA = qty * conversion
  }

  // Paso 6: Verificar SOBRANTE
  const currentCheckedQty = Number(line.checkedQty) || 0
  const currentPickedQty = Number(line.pickedQty) || 0
  const newCheckedQty = currentCheckedQty + qtyInEA

  if (newCheckedQty > currentPickedQty) {
    // SOBRANTE detectado - requiere confirmación y autorización
    return {
      success: false,
      message: `⚠️ SOBRANTE: Está registrando ${qtyInEA} unidades pero solo faltan ${
        line.pickedQty - line.checkedQty
      }. ¿Desea continuar?`,
      requiresInput: {
        type: 'CONFIRM_SOBRANTE',
        data: {
          skuId,
          lineId: line.lineId,
          qty,
          uom,
          qtyInEA,
          serie: additionalData?.serie,
          lote: additionalData?.lote,
          sobrante: newCheckedQty - line.pickedQty,
        },
      },
    }
  }

  // Paso 7: Registrar scan
  const scan: Scan = {
    scanId: `SCN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    labelId,
    orderId,
    lineId: line.lineId,
    skuId,
    ean: input.length >= 10 ? input : undefined,
    qty,
    uom,
    qtyInEA,
    serie: additionalData?.serie,
    lote: additionalData?.lote,
    timestamp: new Date().toISOString(),
    userId,
    isRepack: false,
  }

  await db.scans.add(scan)

  // Paso 8: Actualizar CheckedQty en la línea
  await db.orderLines.update(line.lineId, {
    checkedQty: newCheckedQty,
  })

    // Paso 9: Cambiar estado del pedido a CHK si es el primer scan
    await changeOrderToChkIfNeeded(orderId, userId)

    return {
      success: true,
      message: `✓ Registrado: ${qty} ${uom} de ${sku.description}`,
      scan,
    }
  }, DELAYS.SCAN)
}

/**
 * Registra un scan con SOBRANTE (después de confirmación y autorización)
 */
export async function processScanWithSobrante(
  orderId: string,
  labelId: string,
  userId: string,
  authorizedBy: string,
  data: {
    skuId: string
    lineId: string
    qty: number
    uom: string
    qtyInEA: number
    serie?: string
    lote?: string
    sobrante: number
  }
): Promise<ScanResult> {
  return withDelay(async () => {
    // Registrar scan
  const scan: Scan = {
    scanId: `SCN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    labelId,
    orderId,
    lineId: data.lineId,
    skuId: data.skuId,
    qty: data.qty,
    uom: data.uom,
    qtyInEA: data.qtyInEA,
    serie: data.serie,
    lote: data.lote,
    timestamp: new Date().toISOString(),
    userId,
    isRepack: false,
  }

  await db.scans.add(scan)

  // Actualizar CheckedQty
  const line = await db.orderLines.get(data.lineId)
  if (line) {
    await db.orderLines.update(data.lineId, {
      checkedQty: (Number(line.checkedQty) || 0) + data.qtyInEA,
    })
  }

  // Crear incidencia SOBRANTE
  const incident = await createIncident(orderId, 'SOBRANTE', userId, {
    authorizedBy,
    skuId: data.skuId,
    labelId,
    lineId: data.lineId,
    qty: data.sobrante,
    lote: data.lote,
    comentario: `Sobrante de ${data.sobrante} unidades en ${data.skuId}`,
  })

    // Cambiar estado del pedido si es necesario
    await changeOrderToChkIfNeeded(orderId, userId)

    const sku = await db.skuCatalog.get(data.skuId)

    return {
      success: true,
      message: `✓ Registrado con SOBRANTE: ${data.qty} ${data.uom} de ${sku?.description}`,
      scan,
      incident,
    }
  }, DELAYS.SCAN)
}

/**
 * Reporta un faltante en una línea
 */
export async function reportFaltante(
  orderId: string,
  lineId: string,
  userId: string,
  comentario?: string
): Promise<void> {
  return withDelay(async () => {
    const line = await db.orderLines.get(lineId)
    if (!line) {
      throw new Error('Línea no encontrada')
    }

    const qtyFaltante = line.pickedQty - line.checkedQty

    if (qtyFaltante <= 0) {
      throw new Error('No hay faltante en esta línea')
    }

    await createIncident(orderId, 'FALTANTE', userId, {
      skuId: line.skuId,
      lineId,
      qty: qtyFaltante,
      comentario: comentario || `Faltante de ${qtyFaltante} unidades`,
    })
  }, DELAYS.CREATE)
}

/**
 * Elimina un scan y actualiza las cantidades correspondientes
 */
export async function deleteScan(scanId: string): Promise<void> {
  return withDelay(async () => {
    // Obtener el scan
    const scan = await db.scans.get(scanId)
    if (!scan) {
      throw new Error('Scan no encontrado')
    }

    // Obtener la línea asociada
    const line = await db.orderLines.get(scan.lineId)
    if (!line) {
      throw new Error('Línea no encontrada')
    }

    // Calcular nueva cantidad checkeada
    const qtyToSubtract = scan.qtyInEA || scan.qty
    const newCheckedQty = Math.max(0, (Number(line.checkedQty) || 0) - qtyToSubtract)

    // Actualizar la línea
    await db.orderLines.update(scan.lineId, {
      checkedQty: newCheckedQty,
    })

    // Eliminar el scan
    // Si tenía serie, la serie quedará automáticamente disponible
    await db.scans.delete(scanId)
  }, DELAYS.DELETE)
}

/**
 * Elimina todos los scans de una etiqueta
 */
export async function deleteAllScansFromLabel(labelId: string): Promise<void> {
  return withDelay(async () => {
    // Obtener todos los scans de la etiqueta
    const scans = await db.scans.where('labelId').equals(labelId).toArray()

    if (scans.length === 0) {
      throw new Error('No hay scans para eliminar')
    }

    // Agrupar scans por lineId para actualizar cantidades
    const lineUpdates = new Map<string, number>()

    for (const scan of scans) {
      const qtyToSubtract = scan.qtyInEA || scan.qty
      const currentSubtraction = lineUpdates.get(scan.lineId) || 0
      lineUpdates.set(scan.lineId, currentSubtraction + qtyToSubtract)
    }

    // Actualizar todas las líneas afectadas
    for (const [lineId, qtyToSubtract] of lineUpdates) {
      const line = await db.orderLines.get(lineId)
      if (line) {
        const newCheckedQty = Math.max(0, (Number(line.checkedQty) || 0) - qtyToSubtract)
        await db.orderLines.update(lineId, {
          checkedQty: newCheckedQty,
        })
      }
    }

    // Eliminar todos los scans
    await db.scans.where('labelId').equals(labelId).delete()
  }, DELAYS.DELETE)
}
