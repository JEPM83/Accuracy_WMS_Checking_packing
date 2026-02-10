import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import type { IncidentSummary } from '../../../types'

interface IncidentTypeChartProps {
  summary: IncidentSummary[]
}

const COLORS = {
  TRUEQUE: '#ef4444',
  SOBRANTE: '#f59e0b',
  FALTANTE: '#ec4899',
  DIF_PESO: '#8b5cf6',
}

const LABELS = {
  TRUEQUE: 'Trueques',
  SOBRANTE: 'Sobrantes',
  FALTANTE: 'Faltantes',
  DIF_PESO: 'Dif. Peso',
}

export default function IncidentTypeChart({ summary }: IncidentTypeChartProps) {
  const data = summary.map((item) => ({
    name: LABELS[item.tipo],
    value: item.count,
    tipo: item.tipo,
  }))

  const totalIncidents = summary.reduce((sum, item) => sum + item.count, 0)

  if (totalIncidents === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No hay incidencias registradas</p>
      </div>
    )
  }

  const ICONS = {
    TRUEQUE: '🔄',
    SOBRANTE: '📦',
    FALTANTE: '❌',
    DIF_PESO: '⚖️',
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={100}
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            fill="#8884d8"
            dataKey="value"
            paddingAngle={3}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.tipo]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-6">
        {summary.map((item) => (
          <div
            key={item.tipo}
            className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 border-l-4 hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
            style={{ borderColor: COLORS[item.tipo] }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{ICONS[item.tipo]}</span>
              <p className="text-xs text-gray-600 font-outfit font-semibold">{LABELS[item.tipo]}</p>
            </div>
            <p className="text-3xl font-bold text-gray-900 font-outfit mb-1">{item.count}</p>
            <p className="text-xs text-gray-500 font-outfit">
              {item.ordersAffected} pedido(s)
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
