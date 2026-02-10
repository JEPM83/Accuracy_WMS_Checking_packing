import jsPDF from 'jspdf'
import QRCode from 'qrcode'
import type { LabelWithDetails, OrderWithDetails } from '../types'
import { formatearFecha, formatearPeso } from './formatters'
import { withDelay, DELAYS } from './delays'

/**
 * Genera un PDF con todas las etiquetas de un pedido
 */
export async function generateLabelsPDF(
  order: OrderWithDetails,
  labels: LabelWithDetails[]
): Promise<void> {
  return withDelay(async () => {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [100, 150], // 10cm x 15cm
    })

    let isFirstPage = true

    for (const label of labels) {
      if (!isFirstPage) {
        pdf.addPage()
      }
      isFirstPage = false

      await renderLabel(pdf, order, label)
    }

    // Descargar PDF
    const filename = `Etiquetas_${order.orderId}_${new Date().toISOString().split('T')[0]}.pdf`
    pdf.save(filename)
  }, DELAYS.GENERATE_PDF)
}

/**
 * Renderiza una etiqueta en una página del PDF
 */
async function renderLabel(
  pdf: jsPDF,
  order: OrderWithDetails,
  label: LabelWithDetails
): Promise<void> {
  const pageWidth = 100
  const pageHeight = 150
  const margin = 5

  // Colores Accuracy
  const accuracyNavy = [0, 54, 95] // #00365f
  const accuracyMedium = [37, 120, 181] // #2578b5

  // Encabezado con color Accuracy
  pdf.setFillColor(accuracyMedium[0], accuracyMedium[1], accuracyMedium[2])
  pdf.rect(0, 0, pageWidth, 25, 'F')

  // Título en blanco
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.text('ACCURACY WMS', pageWidth / 2, margin + 6, { align: 'center' })

  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  pdf.text('Etiqueta de Pedido', pageWidth / 2, margin + 11, { align: 'center' })

  // Label ID en blanco sobre fondo
  const labelIdDisplay = label.totalSeq
    ? `${label.seq.toString().padStart(2, '0')}/${label.totalSeq.toString().padStart(2, '0')}`
    : `${label.seq.toString().padStart(2, '0')}/?`

  pdf.setFontSize(20)
  pdf.setFont('helvetica', 'bold')
  pdf.text(`#${labelIdDisplay}`, pageWidth / 2, margin + 20, { align: 'center' })

  // Restablecer color de texto a navy
  pdf.setTextColor(accuracyNavy[0], accuracyNavy[1], accuracyNavy[2])

  // Información del pedido
  let yPos = margin + 30

  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Pedido:', margin, yPos)
  pdf.setFont('helvetica', 'normal')
  pdf.text(order.orderId, margin + 25, yPos)

  yPos += 6
  pdf.setFont('helvetica', 'bold')
  pdf.text('Sociedad:', margin, yPos)
  pdf.setFont('helvetica', 'normal')
  pdf.text(order.sociedad, margin + 25, yPos)

  yPos += 6
  pdf.setFont('helvetica', 'bold')
  pdf.text('Cliente:', margin, yPos)
  pdf.setFont('helvetica', 'normal')
  pdf.text(order.client.clientName, margin + 25, yPos)

  yPos += 6
  pdf.setFont('helvetica', 'bold')
  pdf.text('Dirección:', margin, yPos)
  pdf.setFont('helvetica', 'normal')

  // Dirección multilinea
  const addressText = `${order.address.street}, ${order.address.city}`
  const addressLines = pdf.splitTextToSize(addressText, pageWidth - margin * 2 - 25)
  pdf.text(addressLines, margin + 25, yPos)
  yPos += 6 * addressLines.length

  // Contenido de la etiqueta
  yPos += 4
  pdf.setDrawColor(accuracyMedium[0], accuracyMedium[1], accuracyMedium[2])
  pdf.setLineWidth(0.5)
  pdf.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 6

  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'bold')
  pdf.text('CONTENIDO:', margin, yPos)
  yPos += 5

  pdf.setFont('helvetica', 'normal')
  for (const item of label.skuSummary.slice(0, 5)) {
    // Máximo 5 items
    const text = `${item.qty}x ${item.description.substring(0, 30)}`
    pdf.text(text, margin, yPos)
    yPos += 4
  }

  if (label.skuSummary.length > 5) {
    pdf.setFont('helvetica', 'italic')
    pdf.text(`... y ${label.skuSummary.length - 5} más`, margin, yPos)
    yPos += 4
  }

  // Pesos
  yPos += 2
  pdf.setDrawColor(accuracyMedium[0], accuracyMedium[1], accuracyMedium[2])
  pdf.setLineWidth(0.5)
  pdf.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 6

  pdf.setFont('helvetica', 'bold')
  pdf.text('Peso Teórico:', margin, yPos)
  pdf.setFont('helvetica', 'normal')
  pdf.text(formatearPeso(label.theoreticalWeight), margin + 30, yPos)

  if (label.realWeight) {
    yPos += 5
    pdf.setFont('helvetica', 'bold')
    pdf.text('Peso Real:', margin, yPos)
    pdf.setFont('helvetica', 'normal')
    pdf.text(formatearPeso(label.realWeight), margin + 30, yPos)
  }

  // Usuario y fecha
  if (label.usuarioCierre && label.fechaCierre) {
    yPos += 6
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'italic')
    pdf.text(`Cerrado por: ${label.usuarioCierre}`, margin, yPos)
    yPos += 4
    pdf.text(`Fecha: ${formatearFecha(label.fechaCierre)}`, margin, yPos)
  }

  // QR Code
  const qrData = JSON.stringify({
    labelId: label.labelId,
    orderId: order.orderId,
    sociedad: order.sociedad,
  })

  try {
    const qrDataURL = await QRCode.toDataURL(qrData, {
      width: 200,
      margin: 1,
    })

    const qrSize = 35
    const qrX = pageWidth - margin - qrSize
    const qrY = pageHeight - margin - qrSize - 5

    pdf.addImage(qrDataURL, 'PNG', qrX, qrY, qrSize, qrSize)
  } catch (error) {
    console.error('Error generando QR:', error)
  }

  // Pie de página con branding Accuracy
  pdf.setFillColor(accuracyNavy[0], accuracyNavy[1], accuracyNavy[2])
  pdf.rect(0, pageHeight - 8, pageWidth, 8, 'F')

  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Accuracy Supply Chain Solutions', pageWidth / 2, pageHeight - 4, { align: 'center' })
  pdf.setFontSize(6)
  pdf.setFont('helvetica', 'normal')
  pdf.text('WMS Checking & Packing', pageWidth / 2, pageHeight - 1.5, { align: 'center' })
}
