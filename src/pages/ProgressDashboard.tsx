import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getOrders } from '../services/orderService'
import { db } from '../services/db'
import type { OrderWithDetails, Client } from '../types'
import Select from '../components/common/Select'
import Input from '../components/common/Input'
import Button from '../components/common/Button'
import Spinner from '../components/common/Spinner'
import GlobalDonutChart from '../components/features/reports/GlobalDonutChart'
import OrderProgressList from '../components/features/reports/OrderProgressList'
import OrderDrilldown from '../components/features/reports/OrderDrilldown'

export default function ProgressDashboard() {
  const { session } = useAuth()
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>()

  // Filtros
  const [clientId, setClientId] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  useEffect(() => {
    loadClients()
    loadData()
  }, [session])

  const loadClients = async () => {
    if (!session) return

    try {
      const allClients = await db.clients.toArray()
      const allowedClients = allClients.filter((client) =>
        session.allowedClients.includes(client.clientId)
      )
      setClients(allowedClients)
    } catch (error) {
      console.error('Error cargando clientes:', error)
    }
  }

  const loadData = async () => {
    if (!session) return

    try {
      setLoading(true)

      const filters = {
        clientId: clientId || undefined,
        fechaDesde: fechaDesde || undefined,
        fechaHasta: fechaHasta || undefined,
      }

      const ordersData = await getOrders(session.sociedad, session.allowedClients, filters)
      setOrders(ordersData)

      // Seleccionar primera orden automáticamente
      if (ordersData.length > 0 && !selectedOrderId) {
        setSelectedOrderId(ordersData[0].orderId)
      }
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClearFilters = () => {
    setClientId('')
    setFechaDesde('')
    setFechaHasta('')
  }

  const clientOptions = [
    { value: '', label: 'Todos los clientes' },
    ...clients.map((client) => ({
      value: client.clientId,
      label: client.clientName,
    })),
  ]

  // Calcular totales globales
  const totalPicked = orders.reduce((sum, order) => sum + order.totalPicked, 0)
  const totalChecked = orders.reduce((sum, order) => sum + order.totalChecked, 0)

  const selectedOrder = orders.find((o) => o.orderId === selectedOrderId)

  if (!session) return null

  return (
    <div className="space-y-4">
      {/* Header con Métricas */}
      <div className="bg-gradient-to-r from-accuracy-medium to-accuracy-navy rounded-2xl shadow-2xl border-2 border-accuracy-medium p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white font-outfit flex items-center gap-3">
              <span className="text-3xl">📊</span>
              Dashboard de Avance
            </h2>
            <p className="text-accuracy-light text-sm md:text-base mt-1 font-outfit font-light">
              Seguimiento en tiempo real de operaciones de checking
            </p>
          </div>
        </div>

        {/* Métricas Rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">📦</span>
              <p className="text-xs text-accuracy-light font-outfit">Pedidos</p>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-white font-outfit">{orders.length}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">✅</span>
              <p className="text-xs text-accuracy-light font-outfit">Chequeado</p>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-white font-outfit">{totalChecked}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">⏳</span>
              <p className="text-xs text-accuracy-light font-outfit">Pendiente</p>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-white font-outfit">{totalPicked - totalChecked}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">📈</span>
              <p className="text-xs text-accuracy-light font-outfit">Progreso</p>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-white font-outfit">
              {totalPicked > 0 ? ((totalChecked / totalPicked) * 100).toFixed(0) : 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-gradient-to-br from-white to-accuracy-light/10 rounded-xl shadow-lg border-2 border-accuracy-light/30 p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🔍</span>
          <h3 className="text-base font-bold text-accuracy-navy font-outfit">Filtros de Búsqueda</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Select
            label="Cliente"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            options={clientOptions}
          />

          <Input
            label="Fecha Desde"
            type="date"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
          />

          <Input
            label="Fecha Hasta"
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={loadData}
            size="sm"
            className="bg-accuracy-medium hover:bg-accuracy-navy text-white font-outfit"
          >
            🔎 Aplicar Filtros
          </Button>
          <Button onClick={handleClearFilters} variant="secondary" size="sm">
            🗑️ Limpiar
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Columna izquierda: Donut global */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-white to-accuracy-light/10 rounded-xl shadow-lg border-2 border-accuracy-light/30 p-6 sticky top-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🎯</span>
                <h3 className="text-lg font-bold text-accuracy-navy font-outfit">Progreso Global</h3>
              </div>
              <GlobalDonutChart totalChecked={totalChecked} totalPicked={totalPicked} />
            </div>
          </div>

          {/* Columna derecha: Lista y drill-down */}
          <div className="lg:col-span-2 space-y-4">
            {/* Lista de pedidos */}
            <div className="bg-gradient-to-br from-white to-accuracy-light/10 rounded-xl shadow-lg border-2 border-accuracy-light/30 p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">📋</span>
                <h3 className="text-lg font-bold text-accuracy-navy font-outfit">Pedidos</h3>
              </div>

              {orders.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No hay pedidos</p>
              ) : (
                <OrderProgressList
                  orders={orders}
                  onSelectOrder={setSelectedOrderId}
                  selectedOrderId={selectedOrderId}
                />
              )}
            </div>

            {/* Drill-down del pedido seleccionado */}
            {selectedOrder && (
              <div className="bg-gradient-to-br from-white to-accuracy-light/10 rounded-xl shadow-lg border-2 border-accuracy-light/30 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">🔍</span>
                  <h3 className="text-lg font-bold text-accuracy-navy font-outfit">Detalle del Pedido</h3>
                </div>
                <OrderDrilldown order={selectedOrder} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
