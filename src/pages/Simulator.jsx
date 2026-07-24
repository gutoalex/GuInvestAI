import { useState } from 'react'
import { Calculator } from 'lucide-react'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import { formatCurrency } from '../utils/helpers'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

export default function Simulator() {
  const [form, setForm] = useState({
    aporteMensal: '1000',
    periodo: '10',
    taxaAnual: '10',
    patrimonioInicial: '0',
  })
  const [result, setResult] = useState(null)

  const simulate = () => {
    const aporte = parseFloat(form.aporteMensal) || 0
    const anos = parseInt(form.periodo) || 0
    const taxa = (parseFloat(form.taxaAnual) || 0) / 100
    const inicial = parseFloat(form.patrimonioInicial) || 0
    const taxaMensal = Math.pow(1 + taxa, 1 / 12) - 1
    const meses = anos * 12

    let patrimonio = inicial
    const evolucao = [patrimonio]
    let totalAportes = inicial

    for (let i = 1; i <= meses; i++) {
      patrimonio = patrimonio * (1 + taxaMensal) + aporte
      totalAportes += aporte
      if (i % 12 === 0) evolucao.push(patrimonio)
    }

    const rendimento = patrimonio - totalAportes
    const dividendosMensais = patrimonio * 0.007 // estimativa 0.7% ao mês

    setResult({
      patrimonioFinal: patrimonio,
      totalAportes,
      rendimento,
      dividendosMensais,
      evolucao,
    })
  }

  const chartData = result ? {
    labels: result.evolucao.map((_, i) => `Ano ${i}`),
    datasets: [{
      label: 'Patrimônio',
      data: result.evolucao,
      borderColor: '#4c6ef5',
      backgroundColor: 'rgba(76, 110, 245, 0.1)',
      fill: true,
      tension: 0.4,
    }]
  } : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🧮 Simulador</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Projete o crescimento do seu patrimônio</p>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Parâmetros</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Patrimônio Inicial (R$)</label>
            <input
              type="number"
              className="input-field"
              value={form.patrimonioInicial}
              onChange={e => setForm({ ...form, patrimonioInicial: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Aporte Mensal (R$)</label>
            <input
              type="number"
              className="input-field"
              value={form.aporteMensal}
              onChange={e => setForm({ ...form, aporteMensal: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Período (anos)</label>
            <input
              type="number"
              className="input-field"
              value={form.periodo}
              onChange={e => setForm({ ...form, periodo: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Rentabilidade Anual (%)</label>
            <input
              type="number"
              step="0.1"
              className="input-field"
              value={form.taxaAnual}
              onChange={e => setForm({ ...form, taxaAnual: e.target.value })}
            />
          </div>
        </div>
        <button onClick={simulate} className="btn-primary mt-4 flex items-center gap-2">
          <Calculator size={16} /> Simular
        </button>
      </div>

      {result && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card">
              <p className="text-sm text-gray-500 dark:text-gray-400">Patrimônio Final</p>
              <p className="text-xl font-bold text-primary-600">{formatCurrency(result.patrimonioFinal)}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Aportado</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(result.totalAportes)}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-500 dark:text-gray-400">Rendimento</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(result.rendimento)}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-500 dark:text-gray-400">Dividendos Estimados/mês</p>
              <p className="text-xl font-bold text-amber-600">{formatCurrency(result.dividendosMensais)}</p>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Evolução Patrimonial</h2>
            <div className="h-64">
              <Line
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                    x: { grid: { display: false } }
                  }
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
