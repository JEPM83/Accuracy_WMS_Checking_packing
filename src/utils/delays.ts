/**
 * Simula un delay de red para dar sensación de aplicación online
 */
export const simulateNetworkDelay = (min: number = 500, max: number = 1500): Promise<void> => {
  const delay = Math.random() * (max - min) + min
  return new Promise((resolve) => setTimeout(resolve, delay))
}

/**
 * Delays predefinidos para diferentes tipos de operaciones
 */
export const DELAYS = {
  // Autenticación y seguridad
  LOGIN: { min: 800, max: 1500 },
  AUTHORIZATION: { min: 500, max: 1000 },

  // Operaciones de lectura
  LOAD_DATA: { min: 600, max: 1200 },
  LOAD_ORDER: { min: 500, max: 1000 },
  LOAD_LIST: { min: 400, max: 800 },

  // Operaciones de escritura
  SCAN: { min: 400, max: 800 },
  CREATE: { min: 500, max: 1000 },
  UPDATE: { min: 400, max: 900 },
  DELETE: { min: 400, max: 800 },

  // Operaciones complejas
  CLOSE_LABEL: { min: 800, max: 1500 },
  CLOSE_ORDER: { min: 1000, max: 2000 },
  GENERATE_PDF: { min: 1200, max: 2000 },
  REPACK: { min: 600, max: 1200 },

  // Operaciones rápidas
  QUICK: { min: 200, max: 400 },
}

/**
 * Ejecuta una operación con delay simulado
 */
export async function withDelay<T>(
  operation: () => Promise<T>,
  delayConfig: { min: number; max: number } = DELAYS.LOAD_DATA
): Promise<T> {
  const [result] = await Promise.all([
    operation(),
    simulateNetworkDelay(delayConfig.min, delayConfig.max)
  ])
  return result
}
