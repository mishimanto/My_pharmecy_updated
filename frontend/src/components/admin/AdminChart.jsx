import { useEffect, useRef } from 'react'
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  Filler,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  ArcElement,
  PieController,
  Tooltip,
} from 'chart.js'

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  ArcElement,
  PieController,
  Tooltip,
)

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: 'index',
  },
  plugins: {
    legend: {
      labels: {
        boxWidth: 10,
        boxHeight: 10,
        color: '#475569',
        font: { size: 11, weight: 600 },
      },
    },
    tooltip: {
      backgroundColor: '#0f172a',
      borderColor: 'rgba(255,255,255,0.12)',
      borderWidth: 1,
      padding: 10,
      titleFont: { size: 12, weight: 700 },
      bodyFont: { size: 12, weight: 500 },
    },
  },
}

export default function AdminChart({ type, data, options = {}, className = 'h-72' }) {
  const canvasRef = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current) return undefined

    chartRef.current?.destroy()
    chartRef.current = new Chart(canvasRef.current, {
      type,
      data,
      options: {
        ...chartDefaults,
        ...options,
        plugins: {
          ...chartDefaults.plugins,
          ...options.plugins,
        },
      },
    })

    return () => {
      chartRef.current?.destroy()
      chartRef.current = null
    }
  }, [data, options, type])

  return (
    <div className={className}>
      <canvas ref={canvasRef} />
    </div>
  )
}
