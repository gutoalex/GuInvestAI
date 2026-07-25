import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, DollarSign, Briefcase, PieChart, ArrowUpRight, ArrowDownRight, Lightbulb } from 'lucide-react'
import { Doughnut, Bar } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'
import { getAssets, getPortfolioSummary, getTotalDividends, getMonthlyDividends } from '../services/dataService'
import { fetchInsightsFromSheets, isSheetsConfigured } from '../services/sheetsService'
import { formatCurrency, formatPercent, getColor } from '../utils/helpers'

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend)

// Mapeamento de FIIs conhecidos por segmento
const FII_SEGMENTS = {
  // Papel (CRI, crédito imobiliário)
  'CPTS11': 'Papel', 'KNCR11': 'Papel', 'KNIP11': 'Papel', 'HGCR11': 'Papel',
  'IRDM11': 'Papel', 'RECR11': 'Papel', 'VGIP11': 'Papel', 'RBRR11': 'Papel',
  'DEVA11': 'Papel', 'PLCR11': 'Papel', 'VCJR11': 'Papel', 'BTCI11': 'Papel',
  'MCCI11': 'Papel', 'RZAK11': 'Papel', 'AFHI11': 'Papel',
  // Tijolo (shoppings, lajes, galpões, logística)
  'XPML11': 'Tijolo', 'GGRC11': 'Tijolo', 'HGLG11': 'Tijolo', 'BTLG11': 'Tijolo',
  'VISC11': 'Tijolo', 'XPLG11': 'Tijolo', 'HGBS11': 'Tijolo', 'VILG11': 'Tijolo',
  'BRCO11': 'Tijolo', 'RBRP11': 'Tijolo', 'PVBI11': 'Tijolo', 'JSRE11': 'Tijolo',
  'KNRI11': 'Tijolo', 'BRCR11': 'Tijolo', 'HGRE11': 'Tijolo', 'MALL11': 'Tijolo',
  'HSML11': 'Tijolo', 'GARE11': 'Tijolo', 'TRXF11': 'Tijolo', 'LVBI11': 'Tijolo',
  // Híbrido
  'MXRF11': 'Híbrido', 'HFOF11': 'Híbrido', 'BCFF11': 'Híbrido', 'RBRF11': 'Híbrido',
  'XPSF11': 'Híbrido', 'KFOF11': 'Híbrido', 'MGFF11': 'Híbrido',
}

function getFIISegment(asset) {
  // Primeiro tenta o mapeamento conhecido
  if (FII_SEGMENTS[asset.ticker]) return FII_SEGMENTS[asset.ticker]
  // Depois usa o campo setor se preenchido
  if (asset.setor) {
    const s = asset.setor.toLowerCase()
    if (s.includes('papel') || s.includes('cri') || s.includes('crédito')) return 'Papel'
    if (s.includes('tijolo') || s.includes('logist') || s.includes('shopping') || s.includes('laje') || s.includes('galpão')) return 'Tijolo'
    if (s.includes('híbrid') || s.includes('fof') || s.includes('fund')) return 'Híbrido'
  }
  return 'Outro'
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [assets, setAssets] = useState([])
  const [totalDividends, setTotalDividends] = useState(0)
  const [lastInsights, setLastInsights] = useState([])

  useEffect(() => {
    setSummary(getPortfolioSummary())
    setAssets(getAssets())
    setTotalDividends(getTotalDividends())
    loadLastInsights()
  }, [])

  async function loadLastInsights() {
    if (!isSheetsConfigured()) return
    try {
      const all = await fetchInsightsFromSheets()
      if (all && all.length > 0) {
        // Pega os últimos 3 insights
        const sorted = all.sort((a, b) => new Date(b.createdAt || b.data) - new Date(a.createdAt || a.data))
        setLastInsights(sorted.slice(0, 3))
      }
    } catch {
      // Silencioso
    }
  }

  // Composição por tipo de ativo (FII, Ação, etc)
  const composicaoData = summary?.composicao ? {
    labels: Object.keys(summary.composicao),
    datasets: [{
      data: Object.values(summary.composicao),
      backgroundColor: Object.keys(summary.composicao).map((_, i) => getColor(i)),
      borderWidth: 0,
    }]
  } : null

  // Composição por segmento FII (Papel, Tijolo, Híbrido)
  const fiiAssets = assets.filter(a => a.tipo === 'FII')
  const segmentComposition = {}
  fiiAssets.forEach(a => {
    const segment = getFIISegment(a)
    const valor = a.quantidade * (a.precoAtual || a.precoMedio)
    if (!segmentComposition[segment]) segmentComposition[segment] = 0
    segmentComposition[segment] += valor
  })

  const segmentColors = {
    'Papel': '#3b82f6',
    'Tijolo': '#f59e0b',
    'Híbrido': '#8b5cf6',
    'Outro': '#6b7280',
  }

  const segmentData = Object.keys(segmentComposition).length > 0 ? {
    labels: Object.keys(segmentComposition),
    datasets: [{
      data: Object.values(segmentComposition),
      backgroundColor: Object.keys(segmentComposition).map(s => segmentColors[s] || '#6b7280'),
      borderWidth: 0,
    }]
  } : null

  const monthlyDiv = getMonthlyDividends()
  const months = Object.keys(monthlyDiv).sort().slice(-6)
  const avgMonthly = months.length > 0
    ? months.reduce((sum, m) => sum + monthlyDiv[m], 0) / months.length
    : 0

  // Calcula percentuais por segmento
  const totalFII = Object.values(segmentComposition).reduce((s, v) => s + v, 0)
  const segmentPcts = {}
  Object.entries(segmentComposition).forEach(([seg, val]) => {
    segmentPcts[seg] = totalFII > 0 ? ((val / totalFII) * 100).toFixed(1) : 0
  })

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

      {/* Grid com Composições */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Composição por tipo */}
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

        {/* Composição por segmento FII */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Segmento FII</h2>
          {segmentData && segmentData.labels.length > 0 ? (
            <div>
              <div className="flex justify-center mb-4">
                <div className="w-48 h-48">
                  <Doughnut
                    data={segmentData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: true,
                      plugins: {
                        legend: { display: false }
                      },
                      cutout: '65%',
                    }}
                  />
                </div>
              </div>
              {/* Legenda com percentuais */}
              <div className="space-y-2">
                {Object.entries(segmentComposition).map(([seg, val]) => (
                  <div key={seg} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: segmentColors[seg] || '#6b7280' }} />
                      <span className="text-gray-700 dark:text-gray-300">{seg}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 text-xs">{formatCurrency(val)}</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{segmentPcts[seg]}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <PieChart size={40} className="mx-auto mb-2 opacity-50" />
              <p>Nenhum FII na carteira</p>
            </div>
          )}
        </div>
      </div>

      {/* Grid com Ativos e Últimos Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                const segment = asset.tipo === 'FII' ? getFIISegment(asset) : ''
                return (
                  <div key={asset.ticker} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-dark-border last:border-0">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{asset.ticker}</p>
                      <p className="text-xs text-gray-500">
                        {asset.tipo}{segment ? ` · ${segment}` : ''} · {asset.quantidade} cotas
                      </p>
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

        {/* Últimos Insights */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Últimos Insights</h2>
            <Link to="/insights" className="text-sm text-primary-600 hover:underline">Ver todos</Link>
          </div>
          {lastInsights.length > 0 ? (
            <div className="space-y-3">
              {lastInsights.map((insight, i) => (
                <div key={insight.id || i} className="flex items-start gap-3 py-2 border-b border-gray-50 dark:border-dark-border last:border-0">
                  <Lightbulb size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-800 dark:text-dark-text">{insight.conteudo}</p>
                    <p className="text-xs text-gray-400 mt-1">{insight.tipo} · {insight.data}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Lightbulb size={40} className="mx-auto mb-2 opacity-50" />
              <p>Nenhum insight ainda</p>
              <Link to="/ia" className="text-primary-600 text-sm mt-2 inline-block hover:underline">
                Analisar carteira com IA →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Gráfico Dividendos Mensais */}
      {months.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Dividendos Mensais</h2>
            <Link to="/dividendos" className="text-sm text-primary-600 hover:underline">Ver detalhes</Link>
          </div>
          <div className="h-48">
            <Bar
              data={{
                labels: months.map(m => {
                  const [year, month] = m.split('-')
                  return `${month}/${year.slice(2)}`
                }),
                datasets: [{
                  label: 'R$',
                  data: months.map(m => monthlyDiv[m]),
                  backgroundColor: '#4c6ef5',
                  borderRadius: 6,
                }]
              }}
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
