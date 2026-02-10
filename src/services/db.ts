import Dexie, { Table } from 'dexie'
import type {
  User,
  UserClient,
  Client,
  Order,
  OrderLine,
  SKU,
  Label,
  Scan,
  Incident,
  Settings,
} from '../types'

export class WMSDatabase extends Dexie {
  users!: Table<User, string>
  userClients!: Table<UserClient, string>
  clients!: Table<Client, string>
  orders!: Table<Order, string>
  orderLines!: Table<OrderLine, string>
  skuCatalog!: Table<SKU, string>
  labels!: Table<Label, string>
  scans!: Table<Scan, string>
  incidents!: Table<Incident, string>
  settings!: Table<Settings, string>

  constructor() {
    super('WMSDatabase')

    // Version 1 - esquema inicial
    this.version(1).stores({
      users: 'userId, username, role',
      userClients: '[userId+clientId+sociedad], userId, clientId, sociedad',
      clients: 'clientId, clientName',
      orders: 'orderId, sociedad, clientId, status, fechaCreacion',
      orderLines: 'lineId, orderId, skuId',
      skuCatalog: 'skuId, *eans',
      labels: 'labelId, orderId, status',
      scans: 'scanId, labelId, orderId, lineId, timestamp, userId, *serie',
      incidents: 'incidentId, orderId, tipo, timestamp, userId',
      settings: 'key',
    })

    // Version 2 - agregar índice [userId+sociedad] a userClients
    this.version(2).stores({
      users: 'userId, username, role',
      userClients: '[userId+clientId+sociedad], [userId+sociedad], userId, clientId, sociedad',
      clients: 'clientId, clientName',
      orders: 'orderId, sociedad, clientId, status, fechaCreacion',
      orderLines: 'lineId, orderId, skuId',
      skuCatalog: 'skuId, *eans',
      labels: 'labelId, orderId, status',
      scans: 'scanId, labelId, orderId, lineId, timestamp, userId, *serie',
      incidents: 'incidentId, orderId, tipo, timestamp, userId',
      settings: 'key',
    })

    // Version 3 - agregar índice [orderId+skuId] a orderLines
    this.version(3).stores({
      users: 'userId, username, role',
      userClients: '[userId+clientId+sociedad], [userId+sociedad], userId, clientId, sociedad',
      clients: 'clientId, clientName',
      orders: 'orderId, sociedad, clientId, status, fechaCreacion',
      orderLines: 'lineId, [orderId+skuId], orderId, skuId',
      skuCatalog: 'skuId, *eans',
      labels: 'labelId, orderId, status',
      scans: 'scanId, labelId, orderId, lineId, timestamp, userId, *serie',
      incidents: 'incidentId, orderId, tipo, timestamp, userId',
      settings: 'key',
    })
  }
}

export const db = new WMSDatabase()
