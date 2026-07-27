// =============================================
// Serviço de dados de mercado via Alpha Vantage
// Tier gratuito: 25 requests/dia
// =============================================

import { getSettings } from './dataService'

const BASE_URL = 'https://www.alphavantage.co/query'
const CACHE_KEY = 'guinvestai_market_cache'
const CACHE_DURATION = 4 * 60 * 60 * 1000 // 4 horas (economiza requests)

function getApiKey() {
  const settings = getSettings()
  return settings.alphaVantageKey || ''
}

// Cache para não gastar requests repetidos
function getCache() {
  try {
    const data = localStorage.getItem(CACHE_KEY)
    if (!data) return {}
    const parsed = JSON.parse(data)
    // Verifica se o cache expirou
    if (Date.now() - parsed.timestamp > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY)
      return {}
    }
    return parsed.quotes || {}
  } catch {
    return {}
  }
}

function saveCache(quotes) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({
    timestamp: Date.now(),
    quotes,
  }))
}

// Busca cotação de um ativo
export async function getQuote(ticker) {
  const apiKey = getApiKey()
  if (!apiKey) return null

  // Para ações brasileiras, adiciona .SAO
  const symbol = ticker.endsWith('.SAO') ? ticker : `${ticker}.SAO`

  try {
    const response = await fetch(
      `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`
    )
    
    if (!response.ok) return null
    
    const data = await response.json()
    
    // Verifica erros da API
    if (data['Error Message'] || data['Note']) return null
    
    const quote = data['Global Quote']
    if (!quote || !quote['05. price']) return null

    return {
      ticker: ticker,
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: parseFloat(quote['10. change percent']?.replace('%', '')),
      volume: parseInt(quote['06. volume']),
      previousClose: parseFloat(quote['08. previous close']),
      lastUpdated: quote['07. latest trading day'],
    }
  } catch {
    return null
  }
}

// Busca cotações de múltiplos ativos (usa cache)
export async function getQuotes(tickers) {
  const apiKey = getApiKey()
  if (!apiKey) return {}

  const cache = getCache()
  const results = { ...cache }
  const toFetch = tickers.filter(t => !cache[t])

  // Busca apenas os que não estão no cache (economiza requests)
  for (const ticker of toFetch) {
    const quote = await getQuote(ticker)
    if (quote) {
      results[ticker] = quote
    }
    // Pequeno delay entre requests para não bater rate limit
    if (toFetch.indexOf(ticker) < toFetch.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1500))
    }
  }

  // Atualiza cache
  saveCache(results)
  return results
}

// Atualiza preços dos ativos na carteira
export async function updatePortfolioPrices(assets) {
  const tickers = assets.map(a => a.ticker)
  const quotes = await getQuotes(tickers)
  
  return assets.map(asset => ({
    ...asset,
    precoAtual: quotes[asset.ticker]?.price || asset.precoAtual || asset.precoMedio,
    variacao: quotes[asset.ticker]?.changePercent || 0,
  }))
}

// Verifica se Alpha Vantage está configurada
export function isMarketConfigured() {
  return !!getApiKey()
}

// Limpa o cache (force refresh)
export function clearMarketCache() {
  localStorage.removeItem(CACHE_KEY)
}
