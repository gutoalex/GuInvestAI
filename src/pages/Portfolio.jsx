import { useState, useEffect } from 'react'
import { Plus, Trash2, TrendingUp, X } from 'lucide-react'
import { getAssets, addAsset, removeAsset, getTransactionsByTicker, getDividendsByTicker } from '../services/dataService'
import { formatCurrency, formatPercent, formatDate, ASSET_TYPES } from '../utils/helpers'

export default function Portfolio() {
  const [assets, setAssets] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [form, setForm] = useState({
    ticker: '',
    quantidade: '',
    preco: '',
    taxa: '',
    data: new Date().toISOString().split('T')[0],
    tipo: 'FII',
    operacao: 'compra',
  })

  useEffect(() => {
    setAssets(getAssets())
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.ticker || !form.quantidade || !form.preco) return

    addAsset({
      ticker: form.ticker,
      quantidade: parseFloat(form.quantidade),
      preco: parseFloat(form.preco),
      taxa: parseFloat(form.taxa) || 0,
      data: form.data,
      tipo: form.tipo,
    })

    setAssets(getAssets())
    setForm({ ticker: '', quantidade: '', preco: '', taxa: '', data: new Date().toISOString().split('T')[0], tipo: 'FII', operacao: 'compra' })
    setShowForm(false)
  }

  const handleRemove = (ticker) => {
    if (confirm(`Tem certeza que deseja remover ${ticker}?`)) {
      removeAsset(ticker)
      setAssets(getAssets())
      setSelectedAsset(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Carteira</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gerencie seus ativos</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          Adicionar
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card border-primary-200 dark:border-primary-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Registrar Operação</h3>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Ticker</label>
              <input
                type="text"
                placeholder="Ex: MXRF11"
                className="input-field"
                value={form.ticker}
                onChange={e => setForm({ ...form, ticker: e.target.value.toUpperCase() })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Tipo</label>
              <select
                className="input-field"
                value={form.tipo}
                onChange={e => setForm({ ...form, tipo: e.target.value })}
              >
                {ASSET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Operação</label>
              <select
                className="input-field"
                value={form.operacao}
                onChange={e => setForm({ ...form, operacao: e.target.value })}
              >
                <option value="compra">Compra</option>
                <option value="venda">Venda</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Quantidade</label>
              <input
                type="number"
                step="0.01"
                placeholder="100"
                className="input-field"
                value={form.quantidade}
                onChange={e => setForm({ ...form, quantidade: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Preço Unitário (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="10.50"
                className="input-field"
                value={form.preco}
                onChange={e => setForm({ ...form, preco: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Taxa (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                className="input-field"
                value={form.taxa}
                onChange={e => setForm({ ...form, taxa: e.target.value })}
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
            <div className="md:col-span-2 flex items-end">
              <button type="submit" className="btn-primary w-full">
                {form.operacao === 'compra' ? 'Registrar Compra' : 'Registrar Venda'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Ativos */}
      {assets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map(asset => {
            const valorTotal = asset.quantidade * (asset.precoAtual || asset.precoMedio)
            const lucro = ((asset.precoAtual || asset.precoMedio) - asset.precoMedio) / asset.precoMedio * 100
            const dividendos = getDividendsByTicker(asset.ticker)
            const totalDiv = dividendos.reduce((s, d) => s + (d.valor || 0), 0)

            return (
              <div
                key={asset.ticker}
                className="card cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedAsset(asset)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{asset.ticker}</h3>
                    <span className="text-xs px-2 py-0.5 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-full">
                      {asset.tipo}
                    </span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemove(asset.ticker) }}
                    className="text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Qtd:</span>
                    <span className="font-medium dark:text-white">{asset.quantidade}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">PM:</span>
                    <span className="font-medium dark:text-white">{formatCurrency(asset.precoMedio)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total:</span>
                    <span className="font-medium dark:text-white">{formatCurrency(valorTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Dividendos:</span>
                    <span className="font-medium text-green-600">{formatCurrency(totalDiv)}</span>
                  </div>
                </div>

                <div className={`mt-3 pt-3 border-t border-gray-100 dark:border-dark-border flex items-center gap-1 text-sm ${lucro >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  <TrendingUp size={14} />
                  {lucro >= 0 ? '+' : ''}{lucro.toFixed(2)}%
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card text-center py-12">
          <TrendingUp size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Carteira vazia</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Comece adicionando seus ativos</p>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus size={16} className="inline mr-1" /> Adicionar Ativo
          </button>
        </div>
      )}

      {/* Modal Detalhes do Ativo */}
      {selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedAsset(null)}>
          <div className="card max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedAsset.ticker}</h2>
              <button onClick={() => setSelectedAsset(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 dark:bg-dark-bg rounded-xl p-3">
                  <p className="text-gray-500 text-xs">Preço Médio</p>
                  <p className="font-bold dark:text-white">{formatCurrency(selectedAsset.precoMedio)}</p>
                </div>
                <div className="bg-gray-50 dark:bg-dark-bg rounded-xl p-3">
                  <p className="text-gray-500 text-xs">Quantidade</p>
                  <p className="font-bold dark:text-white">{selectedAsset.quantidade}</p>
                </div>
                <div className="bg-gray-50 dark:bg-dark-bg rounded-xl p-3">
                  <p className="text-gray-500 text-xs">Total Investido</p>
                  <p className="font-bold dark:text-white">{formatCurrency(selectedAsset.quantidade * selectedAsset.precoMedio)}</p>
                </div>
                <div className="bg-gray-50 dark:bg-dark-bg rounded-xl p-3">
                  <p className="text-gray-500 text-xs">Tipo</p>
                  <p className="font-bold dark:text-white">{selectedAsset.tipo}</p>
                </div>
              </div>

              {/* Histórico */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Histórico de Transações</h3>
                <div className="space-y-2">
                  {getTransactionsByTicker(selectedAsset.ticker).map(t => (
                    <div key={t.id} className="flex justify-between items-center text-sm py-2 border-b border-gray-50 dark:border-dark-border">
                      <div>
                        <span className={`px-2 py-0.5 rounded text-xs ${t.tipo === 'compra' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {t.tipo}
                        </span>
                        <span className="ml-2 text-gray-600 dark:text-gray-400">{formatDate(t.data)}</span>
                      </div>
                      <div className="text-right">
                        <span className="dark:text-white">{t.quantidade} × {formatCurrency(t.preco)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
