import { useState, ReactNode } from 'react'
import ConfirmDialog from '../components/common/ConfirmDialog'

interface ConfirmOptions {
  title: string
  message: string | ReactNode
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

export function useConfirm() {
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean
    options: ConfirmOptions | null
    onConfirm: (() => void) | null
  }>({
    isOpen: false,
    options: null,
    onConfirm: null,
  })

  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        options,
        onConfirm: () => {
          resolve(true)
          setConfirmState({ isOpen: false, options: null, onConfirm: null })
        },
      })

      // Timeout para resolver como false si se cierra sin confirmar
      const handleCancel = () => {
        resolve(false)
        setConfirmState({ isOpen: false, options: null, onConfirm: null })
      }

      // Guardar handleCancel en el estado
      setConfirmState((prev) => ({
        ...prev,
        onCancel: handleCancel,
      }))
    })
  }

  const ConfirmDialogComponent = confirmState.isOpen && confirmState.options ? (
    <ConfirmDialog
      isOpen={confirmState.isOpen}
      title={confirmState.options.title}
      message={confirmState.options.message}
      confirmText={confirmState.options.confirmText}
      cancelText={confirmState.options.cancelText}
      variant={confirmState.options.variant}
      onConfirm={() => {
        confirmState.onConfirm?.()
      }}
      onCancel={() => {
        setConfirmState({ isOpen: false, options: null, onConfirm: null })
      }}
    />
  ) : null

  return { confirm, ConfirmDialogComponent }
}
