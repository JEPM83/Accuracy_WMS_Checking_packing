import { useState } from 'react'
import Button from '../../common/Button'
import { generateLabelsPDF } from '../../../utils/pdfGenerator'
import type { OrderWithDetails, LabelWithDetails } from '../../../types'
import toast from 'react-hot-toast'

interface PrintLabelsButtonProps {
  order: OrderWithDetails
  labels: LabelWithDetails[]
}

export default function PrintLabelsButton({ order, labels }: PrintLabelsButtonProps) {
  const [generating, setGenerating] = useState(false)

  const handlePrint = async () => {
    if (labels.length === 0) {
      toast.error('No hay etiquetas para imprimir')
      return
    }

    setGenerating(true)

    try {
      await generateLabelsPDF(order, labels)
      toast.success('PDF generado correctamente')
    } catch (error) {
      console.error('Error generando PDF:', error)
      toast.error('Error al generar PDF')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Button
      onClick={handlePrint}
      disabled={generating || labels.length === 0}
      variant="secondary"
      title={generating ? 'Generando PDF...' : 'Descargar PDF Etiquetas'}
      className="!px-3"
    >
      {generating ? (
        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
      )}
    </Button>
  )
}
