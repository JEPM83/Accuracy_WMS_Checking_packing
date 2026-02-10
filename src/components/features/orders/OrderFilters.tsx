import { useState } from 'react'
import type { Client, OrderStatus } from '../../../types'
import Select from '../../common/Select'
import Input from '../../common/Input'
import Button from '../../common/Button'

interface OrderFiltersProps {
  clients: Client[]
  onFilter: (filters: {
    clientId?: string
    fechaDesde?: string
    fechaHasta?: string
    status?: OrderStatus
  }) => void
}

export default function OrderFilters({ clients, onFilter }: OrderFiltersProps) {
  const [clientId, setClientId] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [status, setStatus] = useState<OrderStatus | ''>('')
  const [isExpanded, setIsExpanded] = useState(true)

  const handleFilter = () => {
    onFilter({
      clientId: clientId || undefined,
      fechaDesde: fechaDesde || undefined,
      fechaHasta: fechaHasta || undefined,
      status: status || undefined,
    })
  }

  const handleClear = () => {
    setClientId('')
    setFechaDesde('')
    setFechaHasta('')
    setStatus('')
    onFilter({})
  }

  // Contar filtros activos
  const activeFiltersCount = [clientId, fechaDesde, fechaHasta, status].filter(Boolean).length

  const clientOptions = [
    { value: '', label: 'Todos los clientes' },
    ...clients.map((client) => ({
      value: client.clientId,
      label: client.clientName,
    })),
  ]

  const statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'RECEP', label: 'RECEP' },
    { value: 'CHK', label: 'CHK' },
    { value: 'CONFIRMADO WMS', label: 'CONFIRMADO WMS' },
  ]

  return (
    <div className="bg-gradient-to-br from-white to-accuracy-light/10 rounded-xl shadow-lg border-2 border-accuracy-light/30 overflow-hidden mb-6">
      {/* Header del Panel */}
      <div className="bg-gradient-to-r from-accuracy-light/20 to-accuracy-medium-light/20 px-4 md:px-6 py-4 border-b-2 border-accuracy-medium/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-accuracy-navy hover:text-accuracy-medium transition-colors"
              title={isExpanded ? 'Ocultar filtros' : 'Mostrar filtros'}
            >
              <svg className="w-5 h-5 transition-transform" style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-accuracy-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <h3 className="text-lg font-bold text-accuracy-navy font-outfit">Filtros de Búsqueda</h3>
            </div>
            {activeFiltersCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-accuracy-medium text-white font-outfit">
                {activeFiltersCount}
              </span>
            )}
          </div>
          {activeFiltersCount > 0 && (
            <button
              onClick={handleClear}
              className="text-sm text-accuracy-medium hover:text-accuracy-navy font-semibold font-outfit flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Limpiar todo
            </button>
          )}
        </div>

        {/* Chips de Filtros Activos */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {clientId && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-white text-accuracy-navy border border-accuracy-medium/30 font-outfit">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {clients.find(c => c.clientId === clientId)?.clientName || clientId}
              </span>
            )}
            {fechaDesde && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-white text-accuracy-navy border border-accuracy-medium/30 font-outfit">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Desde: {fechaDesde}
              </span>
            )}
            {fechaHasta && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-white text-accuracy-navy border border-accuracy-medium/30 font-outfit">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Hasta: {fechaHasta}
              </span>
            )}
            {status && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-white text-accuracy-navy border border-accuracy-medium/30 font-outfit">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {status}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Contenido Colapsable */}
      {isExpanded && (
        <div className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Cliente con icono */}
            <div className="relative">
              <div className="absolute left-3 top-[38px] pointer-events-none">
                <svg className="w-4 h-4 text-accuracy-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <Select
                label="Cliente"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                options={clientOptions}
                className="pl-9"
              />
            </div>

            {/* Fecha Desde con icono */}
            <div className="relative">
              <div className="absolute left-3 top-[38px] pointer-events-none">
                <svg className="w-4 h-4 text-accuracy-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <Input
                label="Fecha Desde"
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Fecha Hasta con icono */}
            <div className="relative">
              <div className="absolute left-3 top-[38px] pointer-events-none">
                <svg className="w-4 h-4 text-accuracy-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <Input
                label="Fecha Hasta"
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Estado con icono */}
            <div className="relative">
              <div className="absolute left-3 top-[38px] pointer-events-none">
                <svg className="w-4 h-4 text-accuracy-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <Select
                label="Estado"
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus | '')}
                options={statusOptions}
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleFilter} size="sm" className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Aplicar Filtros
            </Button>
            <Button onClick={handleClear} variant="secondary" size="sm" className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Limpiar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
