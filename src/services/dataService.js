const STORAGE_KEYS = {
  ASSETS: 'guinvestai_assets',
  TRANSACTIONS: 'guinvestai_transactions',
  DIVIDENDS: 'guinvestai_dividends',
  PROFILE: 'guinvestai_profile',
  SETTINGS: 'guinvestai_settings',
  GOALS: 'guinvestai_goals',
}

// === Helpers ===
function getFromStorage(key) {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

function saveToStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data))
  // Trigger auto-sync com Google Sheets (debounced)
  try {
    import('./sheetsService').then(mod => mod.triggerAutoSync())
  } catch { /* silencioso */ }
}

// === Assets ===
export function getAssets() {
  return getFromStorage(STORAGE_KEYS.ASSETS) || []
}

export function saveAssets(assets) {
  saveToStorage(STORAGE_KEYS.ASSETS, assets)
}

export function addAsset(asset) {
  const assets = getAssets()
  const existing = assets.find(a => a.ticker === asset.ticker.toUpperCase())

  if (existing) {
    // Recalcula preço médio
    const totalQty = existing.quantidade + asset.quantidade
    const totalCost = (existing.precoMedio * existing.quantidade) + (asset.preco * asset.quantidade)
    existing.precoMedio = totalCost / totalQty
    existing.quantidade = totalQty
  } else {
    assets.push({
      ticker: asset.ticker.toUpperCase(),
      tipo: asset.tipo || 'FII',
      quantidade: asset.quantidade,
      precoMedio: asset.preco,
      setor: asset.setor || '',
      dataAdicionado: new Date().toISOString(),
    })
  }

  saveAssets(assets)
  addTransaction({
    ticker: asset.ticker.toUpperCase(),
    tipo: 'compra',
    quantidade: asset.quantidade,
    preco: asset.preco,
    taxa: asset.taxa || 0,
    data: asset.data || new Date().toISOString().split('T')[0],
  })

  return assets
}

export function sellAsset(ticker, quantidade, preco, taxa = 0, data) {
  const assets = getAssets()
  const asset = assets.find(a => a.ticker === ticker.toUpperCase())

  if (!asset) return null
  if (quantidade > asset.quantidade) return null

  asset.quantidade -= quantidade

  if (asset.quantidade === 0) {
    const index = assets.indexOf(asset)
    assets.splice(index, 1)
  }

  saveAssets(assets)
  addTransaction({
    ticker: ticker.toUpperCase(),
    tipo: 'venda',
    quantidade,
    preco,
    taxa: taxa || 0,
    data: data || new Date().toISOString().split('T')[0],
  })

  return assets
}

export function removeAsset(ticker) {
  const assets = getAssets().filter(a => a.ticker !== ticker.toUpperCase())
  saveAssets(assets)
  return assets
}

// === Transactions ===
export function getTransactions() {
  return getFromStorage(STORAGE_KEYS.TRANSACTIONS) || []
}

export function addTransaction(transaction) {
  const transactions = getTransactions()
  transactions.push({
    ...transaction,
    id: Date.now() + Math.random().toString(36).substr(2, 9),
    createdAt: new Date().toISOString(),
  })
  saveToStorage(STORAGE_KEYS.TRANSACTIONS, transactions)
}

export function getTransactionsByTicker(ticker) {
  return getTransactions().filter(t => t.ticker === ticker.toUpperCase())
}

// === Dividends ===
export function getDividends() {
  return getFromStorage(STORAGE_KEYS.DIVIDENDS) || []
}

export function addDividend(dividend) {
  const dividends = getDividends()
  dividends.push({
    ...dividend,
    id: Date.now() + Math.random().toString(36).substr(2, 9),
    ticker: dividend.ticker.toUpperCase(),
    createdAt: new Date().toISOString(),
  })
  saveToStorage(STORAGE_KEYS.DIVIDENDS, dividends)
  return dividends
}

export function getDividendsByTicker(ticker) {
  return getDividends().filter(d => d.ticker === ticker.toUpperCase())
}

export function getTotalDividends() {
  return getDividends().reduce((sum, d) => sum + (d.valor || 0), 0)
}

export function getMonthlyDividends() {
  const dividends = getDividends()
  const monthly = {}

  dividends.forEach(d => {
    const month = d.data ? d.data.substring(0, 7) : 'sem-data'
    if (!monthly[month]) monthly[month] = 0
    monthly[month] += d.valor || 0
  })

  return monthly
}

// === Profile ===
export function getProfile() {
  return getFromStorage(STORAGE_KEYS.PROFILE) || {
    nome: '',
    objetivo: '',
    idade: '',
    renda: '',
    valorInvestido: '',
    aporteMensal: '500',
    perfil: 'moderado',
  }
}

export function saveProfile(profile) {
  saveToStorage(STORAGE_KEYS.PROFILE, profile)
}

// === Settings ===
export function getSettings() {
  return getFromStorage(STORAGE_KEYS.SETTINGS) || {
    geminiApiKey: '',
    theme: 'light',
    currency: 'BRL',
  }
}

export function saveSettings(settings) {
  saveToStorage(STORAGE_KEYS.SETTINGS, settings)
}

// === Goals ===
export function getGoals() {
  return getFromStorage(STORAGE_KEYS.GOALS) || []
}

export function saveGoals(goals) {
  saveToStorage(STORAGE_KEYS.GOALS, goals)
}

export function addGoal(goal) {
  const goals = getGoals()
  goals.push({
    ...goal,
    id: Date.now() + Math.random().toString(36).substr(2, 9),
    createdAt: new Date().toISOString(),
  })
  saveGoals(goals)
  return goals
}

// === Export/Import ===
export function exportData() {
  const data = {
    assets: getAssets(),
    transactions: getTransactions(),
    dividends: getDividends(),
    profile: getProfile(),
    settings: getSettings(),
    goals: getGoals(),
    exportedAt: new Date().toISOString(),
  }
  return JSON.stringify(data, null, 2)
}

export function importData(jsonString) {
  try {
    const data = JSON.parse(jsonString)
    if (data.assets) saveAssets(data.assets)
    if (data.transactions) saveToStorage(STORAGE_KEYS.TRANSACTIONS, data.transactions)
    if (data.dividends) saveToStorage(STORAGE_KEYS.DIVIDENDS, data.dividends)
    if (data.profile) saveProfile(data.profile)
    if (data.settings) saveSettings(data.settings)
    if (data.goals) saveGoals(data.goals)
    return { success: true }
  } catch (e) {
    return { success: false, error: e.message }
  }
}

// === Calculated Data ===
export function getPortfolioSummary() {
  const assets = getAssets()
  const totalPatrimonio = assets.reduce((sum, a) => sum + (a.quantidade * (a.precoAtual || a.precoMedio)), 0)
  const totalInvestido = assets.reduce((sum, a) => sum + (a.quantidade * a.precoMedio), 0)
  const lucro = totalPatrimonio - totalInvestido
  const lucroPct = totalInvestido > 0 ? (lucro / totalInvestido) * 100 : 0

  const composicao = {}
  assets.forEach(a => {
    const tipo = a.tipo || 'Outro'
    if (!composicao[tipo]) composicao[tipo] = 0
    composicao[tipo] += a.quantidade * (a.precoAtual || a.precoMedio)
  })

  return {
    totalPatrimonio,
    totalInvestido,
    lucro,
    lucroPct,
    composicao,
    totalAtivos: assets.length,
  }
}
