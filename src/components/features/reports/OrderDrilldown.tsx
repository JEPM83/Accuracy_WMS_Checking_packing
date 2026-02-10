import type { OrderWithDetails } from '../../../types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface OrderDrilldownProps {
  order: OrderWithDetails
}

export default function OrderDrilldown({ order }: OrderDrilldownProps) {
  // Datos para el gráfico de barras por línea
  const lineData = order.lines.map((line) => ({
    sku: line.skuId,
    Picado: line.pickedQty,
    Chequeado: line.checkedQty,
  }))

  // Datos para heatmap de etiquetas (simplificado como tabla)
  const labelData = order.lines.reduce((acc: any[], line) => {
    // Este es un placeholder - en una implementación real,
    // necesitarías obtener los scans por etiqueta
    return acc
  }, [])

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-4">
          Progreso por Línea - {order.orderId}
        </h4>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={lineData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="sku" type="category" width={100} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Picado" fill="#6b7280" />
            <Bar dataKey="Chequeado" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-4">Detalle por Línea</h4>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">SKU</th>
                <th className="px-4 py-2 text-left">Descripción</th>
                <th className="px-4 py-2 text-right">Picado</th>
                <th className="px-4 py-2 text-right">Chequeado</th>
                <th className="px-4 py-2 text-right">Pendiente</th>
                <th className="px-4 py-2 text-right">%</th>
              </tr>
            </thead>
            <tbody>
              {order.lines.map((line) => {
                const percent = line.pickedQty > 0 ? (line.checkedQty / line.pickedQty) * 100 : 0

                return (
                  <tr key={line.lineId} className="border-t">
                    <td className="px-4 py-2 font-medium">{line.skuId}</td>
                    <td className="px-4 py-2 text-gray-600">{line.sku.description}</td>
                    <td className="px-4 py-2 text-right">{line.pickedQty}</td>
                    <td className="px-4 py-2 text-right font-medium text-green-600">
                      {line.checkedQty}
                    </td>
                    <td className="px-4 py-2 text-right">{line.pendingQty}</td>
                    <td className="px-4 py-2 text-right">
                      <span
                        className={`font-medium ${
                          percent === 100 ? 'text-green-600' : 'text-gray-900'
                        }`}
                      >
                        {percent.toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
