import { db } from './db'
import usersData from '../seeds/users.json'
import userClientsData from '../seeds/user_clients.json'
import clientsData from '../seeds/clients.json'
import ordersData from '../seeds/orders.json'
import orderLinesData from '../seeds/order_lines.json'
import skuCatalogData from '../seeds/sku_catalog.json'
import labelsData from '../seeds/labels.json'
import scansData from '../seeds/scans.json'
import incidentsData from '../seeds/incidents.json'

export async function initializeDatabase() {
  try {
    // Verificar si ya existen datos
    const userCount = await db.users.count()

    if (userCount === 0) {
      console.log('Inicializando base de datos con seeds...')
      await loadSeeds()
      console.log('Base de datos inicializada correctamente')
    } else {
      console.log('Base de datos ya inicializada')
    }
  } catch (error) {
    console.error('Error al inicializar base de datos:', error)
    throw error
  }
}

export async function loadSeeds() {
  try {
    await db.transaction('rw', [
      db.users,
      db.userClients,
      db.clients,
      db.orders,
      db.orderLines,
      db.skuCatalog,
      db.labels,
      db.scans,
      db.incidents,
    ], async () => {
        await db.users.bulkAdd(usersData as any)
        await db.userClients.bulkAdd(userClientsData as any)
        await db.clients.bulkAdd(clientsData as any)
        await db.orders.bulkAdd(ordersData as any)
        await db.orderLines.bulkAdd(orderLinesData as any)
        await db.skuCatalog.bulkAdd(skuCatalogData as any)
        await db.labels.bulkAdd(labelsData as any)
        await db.scans.bulkAdd(scansData as any)
        await db.incidents.bulkAdd(incidentsData as any)
      }
    )
    console.log('Seeds cargados correctamente')
  } catch (error) {
    console.error('Error al cargar seeds:', error)
    throw error
  }
}

export async function resetDemoData() {
  try {
    console.log('🔄 Reseteando datos de demostración...')

    console.log('📋 Paso 1: Limpiando tablas...')
    await db.transaction('rw', [
      db.users,
      db.userClients,
      db.clients,
      db.orders,
      db.orderLines,
      db.skuCatalog,
      db.labels,
      db.scans,
      db.incidents,
      db.settings,
    ], async () => {
        await db.users.clear()
        await db.userClients.clear()
        await db.clients.clear()
        await db.orders.clear()
        await db.orderLines.clear()
        await db.skuCatalog.clear()
        await db.labels.clear()
        await db.scans.clear()
        await db.incidents.clear()
        await db.settings.clear()
      }
    )
    console.log('✅ Tablas limpiadas')

    console.log('📋 Paso 2: Cargando seeds...')
    console.log('  - Users:', usersData.length)
    console.log('  - UserClients:', userClientsData.length)
    console.log('  - Clients:', clientsData.length)
    console.log('  - Orders:', ordersData.length)
    console.log('  - OrderLines:', orderLinesData.length)
    console.log('  - SKU Catalog:', skuCatalogData.length)

    await loadSeeds()
    console.log('✅ Seeds cargados correctamente')
    console.log('✅ Datos de demostración reseteados correctamente')

    return true
  } catch (error) {
    console.error('❌ Error al resetear datos:', error)
    if (error instanceof Error) {
      console.error('  - Mensaje:', error.message)
      console.error('  - Stack:', error.stack)
    }
    throw error
  }
}
