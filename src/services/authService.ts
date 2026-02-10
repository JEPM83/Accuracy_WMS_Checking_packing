import { db } from './db'
import type { User, Sociedad } from '../types'
import { withDelay, DELAYS } from '../utils/delays'

export interface AuthSession {
  user: User
  sociedad: Sociedad
  allowedClients: string[]
}

const SESSION_KEY = 'wms_session'

export async function login(
  username: string,
  password: string,
  sociedad: Sociedad
): Promise<AuthSession> {
  return withDelay(async () => {
    const user = await db.users.where('username').equals(username).first()

    if (!user || user.password !== password) {
      throw new Error('Usuario o contraseña incorrectos')
    }

    // Obtener clientes permitidos para esta sociedad
    const userClients = await db.userClients
      .where('[userId+sociedad]')
      .equals([user.userId, sociedad])
      .toArray()

    const allowedClients = userClients.map((uc) => uc.clientId)

    const session: AuthSession = {
      user,
      sociedad,
      allowedClients,
    }

    // Guardar sesión en localStorage
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))

    return session
  }, DELAYS.LOGIN)
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY)
}

export function getSession(): AuthSession | null {
  const sessionData = localStorage.getItem(SESSION_KEY)
  if (!sessionData) return null

  try {
    return JSON.parse(sessionData) as AuthSession
  } catch {
    return null
  }
}

export function isAuthenticated(): boolean {
  return getSession() !== null
}

export async function validateSupervisorPassword(password: string): Promise<User | null> {
  return withDelay(async () => {
    const supervisor = await db.users
      .where('password')
      .equals(password)
      .and((user) => user.role === 'SUPERVISOR' || user.role === 'ADMIN')
      .first()

    return supervisor || null
  }, DELAYS.AUTHORIZATION)
}

export async function canUserAccessClient(
  userId: string,
  clientId: string,
  sociedad: Sociedad
): Promise<boolean> {
  const userClient = await db.userClients
    .where('[userId+clientId+sociedad]')
    .equals([userId, clientId, sociedad])
    .first()

  return !!userClient
}
