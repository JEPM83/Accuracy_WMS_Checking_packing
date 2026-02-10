import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface GlobalDonutChartProps {
  totalChecked: number
  totalPicked: number
}

const COLORS = {
  checked: '#2578b5', // accuracy-medium
  pending: '#e5e7eb', // gray light
}

export default function GlobalDonutChart({
  totalChecked,
  totalPicked,
}: GlobalDonutChartProps) {
  const percent = totalPicked > 0 ? (totalChecked / totalPicked) * 100 : 0
  const pending = totalPicked - totalChecked

  const data = [
    { name: 'Chequeado', value: totalChecked },
    { name: 'Pendiente', value: pending },
  ]

  return (
    <div className="text-center">
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            fill="#8884d8"
            dataKey="value"
            paddingAngle={2}
          >
            <Cell fill={COLORS.checked} />
            <Cell fill={COLORS.pending} />
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-4">
        <div className="bg-gradient-to-r from-accuracy-light/20 to-accuracy-medium/10 rounded-xl p-4 mb-4">
          <p className="text-4xl md:text-5xl font-bold text-accuracy-navy font-outfit">{percent.toFixed(1)}%</p>
          <p className="text-sm text-accuracy-gray mt-1 font-outfit font-light">Completado</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-accuracy-medium/10 to-accuracy-light/5 rounded-lg p-3 border border-accuracy-light/30 hover:shadow-md transition">
            <p className="text-xs text-accuracy-medium font-outfit font-semibold">✅ Chequeado</p>
            <p className="text-2xl font-bold text-accuracy-navy font-outfit mt-1">{totalChecked}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:shadow-md transition">
            <p className="text-xs text-gray-600 font-outfit font-semibold">⏳ Pendiente</p>
            <p className="text-2xl font-bold text-gray-700 font-outfit mt-1">{pending}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
