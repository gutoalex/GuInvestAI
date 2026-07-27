// =============================================
// Assessor Financeiro Proativo - "Cérebro" do GuInvestAI
// Cruza: Carteira + Metas + Dados de Mercado
// Retorna plano de ação estruturado
// =============================================

import { getAssets, getPortfolioSummary, getTotalDividends, getMonthlyDividends, getProfile, getGoals } from './dataService'
import { getMarketData } from './marketService'
import { RECOMMENDATIONS } from '../data/fiiRecommendations'
import { getSettings } from './dataService'
import { GoogleGenAI } from '@google/genai'

const ADVICE_CACHE_KEY = 'guinvestai_advice_cache'
const ADVICE_CACHE_DURATION = 6 * 60 * 60 * 1000 // 6 horas

// =============================================
// CACHE do conselho (para não chamar IA toda vez)
// =============================================

function getCachedAdvice() {
  try {
    const data = localStorage.getItem(ADVICE_CACHE_KEY)
    if (!data) return null
    const parsed = JSON.parse(data)
    if (Date.now() - parsed.timestamp > ADVICE_CACHE_DURATION) {
      localStorage.removeItem(ADVICE_CACHE_KEY)
      return null
    }
    return parsed.advice
  } catch {
    return null
  }
}

function saveCachedAdvice(advice) {
  localStorage.setItem(ADVICE_CACHE_KEY, JSON.stringify({
    timestamp: Date.now(),
    advice,
  }))
}

// =============================================
// COLETA DE CONTEXTO COMPLETO
// =============================================

async function buildFullContext() {
  const assets = getAssets()
  const summary = getPortfolioSummary()
  const profile = getProfile()
  const goals = getGoals()
  const totalDiv = getTotalDividends()
  const monthlyDiv = getMonthlyDividends()

  // Busca preços de mercado
  const tickers = assets.map(a => a.ticker)
  const { quotes, source } = await getMarketData(tickers)

  // Calcula média mensal de dividendos (últimos 3 meses)
  const months = Object.keys(monthlyDiv).sort().slice(-3)
  const avgMonthlyDiv = months.length > 0
    ? months.reduce((s, m) => s + monthlyDiv[m], 0) / months.length
    : 0

  // Monta contexto dos ativos com preço atual
  const assetsWithPrices = assets.map(a => {
    const normalizedTicker = a.ticker.replace(/II$/i, '11')
    const quote = quotes[a.ticker] || quotes[normalizedTicker]
    const precoAtual = quote?.price || a.precoAtual || a.precoMedio
    const valorTotal = a.quantidade * precoAtual
    const lucroPct = ((precoAtual - a.precoMedio) / a.precoMedio * 100)

    return {
      ticker: a.ticker,
      tipo: a.tipo,
      quantidade: a.quantidade,
      precoMedio: a.precoMedio,
      precoAtual,
      valorTotal,
      lucroPct: lucroPct.toFixed(2),
      temCotacaoReal: !!quote,
    }
  })

  // Top oportunidades do mercado (para sugestão de compra)
  const oportunidades = RECOMMENDATIONS
    .filter(r => !assets.find(a =>
      a.ticker === r.ticker ||
      a.ticker.replace(/II$/i, '11') === r.ticker ||
      a.ticker === r.ticker.replace('11', 'II')
    ))
    .sort((a, b) => b.dy - a.dy)
    .slice(0, 10)

  return {
    // Carteira
    patrimonio: summary.totalPatrimonio,
    totalInvestido: summary.totalInvestido,
    lucro: summary.lucro,
    lucroPct: summary.lucroPct,
    totalAtivos: summary.totalAtivos,
    ativos: assetsWithPrices,

    // Dividendos
    totalDividendos: totalDiv,
    mediaMenusal: avgMonthlyDiv,

    // Perfil e Metas
    perfil: profile.perfil || 'moderado',
    objetivo: profile.objetivo || 'renda passiva',
    idade: profile.idade || 'não informada',
    renda: profile.renda || 'não informada',
    metas: goals.map(g => ({ nome: g.nome, valor: g.valorMeta, tipo: g.tipo })),

    // Mercado
    fonteDados: source,
    oportunidades: oportunidades.map(o => ({
      ticker: o.ticker,
      tipo: o.tipo,
      segmento: o.segmento,
      preco: o.preco,
      dy: o.dy,
      lastDiv: o.lastDiv,
    })),
  }
}

// =============================================
// PROMPT DO ASSESSOR
// =============================================

function buildAdvisorPrompt(context) {
  return `Você é o Assessor Financeiro GuInvestAI. Analise os dados abaixo e retorne um plano de ação ESTRUTURADO.

=== CARTEIRA ATUAL ===
Patrimônio: R$ ${context.patrimonio.toFixed(2)}
Total Investido: R$ ${context.totalInvestido.toFixed(2)}
Lucro/Prejuízo: R$ ${context.lucro.toFixed(2)} (${context.lucroPct.toFixed(2)}%)
Total Dividendos Recebidos: R$ ${context.totalDividendos.toFixed(2)}
Média Mensal Dividendos: R$ ${context.mediaMenusal.toFixed(2)}

Ativos:
${context.ativos.map(a => `- ${a.ticker} (${a.tipo}): ${a.quantidade} cotas, PM: R$${a.precoMedio.toFixed(2)}, Atual: R$${a.precoAtual.toFixed(2)}, Lucro: ${a.lucroPct}%`).join('\n')}

=== PERFIL DO INVESTIDOR ===
Perfil: ${context.perfil}
Objetivo: ${context.objetivo}
Idade: ${context.idade}
Renda: ${context.renda}

=== METAS ===
${context.metas.length > 0 ? context.metas.map(m => `- ${m.nome}: R$ ${m.valor} (${m.tipo})`).join('\n') : 'Meta padrão: R$ 2.000 de renda passiva mensal'}

=== OPORTUNIDADES DE MERCADO ===
${context.oportunidades.map(o => `- ${o.ticker} (${o.tipo}/${o.segmento}): R$${o.preco}, DY ${o.dy}%, Último div: R$${o.lastDiv}/cota`).join('\n')}

=== INSTRUÇÕES ===
Com base no DY atual dos ativos e no quanto falta para a meta, analise:
1. Qual o "Aporte Inteligente" deste mês? Em quais ativos focar?
2. Devo vender algo que ficou caro para comprar algo descontado?
3. Neste ritmo atual de dividendos, em quantos anos atinjo a meta?
4. Se aportar nos ativos sugeridos, em quanto tempo reduzo esse prazo?

RETORNE APENAS um JSON válido (sem markdown, sem crases, sem texto extra) neste formato exato:
{
  "alerta": "string - principal ponto de atenção (max 100 chars)",
  "tempo_meta_atual": "string - ex: '15 anos neste ritmo'",
  "tempo_meta_otimizado": "string - ex: '8 anos com aportes inteligentes'",
  "aporte_sugerido": "string - resumo do que fazer este mês (max 150 chars)",
  "sugestao_compra": [{"ticker": "XXX", "motivo": "string curta", "quantidade_sugerida": number}],
  "sugestao_venda": [{"ticker": "XXX", "motivo": "string curta"}],
  "justificativa": "string - explicação geral em 2-3 frases",
  "proximos_passos": ["passo 1", "passo 2", "passo 3"]
}

Se não houver sugestão de venda, retorne array vazio. Seja direto e prático.`
}

// =============================================
// CHAMADA À IA (usa o mesmo fallback do aiService)
// =============================================

async function callAIForAdvice(prompt) {
  const settings = getSettings()

  // Tenta OpenAI
  if (settings.openaiApiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'Você é um assessor financeiro. Retorne APENAS JSON válido.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.4,
        }),
      })
      if (response.ok) {
        const data = await response.json()
        return data.choices[0].message.content
      }
    } catch { /* fall through */ }
  }

  // Tenta Groq
  if (settings.groqApiKey) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.groqApiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'Você é um assessor financeiro. Retorne APENAS JSON válido.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.4,
        }),
      })
      if (response.ok) {
        const data = await response.json()
        return data.choices[0].message.content
      }
    } catch { /* fall through */ }
  }

  // Tenta Gemini
  if (settings.geminiApiKey) {
    try {
      const client = new GoogleGenAI({ apiKey: settings.geminiApiKey })
      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: 'Você é um assessor financeiro. Retorne APENAS JSON válido, sem markdown.',
        },
      })
      return response.text
    } catch { /* fall through */ }
  }

  return null
}

// =============================================
// FUNÇÃO PRINCIPAL: getProactiveAdvice
// =============================================

export async function getProactiveAdvice(forceRefresh = false) {
  // Verifica cache (não consulta IA toda vez)
  if (!forceRefresh) {
    const cached = getCachedAdvice()
    if (cached) return { ...cached, fromCache: true }
  }

  // Verifica se tem pelo menos uma IA configurada
  const settings = getSettings()
  if (!settings.openaiApiKey && !settings.groqApiKey && !settings.geminiApiKey) {
    return {
      error: 'Configure pelo menos uma API de IA nas Configurações.',
      alerta: 'IA não configurada',
      fromCache: false,
    }
  }

  // Verifica se tem ativos na carteira
  const assets = getAssets()
  if (assets.length === 0) {
    return {
      error: 'Adicione ativos à carteira para receber recomendações.',
      alerta: 'Carteira vazia',
      fromCache: false,
    }
  }

  try {
    // Monta contexto completo
    const context = await buildFullContext()

    // Gera prompt
    const prompt = buildAdvisorPrompt(context)

    // Chama IA
    const rawResponse = await callAIForAdvice(prompt)
    if (!rawResponse) {
      return {
        error: 'Não foi possível consultar a IA. Verifique suas API Keys.',
        alerta: 'Falha na consulta',
        fromCache: false,
      }
    }

    // Parse do JSON retornado
    let advice
    try {
      // Tenta extrair JSON da resposta (pode ter markdown em volta)
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        advice = JSON.parse(jsonMatch[0])
      } else {
        advice = JSON.parse(rawResponse)
      }
    } catch {
      return {
        error: 'A IA retornou formato inválido. Tente novamente.',
        alerta: 'Erro no formato',
        raw: rawResponse,
        fromCache: false,
      }
    }

    // Salva no cache
    const result = {
      ...advice,
      fromCache: false,
      generatedAt: new Date().toISOString(),
      dataSource: context.fonteDados,
    }
    saveCachedAdvice(result)

    return result
  } catch (err) {
    return {
      error: `Erro: ${err.message}`,
      alerta: 'Erro interno',
      fromCache: false,
    }
  }
}

// Limpa cache do advisor (force next call to regenerate)
export function clearAdviceCache() {
  localStorage.removeItem(ADVICE_CACHE_KEY)
}
