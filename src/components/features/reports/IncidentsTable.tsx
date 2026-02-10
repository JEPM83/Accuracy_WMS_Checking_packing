import type { Incident } from '../../../types'
import { formatearFecha, formatearPeso } from '../../../utils/formatters'
import Chip from '../../common/Chip'

interface IncidentsTableProps {
  incidents: Incident[]
}

const TIPO_COLORS = {
  TRUEQUE: 'danger' as const,
  SOBRANTE: 'warning' as const,
  FALTANTE: 'danger' as const,
  DIF_PESO: 'info' as const,
}

export default function IncidentsTable({ incidents }: IncidentsTableProps) {
  if (incidents.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No hay incidencias para mostrar</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gradient-to-r from-accuracy-light/20 to-accuracy-medium-light/20 border-b-2 border-accuracy-medium/30">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-accuracy-navy uppercase font-outfit">
              Fecha/Hora
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-accuracy-navy uppercase font-outfit">
              Pedido
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-accuracy-navy uppercase font-outfit">
              Tipo
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-accuracy-navy uppercase font-outfit">
              SKU
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-accuracy-navy uppercase font-outfit">
              Etiqueta
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-accuracy-navy uppercase font-outfit">
              Cantidad
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-accuracy-navy uppercase font-outfit">
              Usuario
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-accuracy-navy uppercase font-outfit">
              Comentario
            </th>
          </tr>
        </thead>
        <tbody>
          {incidents.map((incident, index) => (
            <tr
              key={incident.incidentId}
              className={`border-b border-accuracy-light/20 hover:bg-accuracy-light/10 transition-colors ${
                index % 2 === 0 ? 'bg-white' : 'bg-accuracy-light/5'
              }`}
            >
              <td className="px-4 py-3 text-sm text-accuracy-navy font-outfit">
                {formatearFecha(incident.timestamp)}
              </td>
              <td className="px-4 py-3 text-sm font-semibold text-accuracy-navy font-outfit">
                {incident.orderId}
              </td>
              <td className="px-4 py-3">
                <Chip variant={TIPO_COLORS[incident.tipo]} size="sm">
                  {incident.tipo}
                </Chip>
              </td>
              <td className="px-4 py-3 text-sm text-accuracy-navy font-outfit">
                {incident.skuId || '-'}
              </td>
              <td className="px-4 py-3 text-sm text-accuracy-medium font-outfit font-semibold">
                {incident.labelId || '-'}
              </td>
              <td className="px-4 py-3 text-sm text-right text-accuracy-navy font-outfit font-semibold">
                {incident.qty !== undefined ? incident.qty : '-'}
                {incident.pesoTeorico && incident.pesoReal && (
                  <div className="text-xs text-accuracy-gray font-outfit">
                    Δ {formatearPeso(Math.abs(incident.pesoReal - incident.pesoTeorico))}
                  </div>
                )}
              </td>
              <td className="px-4 py-3 text-sm text-accuracy-gray font-outfit">
                {incident.userId}
                {incident.authorizedBy && (
                  <div className="text-xs text-green-600 font-outfit font-semibold">✓ {incident.authorizedBy}</div>
                )}
              </td>
              <td className="px-4 py-3 text-sm text-accuracy-gray font-outfit font-light">
                {incident.comentario || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
