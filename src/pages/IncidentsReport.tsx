import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { db } from '../services/db'
import {
  getIncidentsSummary,
  exportIncidentsToCSV,
  downloadCSV,
} from '../services/incidentService'
import type { Incident, IncidentSummary, IncidentType, Client } from '../types'
import Button from '../components/common/Button'
import Select from '../components/common/Select'
import Input from '../components/common/Input'
import Spinner from '../components/common/Spinner'
import IncidentTypeChart from '../components/features/reports/IncidentTypeChart'
import IncidentsTable from '../components/features/reports/IncidentsTable'
import toast from 'react-hot-toast'

export default function IncidentsReport() {
  const { session } = useAuth()
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<IncidentSummary[]>([])
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [clients, setClients] = useState<Client[]>([])

  // Filtros
  const [clientId, setClientId] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [tipo, setTipo] = useState<IncidentType | ''>('')

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
        sociedad: session.sociedad,
        clientId: clientId || undefined,
        fechaDesde: fechaDesde || undefined,
        fechaHasta: fechaHasta || undefined,
        tipo: tipo || undefined,
      }

      const summaryData = await getIncidentsSummary(filters)
      setSummary(summaryData)

      // Cargar incidencias filtradas
      let allIncidents = await db.incidents.toArray()

      // Filtrar por sociedad y clientes permitidos
      const allowedOrders = await db.orders
        .where('sociedad')
        .equals(session.sociedad)
        .and((order) => session.allowedClients.includes(order.clientId))
        .toArray()

      const orderIds = new Set(allowedOrders.map((o) => o.orderId))
      allIncidents = allIncidents.filter((i) => orderIds.has(i.orderId))

      // Aplicar filtros adicionales
      if (clientId) {
        const clientOrders = allowedOrders.filter((o) => o.clientId === clientId)
        const clientOrderIds = new Set(clientOrders.map((o) => o.orderId))
        allIncidents = allIncidents.filter((i) => clientOrderIds.has(i.orderId))
      }

      if (fechaDesde) {
        allIncidents = allIncidents.filter((i) => i.timestamp >= fechaDesde)
      }

      if (fechaHasta) {
        allIncidents = allIncidents.filter((i) => i.timestamp <= fechaHasta)
      }

      if (tipo) {
        allIncidents = allIncidents.filter((i) => i.tipo === tipo)
      }

      // Ordenar por fecha descendente
      allIncidents.sort((a, b) => b.timestamp.localeCompare(a.timestamp))

      setIncidents(allIncidents)
    } catch (error) {
      console.error('Error cargando incidencias:', error)
      toast.error('Error al cargar incidencias')
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = async () => {
    try {
      const csv = await exportIncidentsToCSV(incidents)
      const filename = `incidencias_${new Date().toISOString().split('T')[0]}.csv`
      downloadCSV(csv, filename)
      toast.success('CSV exportado correctamente')
    } catch (error) {
      console.error('Error exportando CSV:', error)
      toast.error('Error al exportar CSV')
    }
  }

  const handleClearFilters = () => {
    setClientId('')
    setFechaDesde('')
    setFechaHasta('')
    setTipo('')
  }

  const clientOptions = [
    { value: '', label: 'Todos los clientes' },
    ...clients.map((client) => ({
      value: client.clientId,
      label: client.clientName,
    })),
  ]

  const tipoOptions = [
    { value: '', label: 'Todos los tipos' },
    { value: 'TRUEQUE', label: 'Trueque' },
    { value: 'SOBRANTE', label: 'Sobrante' },
    { value: 'FALTANTE', label: 'Faltante' },
    { value: 'DIF_PESO', label: 'Diferencia de Peso' },
  ]

  if (!session) return null

  // Calcular métricas por tipo
  const truequesCount = summary.find((s) => s.tipo === 'TRUEQUE')?.count || 0
  const sobrantesCount = summary.find((s) => s.tipo === 'SOBRANTE')?.count || 0
  const faltantesCount = summary.find((s) => s.tipo === 'FALTANTE')?.count || 0
  const difPesoCount = summary.find((s) => s.tipo === 'DIF_PESO')?.count || 0

  return (
    <div className="space-y-4">
      {/* Header con Métricas */}
      <div className="bg-gradient-to-r from-accuracy-medium to-accuracy-navy rounded-2xl shadow-2xl border-2 border-accuracy-medium p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex-1">
            <h2 className="text-2xl md:text-3xl font-bold text-white font-outfit flex items-center gap-3">
              <span className="text-3xl">⚠️</span>
              Reporte de Incidencias
            </h2>
            <p className="text-accuracy-light text-sm md:text-base mt-1 font-outfit font-light">
              Monitoreo y análisis de incidencias operativas
            </p>
          </div>
          <Button
            onClick={handleExportCSV}
            disabled={incidents.length === 0}
            className="bg-white text-accuracy-navy hover:bg-accuracy-light font-outfit font-semibold px-6"
          >
            📥 Exportar CSV
          </Button>
        </div>

        {/* Métricas por Tipo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🔄</span>
              <p className="text-xs text-accuracy-light font-outfit">Trueques</p>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-white font-outfit">{truequesCount}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">📦</span>
              <p className="text-xs text-accuracy-light font-outfit">Sobrantes</p>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-white font-outfit">{sobrantesCount}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">❌</span>
              <p className="text-xs text-accuracy-light font-outfit">Faltantes</p>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-white font-outfit">{faltantesCount}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">⚖️</span>
              <p className="text-xs text-accuracy-light font-outfit">Dif. Peso</p>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-white font-outfit">{difPesoCount}</p>
          </div>
        </div>

        {/* Total de incidencias */}
        <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
          <p className="text-accuracy-light text-sm font-outfit">
            <span className="font-semibold">Total:</span> {incidents.length} incidencia(s) encontrada(s)
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-gradient-to-br from-white to-accuracy-light/10 rounded-xl shadow-lg border-2 border-accuracy-light/30 p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🔍</span>
          <h3 className="text-base font-bold text-accuracy-navy font-outfit">Filtros de Búsqueda</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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

          <Select
            label="Tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as IncidentType | '')}
            options={tipoOptions}
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
        <>
          {/* Gráfico */}
          <div className="bg-gradient-to-br from-white to-accuracy-light/10 rounded-xl shadow-lg border-2 border-accuracy-light/30 p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">📊</span>
              <h3 className="text-lg font-bold text-accuracy-navy font-outfit">
                Distribución por Tipo
              </h3>
            </div>
            <IncidentTypeChart summary={summary} />
          </div>

          {/* Tabla */}
          <div className="bg-gradient-to-br from-white to-accuracy-light/10 rounded-xl shadow-lg border-2 border-accuracy-light/30 p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">📋</span>
              <h3 className="text-lg font-bold text-accuracy-navy font-outfit">
                Detalle de Incidencias
              </h3>
            </div>
            <IncidentsTable incidents={incidents} />
          </div>
        </>
      )}
    </div>
  )
}
