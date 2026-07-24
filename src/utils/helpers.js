// Formata valor para moeda BRL
export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0)
}

// Formata percentual
export function formatPercent(value) {
  return `${(value || 0).toFixed(2)}%`
}

// Formata data para exibição
export function formatDate(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('pt-BR')
}

// Calcula preço médio
export function calculateAveragePrice(transactions) {
  let totalQty = 0
  let totalCost = 0

  transactions
    .filter(t => t.tipo === 'compra')
    .forEach(t => {
      totalQty += t.quantidade
      totalCost += t.quantidade * t.preco + (t.taxa || 0)
    })

  transactions
    .filter(t => t.tipo === 'venda')
    .forEach(t => {
      totalQty -= t.quantidade
    })

  return totalQty > 0 ? totalCost / totalQty : 0
}

// Cores para gráficos
export const CHART_COLORS = [
  '#4c6ef5',
  '#7c3aed',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#06b6d4',
  '#f97316',
  '#8b5cf6',
  '#ef4444',
  '#14b8a6',
]

// Tipos de ativos
export const ASSET_TYPES = ['FII', 'Ação', 'ETF', 'Tesouro', 'Crypto', 'Outro']

// Gera cor baseada no index
export function getColor(index) {
  return CHART_COLORS[index % CHART_COLORS.length]
}

// Calcula variação percentual
export function percentChange(current, previous) {
  if (!previous || previous === 0) return 0
  return ((current - previous) / previous) * 100
}
