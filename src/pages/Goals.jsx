import { useState, useEffect } from 'react'
import { Plus, Target, Trash2, X } from 'lucide-react'
import { getGoals, addGoal, saveGoals, getTotalDividends } from '../services/dataService'
import { formatCurrency } from '../utils/helpers'

export default function Goals() {
  const [goals, setGoals] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nome: '', valor: '', tipo: 'dividendos' })

  useEffect(() => {
    setGoals(getGoals())
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.nome || !form.valor) return

    addGoal({
      nome: form.nome,
      valorMeta: parseFloat(form.valor),
      tipo: form.tipo,
    })

    setGoals(getGoals())
    setForm({ nome: '', valor: '', tipo: 'dividendos' })
    setShowForm(false)
  }

  const handleRemove = (id) => {
    const updated = goals.filter(g => g.id !== id)
    saveGoals(updated)
    setGoals(updated)
  }

  const getProgress = (goal) => {
    const totalDiv = getTotalDividends()
    if (goal.tipo === 'dividendos') {
      return Math.min((totalDiv / goal.valorMeta) * 100, 100)
    }
    return 0
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🎯 Metas</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Defina e acompanhe seus objetivos</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Nova Meta
        </button>
      </div>

      {showForm && (
        <div className="card border-primary-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Nova Meta</h3>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Descrição</label>
              <input
                type="text"
                placeholder="Ex: Receber R$500 em dividendos"
                className="input-field"
                value={form.nome}
                onChange={e => setForm({ ...form, nome: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="500"
                className="input-field"
                value={form.valor}
                onChange={e => setForm({ ...form, valor: e.target.value })}
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
                <option value="dividendos">Dividendos Totais</option>
                <option value="patrimonio">Patrimônio</option>
              </select>
            </div>
            <div className="flex items-end">
              <button type="submit" className="btn-primary w-full">Criar Meta</button>
            </div>
          </form>
        </div>
      )}

      {goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map(goal => {
            const progress = getProgress(goal)
            return (
              <div key={goal.id} className="card">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{goal.nome}</h3>
                    <p className="text-sm text-gray-500">Meta: {formatCurrency(goal.valorMeta)}</p>
                  </div>
                  <button onClick={() => handleRemove(goal.id)} className="text-gray-300 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="w-full bg-gray-100 dark:bg-dark-bg rounded-full h-3 mb-2">
                  <div
                    className="bg-primary-500 h-3 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{progress.toFixed(1)}% concluído</p>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card text-center py-12">
          <Target size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Nenhuma meta definida</h3>
          <p className="text-gray-500 mb-4">Crie metas para acompanhar seus objetivos</p>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus size={16} className="inline mr-1" /> Criar Meta
          </button>
        </div>
      )}
    </div>
  )
}
