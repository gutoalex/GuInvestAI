import { useState, useEffect } from 'react'
import { Plane, AlertTriangle, TrendingUp, ShoppingCart, RefreshCw, Clock, Target, ArrowRight, Loader2 } from 'lucide-react'
import { getProactiveAdvice, clearAdviceCache } from '../services/advisorService'
import { isConfigured } from '../services/aiService'
import { formatCurrency } from '../utils/helpers'
import { Link } from 'react-router-dom'

export default function PlanoDeVoo() {
  const [advice, setAdvice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadAdvice()
  }, [])

  async function loadAdvice(forceRefresh = false) {
    if (!isConfigured()) {
      setLoading(false)
      setError('configure-ia')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const result = await getProactiveAdvice(forceRefresh)
      if (result.error) {
        setError(result.error)
        setAdvice(result)
      } else {
        setAdvice(result)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleRefresh() {
    clearAdviceCache()
    loadAdvice(true)
  }

  // Estado: IA não configurada
  if (error === 'configure-ia') {
    return (
      <div className="card border-primary-200 dark:border-primary-800 bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/10 dark:to-dark-card">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
            <Plane size={20} className="text-primary-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Plano de Voo GuInvestAI</h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Configure uma API de IA para receber seu plano de ação personalizado.
        </p>
        <Link to="/configuracoes" className="btn-primary text-sm inline-block">
          Configurar IA
        </Link>
      </div>
    )
  }

  // Estado: Carregando
  if (loading) {
    return (
      <div className="card border-primary-200 dark:border-primary-800 bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/10 dark:to-dark-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
            <Plane size={20} className="text-primary-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Plano de Voo GuInvestAI</h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="animate-spin text-primary-500 mr-3" />
          <span className="text-sm text-gray-500">Analisando sua carteira...</span>
        </div>
      </div>
    )
  }

  // Estado: Erro
  if (error && !advice?.alerta) {
    return (
      <div className="card border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/10 dark:to-dark-card">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
            <Plane size={20} className="text-amber-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Plano de Voo GuInvestAI</h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{error}</p>
        <button onClick={handleRefresh} className="btn-secondary text-sm flex items-center gap-2">
          <RefreshCw size={14} /> Tentar novamente
        </button>
      </div>
    )
  }

  // Estado: Sucesso - mostra o plano
  return (
    <div className="card border-primary-200 dark:border-primary-800 bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/10 dark:to-dark-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
            <Plane size={20} className="text-primary-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Plano de Voo</h2>
            {advice?.fromCache && (
              <span className="text-[10px] text-gray-400">atualizado há pouco</span>
            )}
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border text-gray-400 hover:text-gray-600 transition-all"
          title="Atualizar análise"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Alerta Principal */}
      {advice?.alerta && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl mb-4">
          <AlertTriangle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">{advice.alerta}</p>
        </div>
      )}

      {/* Timeline para Meta */}
      {(advice?.tempo_meta_atual || advice?.tempo_meta_otimizado) && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-100 dark:bg-dark-bg rounded-xl p-3 text-center">
            <Clock size={16} className="mx-auto mb-1 text-gray-400" />
            <p className="text-xs text-gray-500">Ritmo atual</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{advice.tempo_meta_atual || '-'}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
            <Target size={16} className="mx-auto mb-1 text-green-600" />
            <p className="text-xs text-green-700 dark:text-green-300">Otimizado</p>
            <p className="text-sm font-bold text-green-700 dark:text-green-300">{advice.tempo_meta_otimizado || '-'}</p>
          </div>
        </div>
      )}

      {/* Aporte Sugerido */}
      {advice?.aporte_sugerido && (
        <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-3 mb-4">
          <p className="text-xs font-medium text-primary-700 dark:text-primary-300 mb-1">💡 Aporte Inteligente do Mês</p>
          <p className="text-sm text-primary-900 dark:text-primary-100">{advice.aporte_sugerido}</p>
        </div>
      )}

      {/* Sugestões de Compra */}
      {advice?.sugestao_compra && advice.sugestao_compra.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1">
            <ShoppingCart size={12} /> COMPRAR
          </p>
          <div className="space-y-2">
            {advice.sugestao_compra.map((s, i) => (
              <div key={i} className="flex items-center justify-between bg-green-50 dark:bg-green-900/10 rounded-lg px-3 py-2">
                <div>
                  <span className="font-bold text-sm text-gray-900 dark:text-white">{s.ticker}</span>
                  {s.quantidade_sugerida && (
                    <span className="text-xs text-gray-500 ml-2">{s.quantidade_sugerida} cotas</span>
                  )}
                </div>
                <span className="text-xs text-green-700 dark:text-green-300 max-w-[50%] text-right">{s.motivo}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sugestões de Venda */}
      {advice?.sugestao_venda && advice.sugestao_venda.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1">
            <TrendingUp size={12} /> CONSIDERAR VENDER
          </p>
          <div className="space-y-2">
            {advice.sugestao_venda.map((s, i) => (
              <div key={i} className="flex items-center justify-between bg-red-50 dark:bg-red-900/10 rounded-lg px-3 py-2">
                <span className="font-bold text-sm text-gray-900 dark:text-white">{s.ticker}</span>
                <span className="text-xs text-red-700 dark:text-red-300 max-w-[60%] text-right">{s.motivo}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Justificativa */}
      {advice?.justificativa && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 italic">
          {advice.justificativa}
        </p>
      )}

      {/* Próximos Passos */}
      {advice?.proximos_passos && advice.proximos_passos.length > 0 && (
        <div className="border-t border-gray-100 dark:border-dark-border pt-3">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Próximos passos:</p>
          <div className="space-y-1">
            {advice.proximos_passos.map((passo, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                <ArrowRight size={10} className="mt-1 text-primary-500 flex-shrink-0" />
                <span>{passo}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fonte dos dados */}
      {advice?.dataSource && (
        <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-3 text-right">
          Dados: {advice.dataSource} · Não é recomendação oficial
        </p>
      )}
    </div>
  )
}
