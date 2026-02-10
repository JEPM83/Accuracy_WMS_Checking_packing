import { useState } from 'react'
import Button from './Button'
import Modal from './Modal'
import { resetDemoData } from '../../services/seedService'
import toast from 'react-hot-toast'

export default function ResetDataButton() {
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleReset = async () => {
    setLoading(true)

    try {
      await resetDemoData()
      toast.success('Datos reseteados correctamente')

      // Recargar la página después de 1 segundo
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error('Error reseteando datos:', error)
      toast.error('Error al resetear datos')
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="danger"
        onClick={() => setModalOpen(true)}
      >
        🔄 Reset Demo Data
      </Button>

      <Modal
        isOpen={modalOpen}
        onClose={() => !loading && setModalOpen(false)}
        title="Resetear Datos de Demostración"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm font-medium text-red-900 mb-2">
              ⚠️ Advertencia
            </p>
            <p className="text-sm text-red-800">
              Esta acción eliminará TODOS los datos actuales (pedidos, etiquetas, scans, incidencias)
              y restaurará los datos iniciales de demostración.
            </p>
            <p className="text-sm text-red-800 mt-2">
              Esta operación no se puede deshacer.
            </p>
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={handleReset}
              variant="danger"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Reseteando...' : 'Confirmar Reset'}
            </Button>
            <Button
              onClick={() => setModalOpen(false)}
              variant="secondary"
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
