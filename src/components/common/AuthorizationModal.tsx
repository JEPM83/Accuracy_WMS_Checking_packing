import { useState } from 'react'
import Modal from './Modal'
import Input from './Input'
import Button from './Button'

interface AuthorizationModalProps {
  isOpen: boolean
  action: string
  onValidate: (password: string) => Promise<{ authorized: boolean; authorizedBy: string; message?: string }>
  onConfirm: (authorizedBy: string) => void
  onCancel: () => void
}

export default function AuthorizationModal({
  isOpen,
  action,
  onValidate,
  onConfirm,
  onCancel,
}: AuthorizationModalProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!password) {
      setError('Ingrese la contraseña')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await onValidate(password)

      if (result.authorized) {
        onConfirm(result.authorizedBy)
        setPassword('')
        setError('')
      } else {
        setError(result.message || 'Contraseña incorrecta')
      }
    } catch (err) {
      setError('Error al validar contraseña')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setPassword('')
    setError('')
    onCancel()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title="Autorización Requerida" size="sm">
      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            <strong>Acción:</strong> {action}
          </p>
          <p className="text-xs text-yellow-700 mt-1">
            Se requiere autorización de supervisor o administrador
          </p>
        </div>

        <Input
          type="password"
          label="Contraseña de Supervisor/Admin"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={error}
          placeholder="Ingrese contraseña"
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSubmit()
            }
          }}
        />

        <div className="flex space-x-2">
          <Button onClick={handleSubmit} disabled={loading} className="flex-1">
            {loading ? 'Validando...' : 'Autorizar'}
          </Button>
          <Button onClick={handleCancel} variant="secondary" disabled={loading} className="flex-1">
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
