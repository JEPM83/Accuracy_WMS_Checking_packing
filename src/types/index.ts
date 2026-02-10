// Enums y Tipos Base
export type Sociedad = 'SBO_OPERACIONES' | 'SBO_AMBAR' | 'SBO_ACCURACY'

export type UserRole = 'ADMIN' | 'SUPERVISOR' | 'OPERARIO'

export type OrderStatus = 'RECEP' | 'CHK' | 'CONFIRMADO WMS' | 'CONFIRMADO DESPACHO'

export type LabelStatus = 'OPEN' | 'CLOSED'

export type IncidentType = 'TRUEQUE' | 'SOBRANTE' | 'FALTANTE' | 'DIF_PESO'

export type UOM = 'EA' | 'PACK6' | 'PACK12' | 'MASTER24' | 'MASTER48' | string

export type TrafficLight = 'green' | 'yellow' | 'red'

// Usuarios
export interface User {
  userId: string
  username: string
  password: string
  role: UserRole
  fullName: string
}

// Asignación Usuario-Cliente
export interface UserClient {
  userId: string
  clientId: string
  sociedad: Sociedad
}

// Clientes
export interface Client {
  clientId: string
  clientName: string
  ruc?: string
  addresses: ClientAddress[]
}

export interface ClientAddress {
  addressId: string
  sociedad: Sociedad
  street: string
  city: string
  postalCode?: string
}

// Pedidos
export interface Order {
  orderId: string
  sociedad: Sociedad
  clientId: string
  status: OrderStatus
  fechaCreacion: string
  fechaModificacion?: string
  usuarioCreacion: string
  usuarioModificacion?: string
  addressId: string
  observaciones?: string
}

// Líneas de Pedido
export interface OrderLine {
  lineId: string
  orderId: string
  skuId: string
  orderedQty: number
  pickedQty: number
  checkedQty: number
  requiresSeries: boolean
  requiresLot: boolean
}

// Catálogo de SKU
export interface SKU {
  skuId: string
  description: string
  eans: Array<string | { ean: string; uom?: string }> // EAN puede ser simple o con UOM asociada
  weightPerEA: number // kg
  requiresSeries: boolean
  requiresLot: boolean
  uomConversions: Record<string, number> // { "EA": 1, "PACK6": 6, "MASTER24": 24 }
}

// Etiquetas/Bultos
export interface Label {
  labelId: string
  orderId: string
  seq: number
  totalSeq?: number // Se congela al cerrar pedido
  status: LabelStatus
  theoreticalWeight?: number // kg
  realWeight?: number // kg
  fechaCreacion: string
  fechaCierre?: string
  usuarioCierre?: string
  requiresReprint: boolean
}

// Scans (Historial de escaneos)
export interface Scan {
  scanId: string
  labelId: string
  orderId: string
  lineId: string
  skuId: string
  ean?: string
  qty: number // Puede ser negativo en repack
  uom: string
  qtyInEA: number // Cantidad en unidad base
  serie?: string
  lote?: string
  timestamp: string
  userId: string
  isRepack: boolean
  repackFrom?: string // labelId origen si es repack
  repackTo?: string // labelId destino si es repack
}

// Incidencias
export interface Incident {
  incidentId: string
  orderId: string
  tipo: IncidentType
  timestamp: string
  userId: string
  authorizedBy?: string // userId de quien autorizó
  skuId?: string
  labelId?: string
  lineId?: string
  qty?: number
  lote?: string
  pesoTeorico?: number
  pesoReal?: number
  comentario?: string
  resolved: boolean
}

// Settings (configuración del usuario)
export interface Settings {
  key: string
  value: string
}

// Interfaces para UI y cálculos
export interface OrderWithDetails extends Order {
  client: Client
  address: ClientAddress
  lines: OrderLineWithDetails[]
  totalPicked: number
  totalChecked: number
  progressPercent: number
  trafficLight: TrafficLight
  hasIncidents: boolean
  incidentCount: number
  totalLabels: number
  openLabels: number
  closedLabels: number
}

export interface OrderLineWithDetails extends OrderLine {
  sku: SKU
  trafficLight: TrafficLight
  pendingQty: number // pickedQty - checkedQty
}

export interface LabelWithDetails extends Label {
  scans: Scan[]
  itemCount: number
  theoreticalWeight: number
  skuSummary: { skuId: string; description: string; qty: number }[]
}

// DTO para flujo de escaneo
export interface ScanInput {
  input: string // EAN o SKU
  orderId: string
  labelId: string
  userId: string
}

export interface ScanResult {
  success: boolean
  message: string
  incident?: Incident
  scan?: Scan
  requiresInput?: {
    type: 'SKU_SELECTION' | 'SERIE' | 'LOTE' | 'QTY_UOM' | 'CONFIRM_SOBRANTE' | 'LINE_SELECTION'
    data?: any
  }
}

// DTO para autorización
export interface AuthorizationRequest {
  action: string
  userId: string
  requiresPassword: boolean
}

export interface AuthorizationResult {
  authorized: boolean
  authorizedBy: string
  message?: string
}

// DTO para repack
export interface RepackRequest {
  fromLabelId: string
  toLabelId: string
  scanIds: string[] // IDs de scans a mover
  userId: string
}

// DTO para reportes
export interface OrderProgress {
  orderId: string
  clientName: string
  totalPicked: number
  totalChecked: number
  percent: number
  trafficLight: TrafficLight
  hasIncidents: boolean
}

export interface IncidentSummary {
  tipo: IncidentType
  count: number
  ordersAffected: number
}

export interface LabelHeatmapData {
  labelId: string
  itemCount: number
  percent: number
}
