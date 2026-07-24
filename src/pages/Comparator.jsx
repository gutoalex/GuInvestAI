import { useState } from 'react'
import { BarChart3, Loader2 } from 'lucide-react'
import { chatWithGemini, isConfigured } from '../services/geminiService'
import { getAssets } from '../services/dataService'
import { Link } from 'react-router-dom'

export default function Comparator() {
  const [asset1, setAsset1] = useState('')
  const [asset2, setAsset2] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const assets = getAssets()

  const handleCompare = async () => {
    if (!asset1 || !asset2) return
    setLoading(true)

    try {
      const prompt = `Compare os ativos ${asset1} e ${asset2} de forma detalhada.
Inclua:
1. Dividend Yield estimado de cada um
2. Tipo de cada ativo (FII de papel, tijolo, ação de valor, crescimento, etc)
3. Liquidez
4. Riscos de cada um
5. Vantagens de cada um
6. Conclusão: qual é mais indicado para cada perfil de investidor

Responda de forma clara e organizada em português do Brasil.`

      const response = await chatWithGemini(prompt)
      setResult(response)
    } catch (err) {
      setResult(`❌ Erro: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (!isConfigured()) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📊 Comparador</h1>
        <div className="card text-center py-12">
          <BarChart3 size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 mb-4">Configure a API do Gemini para usar o comparador.</p>
          <Link to="/configuracoes" className="btn-primary">Configurações</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📊 Comparador de Ativos</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Compare dois ativos com análise da IA</p>
      </div>

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Ativo 1</label>
            <input
              type="text"
              placeholder="Ex: MXRF11"
              className="input-field"
              value={asset1}
              onChange={e => setAsset1(e.target.value.toUpperCase())}
              list="assets-list"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Ativo 2</label>
            <input
              type="text"
              placeholder="Ex: HGLG11"
              className="input-field"
              value={asset2}
              onChange={e => setAsset2(e.target.value.toUpperCase())}
              list="assets-list"
            />
          </div>
          <button
            onClick={handleCompare}
            disabled={loading || !asset1 || !asset2}
            className="btn-primary flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <BarChart3 size={16} />}
            {loading ? 'Comparando...' : 'Comparar'}
          </button>
        </div>
        <datalist id="assets-list">
          {assets.map(a => <option key={a.ticker} value={a.ticker} />)}
        </datalist>
      </div>

      {result && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Análise: {asset1} vs {asset2}
          </h2>
          <div className="prose dark:prose-invert max-w-none text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300">
            {result}
          </div>
        </div>
      )}
    </div>
  )
}
