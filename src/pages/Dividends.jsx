import { useState, useEffect } from 'react'
import { Plus, DollarSign, X, TrendingUp } from 'lucide-react'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { getDividends, addDividend, getTotalDividends, getMonthlyDividends, getAssets } from '../services/dataService'
import { formatCurrency } from '../utils/helpers'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

// Calcula previsão de dividendos por ativo baseado no histórico
function calcPrediction(dividends, assets) {
  const predictions = []

  assets.forEach(asset => {
    const assetDivs = dividends.filter(d => d.ticker === asset.ticker)
    if (assetDivs.length === 0) return

    // Pega os últimos 3 pagamentos desse ativo para fazer a média
    const sorted = [...assetDivs].sort((a, b) => new Date(b.data) - new Date(a.data))
    const recent = sorted.slice(0, 3)
    const avgPerPayment = recent.reduce((s, d) => s + (d.valor || 0), 0) / recent.length

    predictions.push({
      ticker: asset.ticker,
      previsao: avgPerPayment,
      baseadoEm: recent.length,
    })
  })

  return predictions
}

function getNextMonthLabel() {
  const now = new Date()
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${monthNames[next.getMonth()]}/${next.getFullYear()}`
}

export default function Dividends() {
  const [dividends, setDividends] = useState([])
  const [total, setTotal] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [assets, setAssets] = useState([])
  const [form, setForm] = useState({
    ticker: '',
    valor: '',
    data: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    setDividends(getDividends())
    setTotal(getTotalDividends())
    setAssets(getAssets())
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.ticker || !form.valor) return

    addDividend({
      ticker: form.ticker,
      valor: parseFloat(form.valor),
      data: form.data,
    })

    setDividends(getDividends())
    setTotal(getTotalDividends())
    setForm({ ticker: '', valor: '', data: new Date().toISOString().split('T')[0] })
    setShowForm(false)
  }

  const monthly = getMonthlyDividends()
  const months = Object.keys(monthly).sort().slice(-12)

  // Previsão
  const predictions = calcPrediction(dividends, assets)
  const totalPrediction = predictions.reduce((s, p) => s + p.previsao, 0)
  const nextMonth = getNextMonthLabel()

  const chartData = {
    labels: months.map(m => {
      const [year, month] = m.split('-')
      return `${month}/${year.slice(2)}`
    }),
    datasets: [{
      label: 'Dividendos (R$)',
      data: months.map(m => monthly[m]),
      backgroundColor: '#4c6ef5',
      borderRadius: 8,
    }]
  }

  const avgMonthly = months.length > 0
    ? months.reduce((sum, m) => sum + monthly[m], 0) / months.length
    : 0

  // Dividendos por ativo
  const divByAsset = {}
  dividends.forEach(d => {
    if (!divByAsset[d.ticker]) divByAsset[d.ticker] = 0
    divByAsset[d.ticker] += d.valor || 0
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dividendos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Controle de proventos</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          Registrar
        </button>
      </div>

      {/* Cards Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Recebido</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(total)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500 dark:text-gray-400">Média Mensal</p>
          <p className="text-2xl font-bold text-primary-600">{formatCurrency(avgMonthly)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500 dark:text-gray-400">Ativos Pagando</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{Object.keys(divByAsset).length}</p>
        </div>
        <div className="card border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">Previsão {nextMonth}</p>
            <TrendingUp size={16} className="text-green-500" />
          </div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPrediction)}</p>
          <p className="text-xs text-gray-400 mt-1">baseado no histórico</p>
        </div>
      </div>

      {/* Previsão Detalhada */}
      {predictions.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Previsão de Proventos — {nextMonth}
          </h2>
          <div className="space-y-2">
            {predictions
              .sort((a, b) => b.previsao - a.previsao)
              .map(p => (
                <div key={p.ticker} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-dark-border last:border-0">
                  <div className="flex items-center gap-2">
                    <DollarSign size={14} className="text-green-500" />
                    <span className="font-medium text-gray-900 dark:text-white text-sm">{p.ticker}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium text-green-600 text-sm">~{formatCurrency(p.previsao)}</span>
                    <span className="text-xs text-gray-400 ml-2">(média de {p.baseadoEm} pag.)</span>
                  </div>
                </div>
              ))
            }
            <div className="flex items-center justify-between pt-3 border-t-2 border-gray-200 dark:border-dark-border">
              <span className="font-semibold text-gray-900 dark:text-white">Total Previsto</span>
              <span className="font-bold text-green-600 text-lg">{formatCurrency(totalPrediction)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="card border-primary-200 dark:border-primary-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Registrar Dividendo</h3>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Ticker</label>
              {assets.length > 0 ? (
                <select
                  className="input-field"
                  value={form.ticker}
                  onChange={e => setForm({ ...form, ticker: e.target.value })}
                  required
                >
                  <option value="">Selecione</option>
                  {assets.map(a => <option key={a.ticker} value={a.ticker}>{a.ticker}</option>)}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Ex: MXRF11"
                  className="input-field"
                  value={form.ticker}
                  onChange={e => setForm({ ...form, ticker: e.target.value.toUpperCase() })}
                  required
                />
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="10.50"
                className="input-field"
                value={form.valor}
                onChange={e => setForm({ ...form, valor: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Data</label>
              <input
                type="date"
                className="input-field"
                value={form.data}
                onChange={e => setForm({ ...form, data: e.target.value })}
              />
            </div>
            <div className="flex items-end">
              <button type="submit" className="btn-primary w-full">Registrar</button>
            </div>
          </form>
        </div>
      )}

      {/* Gráfico */}
      {months.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Dividendos Mensais</h2>
          <div className="h-64">
            <Bar
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
      )}

      {/* Dividendos por Ativo */}
      {Object.keys(divByAsset).length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Por Ativo</h2>
          <div className="space-y-3">
            {Object.entries(divByAsset)
              .sort((a, b) => b[1] - a[1])
              .map(([ticker, valor]) => (
                <div key={ticker} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-dark-border last:border-0">
                  <div className="flex items-center gap-2">
                    <DollarSign size={16} className="text-green-500" />
                    <span className="font-medium text-gray-900 dark:text-white">{ticker}</span>
                  </div>
                  <span className="font-medium text-green-600">{formatCurrency(valor)}</span>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* Histórico */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Histórico</h2>
        {dividends.length > 0 ? (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {[...dividends].reverse().map(d => (
              <div key={d.id} className="flex items-center justify-between py-2 text-sm border-b border-gray-50 dark:border-dark-border last:border-0">
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">{d.ticker}</span>
                  <span className="text-gray-500 ml-2">{d.data}</span>
                </div>
                <span className="font-medium text-green-600">+{formatCurrency(d.valor)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">Nenhum dividendo registrado</p>
        )}
      </div>
    </div>
  )
}
