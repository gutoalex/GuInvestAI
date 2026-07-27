// =============================================
// Serviço de Dados de Mercado
// Prioridade: Google Sheets (GOOGLEFINANCE) → Alpha Vantage → Cache local
// =============================================

import { getSettings } from './dataService'

const CACHE_KEY = 'guinvestai_market_cache'
const CACHE_DURATION = 2 * 60 * 60 * 1000 // 2 horas

// =============================================
// CACHE (localStorage)
// =============================================

function getCache() {
  try {
    const data = localStorage.getItem(CACHE_KEY)
    if (!data) return { quotes: {}, timestamp: 0 }
    return JSON.parse(data)
  } catch {
    return { quotes: {}, timestamp: 0 }
  }
}

function saveCache(quotes) {
  const existing = getCache()
  const merged = { ...existing.quotes, ...quotes }
  localStorage.setItem(CACHE_KEY, JSON.stringify({
    timestamp: Date.now(),
    quotes: merged,
  }))
}

function isCacheValid() {
  const cache = getCache()
  return (Date.now() - cache.timestamp) < CACHE_DURATION
}

// =============================================
// FONTE 1: Google Sheets (GOOGLEFINANCE)
// Lê a aba "Cotacoes" via Apps Script
// =============================================

async function fetchFromSheets() {
  const settings = getSettings()
  if (!settings.sheetsUrl) return null

  try {
    const response = await fetch(`${settings.sheetsUrl}?action=getCotacoes`)
    if (!response.ok) return null
    const data = await response.json()
    if (data.error || !Array.isArray(data)) return null

    const quotes = {}
    data.forEach(item => {
      if (item.ticker && item.preco > 0) {
        quotes[item.ticker] = {
          ticker: item.ticker,
          price: item.preco,
          change: item.variacao || 0,
          changePercent: item.variacaoPct || 0,
          volume: item.volume || 0,
          lastUpdated: item.atualizado || new Date().toISOString(),
          source: 'GoogleFinance',
        }
      }
    })
    return Object.keys(quotes).length > 0 ? quotes : null
  } catch {
    return null
  }
}

// =============================================
// FONTE 2: Alpha Vantage (fallback)
// =============================================

async function fetchFromAlphaVantage(tickers) {
  const settings = getSettings()
  if (!settings.alphaVantageKey) return null

  const quotes = {}

  for (const ticker of tickers.slice(0, 5)) { // Limita a 5 para não gastar requests
    try {
      const symbol = `${ticker}.SAO`
      const response = await fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${settings.alphaVantageKey}`
      )
      if (!response.ok) continue

      const data = await response.json()
      if (data['Note'] || data['Error Message']) break // Rate limit

      const quote = data['Global Quote']
      if (quote && quote['05. price']) {
        quotes[ticker] = {
          ticker,
          price: parseFloat(quote['05. price']),
          change: parseFloat(quote['09. change'] || 0),
          changePercent: parseFloat((quote['10. change percent'] || '0').replace('%', '')),
          volume: parseInt(quote['06. volume'] || 0),
          lastUpdated: quote['07. latest trading day'] || new Date().toISOString().split('T')[0],
          source: 'AlphaVantage',
        }
      }

      // Delay entre requests
      await new Promise(r => setTimeout(r, 1500))
    } catch {
      continue
    }
  }

  return Object.keys(quotes).length > 0 ? quotes : null
}

// =============================================
// FUNÇÃO PRINCIPAL: getMarketData
// Tenta Sheets → Alpha Vantage → Cache
// =============================================

export async function getMarketData(tickers = []) {
  // 1. Tenta Google Sheets (mais confiável para B3)
  const sheetsData = await fetchFromSheets()
  if (sheetsData) {
    saveCache(sheetsData)
    return { quotes: sheetsData, source: 'GoogleFinance', fresh: true }
  }

  // 2. Tenta Alpha Vantage
  if (tickers.length > 0) {
    const avData = await fetchFromAlphaVantage(tickers)
    if (avData) {
      saveCache(avData)
      return { quotes: avData, source: 'AlphaVantage', fresh: true }
    }
  }

  // 3. Usa cache local (último dado salvo)
  const cache = getCache()
  if (Object.keys(cache.quotes).length > 0) {
    return { quotes: cache.quotes, source: 'Cache', fresh: false }
  }

  // 4. Nenhum dado disponível
  return { quotes: {}, source: 'none', fresh: false }
}

// Atualiza preços dos ativos na carteira
export async function updatePortfolioPrices(assets) {
  const tickers = assets.map(a => a.ticker)
  const { quotes } = await getMarketData(tickers)

  return assets.map(asset => {
    // Tenta ticker direto e também com normalização II/11
    const normalizedTicker = asset.ticker.replace(/II$/i, '11')
    const quote = quotes[asset.ticker] || quotes[normalizedTicker]

    return {
      ...asset,
      precoAtual: quote?.price || asset.precoAtual || asset.precoMedio,
      variacao: quote?.changePercent || 0,
      source: quote?.source || 'offline',
    }
  })
}

// Verifica se alguma fonte de mercado está configurada
export function isMarketConfigured() {
  const settings = getSettings()
  return !!(settings.sheetsUrl || settings.alphaVantageKey)
}

// Limpa o cache
export function clearMarketCache() {
  localStorage.removeItem(CACHE_KEY)
}

// Retorna dados de mercado para o Radar de Oportunidades
export async function getQuoteForTicker(ticker) {
  const { quotes } = await getMarketData([ticker])
  return quotes[ticker] || null
}
