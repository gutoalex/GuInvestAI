import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, DollarSign, Briefcase, PieChart, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { getAssets, getPortfolioSummary, getTotalDividends, getMonthlyDividends } from '../services/dataService'
import { formatCurrency, formatPercent, getColor } from '../utils/helpers'

ChartJS.register(ArcElement, Tooltip, Legend)

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [assets, setAssets] = useState([])
  const [totalDividends, setTotalDividends] = useState(0)

  useEffect(() => {
    setSummary(getPortfolioSummary())
    setAssets(getAssets())
    setTotalDividends(getTotalDividends())
  }, [])

  const composicaoData = summary?.composicao ? {
    labels: Object.keys(summary.composicao),
    datasets: [{
      data: Object.values(summary.composicao),
      backgroundColor: Object.keys(summary.composicao).map((_, i) => getColor(i)),
      borderWidth: 0,
    }]
  } : null

  const monthlyDiv = getMonthlyDividends()
  const months = Object.keys(monthlyDiv).sort().slice(-6)
  const avgMonthly = months.length > 0 
    ? months.reduce((sum, m) => sum + monthlyDiv[m], 0) / months.length 
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Visão geral dos seus investimentos</p>
      </div>

      {/* Cards Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Patrimônio</span>
            <TrendingUp size={18} className="text-primary-500" />
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(summary?.totalPatrimonio)}
          </p>
          <div className={`flex items-center gap-1 text-xs mt-1 ${summary?.lucroPct >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {summary?.lucroPct >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {formatPercent(summary?.lucroPct)}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Dividendos Recebidos</span>
            <DollarSign size={18} className="text-green-500" />
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(totalDividends)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Média mensal: {formatCurrency(avgMonthly)}
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Ativos</span>
            <Briefcase size={18} className="text-purple-500" />
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {summary?.totalAtivos || 0}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            na carteira
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Lucro/Prejuízo</span>
            <PieChart size={18} className="text-amber-500" />
          </div>
          <p className={`text-xl font-bold ${summary?.lucro >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {formatCurrency(summary?.lucro)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Total investido: {formatCurrency(summary?.totalInvestido)}
          </p>
        </div>
      </div>

      {/* Grid com Composição e Ativos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Composição da carteira */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Composição da Carteira</h2>
          {composicaoData && composicaoData.labels.length > 0 ? (
            <div className="flex justify-center">
              <div className="w-56 h-56">
                <Doughnut
                  data={composicaoData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                      legend: { position: 'bottom', labels: { padding: 16 } }
                    },
                    cutout: '65%',
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Briefcase size={40} className="mx-auto mb-2 opacity-50" />
              <p>Nenhum ativo cadastrado</p>
              <Link to="/carteira" className="text-primary-600 text-sm mt-2 inline-block hover:underline">
                Adicionar primeiro ativo →
              </Link>
            </div>
          )}
        </div>

        {/* Lista de ativos */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Meus Ativos</h2>
            <Link to="/carteira" className="text-sm text-primary-600 hover:underline">Ver todos</Link>
          </div>
          {assets.length > 0 ? (
            <div className="space-y-3">
              {assets.slice(0, 6).map(asset => {
                const valor = asset.quantidade * (asset.precoAtual || asset.precoMedio)
                const lucro = ((asset.precoAtual || asset.precoMedio) - asset.precoMedio) / asset.precoMedio * 100
                return (
                  <div key={asset.ticker} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-dark-border last:border-0">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{asset.ticker}</p>
                      <p className="text-xs text-gray-500">{asset.tipo} · {asset.quantidade} cotas</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{formatCurrency(valor)}</p>
                      <p className={`text-xs ${lucro >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {lucro >= 0 ? '+' : ''}{lucro.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p>Nenhum ativo na carteira</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link to="/carteira" className="btn-secondary text-center text-sm">+ Adicionar Ativo</Link>
          <Link to="/ia" className="btn-secondary text-center text-sm">🤖 Chat com IA</Link>
          <Link to="/imagem" className="btn-secondary text-center text-sm">📷 Analisar Extrato</Link>
          <Link to="/simulador" className="btn-secondary text-center text-sm">🧮 Simulador</Link>
        </div>
      </div>
    </div>
  )
}
