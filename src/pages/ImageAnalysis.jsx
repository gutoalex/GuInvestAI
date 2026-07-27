import { useState } from 'react'
import { Upload, Camera, Check, X, Loader2 } from 'lucide-react'
import { analyzeImage, isConfigured } from '../services/aiService'
import { addAsset } from '../services/dataService'
import { formatCurrency } from '../utils/helpers'
import { Link } from 'react-router-dom'

export default function ImageAnalysis() {
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [added, setAdded] = useState([])

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setError(null)
    setResults(null)
    setAdded([])

    const reader = new FileReader()
    reader.onload = (event) => {
      setPreview(event.target.result)
      // Remove o prefixo data:image/xxx;base64,
      const base64 = event.target.result.split(',')[1]
      setImage({ base64, mimeType: file.type })
    }
    reader.readAsDataURL(file)
  }

  const handleAnalyze = async () => {
    if (!image) return
    setLoading(true)
    setError(null)

    try {
      const result = await analyzeImage(image.base64, image.mimeType)
      if (result.error) {
        setError(result.raw || result.error)
      } else {
        setResults(Array.isArray(result) ? result : [result])
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddAsset = (item) => {
    addAsset({
      ticker: item.ticker,
      quantidade: item.quantidade,
      preco: item.preco_unitario,
      tipo: item.ticker?.endsWith('11') ? 'FII' : 'Ação',
      data: new Date().toISOString().split('T')[0],
    })
    setAdded(prev => [...prev, item.ticker])
  }

  if (!isConfigured()) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📷 Analisar Imagem</h1>
        <div className="card text-center py-12">
          <Camera size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Configure a API do Gemini</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Para usar a análise de imagens, configure sua API Key nas configurações.
          </p>
          <Link to="/configuracoes" className="btn-primary">Ir para Configurações</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📷 Analisar Imagem</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Envie prints de extratos para extrair dados automaticamente
        </p>
      </div>

      {/* Upload */}
      <div className="card">
        <div className="border-2 border-dashed border-gray-200 dark:border-dark-border rounded-xl p-8 text-center">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="image-upload"
          />
          <label htmlFor="image-upload" className="cursor-pointer">
            {preview ? (
              <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
            ) : (
              <>
                <Upload size={40} className="mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400">Clique para enviar uma imagem</p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG ou PDF</p>
              </>
            )}
          </label>
        </div>

        {preview && (
          <div className="mt-4 flex gap-3">
            <button onClick={handleAnalyze} disabled={loading} className="btn-primary flex items-center gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
              {loading ? 'Analisando...' : 'Analisar com IA'}
            </button>
            <button onClick={() => { setPreview(null); setImage(null); setResults(null) }} className="btn-secondary">
              Limpar
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="card border-red-200 bg-red-50 dark:bg-red-900/10">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Dados Extraídos</h2>
          <div className="space-y-3">
            {results.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-bg rounded-xl">
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">{item.ticker || 'N/A'}</p>
                  <p className="text-sm text-gray-500">
                    {item.quantidade} cotas × {formatCurrency(item.preco_unitario)} = {formatCurrency(item.valor_total)}
                  </p>
                  {item.dividendos && (
                    <p className="text-sm text-green-600">Dividendos: {formatCurrency(item.dividendos)}</p>
                  )}
                </div>
                <div>
                  {added.includes(item.ticker) ? (
                    <span className="flex items-center gap-1 text-green-600 text-sm">
                      <Check size={16} /> Adicionado
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAddAsset(item)}
                      className="btn-primary text-sm py-2 px-3"
                      disabled={!item.ticker || !item.quantidade}
                    >
                      Adicionar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
