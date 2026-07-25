import { useState, useEffect } from 'react'
import { Lightbulb, TrendingUp, AlertTriangle, Target, PieChart, RefreshCw, Trash2 } from 'lucide-react'
import { fetchInsightsFromSheets, isSheetsConfigured } from '../services/sheetsService'
import { formatDate } from '../utils/helpers'
import { Link } from 'react-router-dom'

const TIPO_CONFIG = {
  alocacao: { icon: PieChart, label: 'Alocação', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  alerta: { icon: AlertTriangle, label: 'Alerta', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  sugestao: { icon: Target, label: 'Sugestão', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  ponto_forte: { icon: TrendingUp, label: 'Ponto Forte', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  resumo: { icon: Lightbulb, label: 'Resumo', color: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' },
}

function getInsightConfig(tipo) {
  return TIPO_CONFIG[tipo] || TIPO_CONFIG.resumo
}

export default function Insights() {
  const [insights, setInsights] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filterTipo, setFilterTipo] = useState('todos')

  useEffect(() => {
    loadInsights()
  }, [])

  async function loadInsights() {
    if (!isSheetsConfigured()) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const data = await fetchInsightsFromSheets()
      // Ordena por data mais recente
      const sorted = (data || []).sort((a, b) => {
        const dateA = new Date(a.createdAt || a.data)
        const dateB = new Date(b.createdAt || b.data)
        return dateB - dateA
      })
      setInsights(sorted)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Agrupa insights por data
  function groupByDate(items) {
    const groups = {}
    items.forEach(item => {
      const date = item.data || (item.createdAt ? item.createdAt.split('T')[0] : 'sem-data')
      if (!groups[date]) groups[date] = []
      groups[date].push(item)
    })
    return groups
  }

  const filteredInsights = filterTipo === 'todos'
    ? insights
    : insights.filter(i => i.tipo === filterTipo)

  const grouped = groupByDate(filteredInsights)
  const dates = Object.keys(grouped).sort().reverse()

  if (!isSheetsConfigured()) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">💡 Insights</h1>
        <div className="card text-center py-12">
          <Lightbulb size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Configure o Google Sheets</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Para salvar e visualizar insights, configure a URL do Apps Script nas configurações.
          </p>
          <Link to="/configuracoes" className="btn-primary">
            Ir para Configurações
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">💡 Insights</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Pontos-chave extraídos das suas análises com a IA
          </p>
        </div>
        <button
          onClick={loadInsights}
          disabled={loading}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterTipo('todos')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            filterTipo === 'todos'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-dark-border text-gray-600 dark:text-gray-400 hover:bg-gray-200'
          }`}
        >
          Todos ({insights.length})
        </button>
        {Object.entries(TIPO_CONFIG).map(([key, config]) => {
          const count = insights.filter(i => i.tipo === key).length
          if (count === 0) return null
          return (
            <button
              key={key}
              onClick={() => setFilterTipo(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterTipo === key
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-dark-border text-gray-600 dark:text-gray-400 hover:bg-gray-200'
              }`}
            >
              {config.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="card border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <p className="text-red-700 dark:text-red-300 text-sm">❌ Erro ao carregar insights: {error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="card text-center py-8">
          <RefreshCw size={24} className="mx-auto mb-2 animate-spin text-primary-500" />
          <p className="text-gray-500">Carregando insights...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && insights.length === 0 && !error && (
        <div className="card text-center py-12">
          <Lightbulb size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Nenhum insight ainda</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Vá ao Chat com IA e clique em "Analisar minha carteira" para gerar insights automaticamente.
          </p>
          <Link to="/ia" className="btn-primary">
            🤖 Ir para o Chat
          </Link>
        </div>
      )}

      {/* Timeline de Insights */}
      {!loading && dates.length > 0 && (
        <div className="space-y-6">
          {dates.map(date => (
            <div key={date}>
              {/* Date Header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-3 h-3 rounded-full bg-primary-500" />
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {formatDate(date)}
                </h3>
                <div className="flex-1 h-px bg-gray-200 dark:bg-dark-border" />
              </div>

              {/* Insights do dia */}
              <div className="ml-6 space-y-2">
                {grouped[date].map((insight, idx) => {
                  const config = getInsightConfig(insight.tipo)
                  const Icon = config.icon
                  return (
                    <div
                      key={insight.id || idx}
                      className="card py-3 px-4 flex items-start gap-3"
                    >
                      <div className={`p-1.5 rounded-lg ${config.color} flex-shrink-0`}>
                        <Icon size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.color}`}>
                            {config.label}
                          </span>
                          {insight.categoria && (
                            <span className="text-xs text-gray-400">
                              {insight.categoria}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-800 dark:text-dark-text">
                          {insight.conteudo}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
