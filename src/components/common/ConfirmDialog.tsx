import { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import Button from './Button'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string | ReactNode
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null

  const variantStyles = {
    danger: {
      icon: '⚠️',
      bgColor: 'from-red-50 to-red-100',
      borderColor: 'border-red-300',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
    },
    warning: {
      icon: '⚡',
      bgColor: 'from-yellow-50 to-yellow-100',
      borderColor: 'border-yellow-300',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
    },
    info: {
      icon: 'ℹ️',
      bgColor: 'from-blue-50 to-blue-100',
      borderColor: 'border-blue-300',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
  }

  const style = variantStyles[variant]

  return createPortal(
    <div className="fixed inset-0 z-[200] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        {/* Overlay */}
        <div
          className="fixed inset-0 z-[199] bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onCancel}
        />

        {/* Dialog */}
        <div className="relative z-[201] w-full max-w-md bg-white rounded-2xl shadow-2xl border-2 border-accuracy-light/30 transform transition-all">
          {/* Header con icono */}
          <div className={`bg-gradient-to-r ${style.bgColor} border-b-2 ${style.borderColor} rounded-t-2xl px-6 py-4`}>
            <div className="flex items-center gap-3">
              <div className={`${style.iconBg} ${style.iconColor} rounded-full w-12 h-12 flex items-center justify-center text-2xl`}>
                {style.icon}
              </div>
              <h3 className="text-xl font-bold text-accuracy-navy font-outfit">{title}</h3>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            <div className="text-base text-accuracy-navy font-outfit leading-relaxed whitespace-pre-line">
              {message}
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 flex gap-3">
            <Button
              onClick={onCancel}
              variant="secondary"
              className="flex-1"
            >
              {cancelText}
            </Button>
            <Button
              onClick={() => {
                onConfirm()
                onCancel()
              }}
              variant={variant === 'info' ? 'primary' : variant}
              className="flex-1"
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
