import { useState } from 'react'
import { useAuth } from './useAuth'
import { validateSupervisorPassword } from '../services/authService'
import type { AuthorizationResult } from '../types'

export function useAuthorization() {
  const { session } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<{
    action: string
    onAuthorized: (authorizedBy: string) => void
    onCancelled: () => void
  } | null>(null)

  /**
   * Solicita autorización para una acción
   */
  const requestAuthorization = (
    action: string,
    onAuthorized: (authorizedBy: string) => void,
    onCancelled?: () => void
  ): void => {
    if (!session) return

    // Si es SUPERVISOR o ADMIN, autorizar inmediatamente
    if (session.user.role === 'SUPERVISOR' || session.user.role === 'ADMIN') {
      onAuthorized(session.user.userId)
      return
    }

    // Si es OPERARIO, abrir modal para pedir clave de supervisor
    setPendingAction({
      action,
      onAuthorized,
      onCancelled: onCancelled || (() => {}),
    })
    setIsModalOpen(true)
  }

  /**
   * Valida la clave de supervisor ingresada
   */
  const validatePassword = async (password: string): Promise<AuthorizationResult> => {
    const supervisor = await validateSupervisorPassword(password)

    if (supervisor) {
      return {
        authorized: true,
        authorizedBy: supervisor.userId,
      }
    }

    return {
      authorized: false,
      authorizedBy: '',
      message: 'Contraseña incorrecta',
    }
  }

  /**
   * Confirma la autorización
   */
  const confirmAuthorization = (authorizedBy: string): void => {
    if (pendingAction) {
      pendingAction.onAuthorized(authorizedBy)
      setPendingAction(null)
      setIsModalOpen(false)
    }
  }

  /**
   * Cancela la autorización
   */
  const cancelAuthorization = (): void => {
    if (pendingAction) {
      pendingAction.onCancelled()
      setPendingAction(null)
      setIsModalOpen(false)
    }
  }

  return {
    requestAuthorization,
    validatePassword,
    confirmAuthorization,
    cancelAuthorization,
    isModalOpen,
    pendingAction,
  }
}
