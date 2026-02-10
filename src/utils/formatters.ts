/**
 * Formatea una fecha a formato local español
 */
export function formatearFecha(fecha: string | Date, incluirHora: boolean = true): string {
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }

  if (incluirHora) {
    options.hour = '2-digit'
    options.minute = '2-digit'
  }

  return date.toLocaleString('es-PE', options)
}

/**
 * Formatea un peso en kg con decimales
 */
export function formatearPeso(peso: number, decimales: number = 2): string {
  return `${peso.toFixed(decimales)} kg`
}

/**
 * Formatea un porcentaje
 */
export function formatearPorcentaje(valor: number, total: number): string {
  if (total === 0) return '0%'
  const porcentaje = (valor / total) * 100
  return `${porcentaje.toFixed(1)}%`
}

/**
 * Formatea un labelId
 */
export function formatearLabelId(
  clientPrefix: string,
  orderId: string,
  seq: number,
  totalSeq?: number
): string {
  const seqStr = seq.toString().padStart(2, '0')

  if (totalSeq !== undefined) {
    return `${clientPrefix}-${orderId}-${seqStr}/${totalSeq.toString().padStart(2, '0')}`
  }

  return `${clientPrefix}-${orderId}-${seqStr}/?`
}

/**
 * Formatea un número con separadores de miles
 */
export function formatearNumero(numero: number): string {
  return numero.toLocaleString('es-PE')
}
