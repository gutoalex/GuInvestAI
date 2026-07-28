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
    aporteMensal: parseFloat(profile.aporteMensal) || 500,
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
  const aporteMax = context.aporteMensal

  return `Você é o Assessor Financeiro GuInvestAI. Analise os dados e retorne um plano de ação REALISTA.

⚠️ REGRA ABSOLUTA DE ORÇAMENTO: O aporte mensal do usuário é R$ ${aporteMax.toFixed(2)}. Você NUNCA deve sugerir compras que somem mais que esse valor. Calcule: quantidade × preço da cota ≤ R$ ${aporteMax.toFixed(2)}. Se uma cota custa R$ 100, o máximo são ${Math.floor(aporteMax / 100)} cotas. VALIDE ISSO.

=== CARTEIRA ATUAL ===
Patrimônio: R$ ${context.patrimonio.toFixed(2)}
Total Investido: R$ ${context.totalInvestido.toFixed(2)}
Lucro/Prejuízo: R$ ${context.lucro.toFixed(2)} (${context.lucroPct.toFixed(2)}%)
Dividendos Totais Recebidos: R$ ${context.totalDividendos.toFixed(2)}
Média Mensal Dividendos: R$ ${context.mediaMenusal.toFixed(2)}

Ativos (com valorização):
${context.ativos.map(a => {
  const lucroReais = ((a.precoAtual - a.precoMedio) * a.quantidade).toFixed(2)
  return `- ${a.ticker} (${a.tipo}): ${a.quantidade} cotas | Comprou: R$${a.precoMedio.toFixed(2)} | Agora: R$${a.precoAtual.toFixed(2)} | Lucro: ${a.lucroPct}% (R$${lucroReais})`
}).join('\n')}

=== PERFIL ===
Perfil: ${context.perfil} | Objetivo: ${context.objetivo}
Idade: ${context.idade} | Renda: R$ ${context.renda}
💰 APORTE MENSAL DISPONÍVEL: R$ ${aporteMax.toFixed(2)}

=== METAS ===
${context.metas.length > 0 ? context.metas.map(m => `- ${m.nome}: R$ ${m.valor} (${m.tipo})`).join('\n') : 'Meta padrão: R$ 2.000 de renda passiva mensal'}

=== OPORTUNIDADES DE MERCADO ===
${context.oportunidades.map(o => `- ${o.ticker} (${o.tipo}/${o.segmento}): Cota R$${o.preco} | DY ${o.dy}% | Div: R$${o.lastDiv}/cota/mês`).join('\n')}

=== INSTRUÇÕES ===
1. Distribua os R$ ${aporteMax.toFixed(2)} de aporte entre os melhores ativos. SOME os valores e garanta que NÃO ULTRAPASSA o aporte.
2. Para cada sugestão de compra, explique POR QUE esse ativo (em 1 frase clara).
3. Se algum ativo da carteira ficou caro (subiu muito), sugira venda com motivo.
4. Calcule o tempo para atingir a meta no ritmo atual e no ritmo otimizado.
5. Mostre a valorização de cada ativo (comprou por X, agora vale Y).

RETORNE APENAS JSON (sem markdown, sem crases):
{
  "alerta": "string - ponto de atenção principal (max 100 chars)",
  "tempo_meta_atual": "string - ex: '15 anos neste ritmo'",
  "tempo_meta_otimizado": "string - ex: '8 anos com aportes inteligentes'",
  "aporte_sugerido": "string - ex: 'Dividir R$ 500: R$ 200 em KNCR11 + R$ 200 em BTLG11 + R$ 100 em MXRF11'",
  "orcamento_total": ${aporteMax.toFixed(2)},
  "sugestao_compra": [{"ticker": "XXX", "motivo": "POR QUE comprar este (1 frase)", "quantidade_sugerida": 2, "custo_total": 200.00}],
  "sugestao_venda": [{"ticker": "XXX", "motivo": "POR QUE vender (1 frase)"}],
  "valorizacao_carteira": [{"ticker": "XXX", "comprou": 10.00, "agora": 11.50, "lucro_pct": 15.0, "lucro_reais": 15.00}],
  "justificativa": "string - explicação geral em 2-3 frases",
  "proximos_passos": ["passo 1", "passo 2", "passo 3"]
}

VALIDAÇÃO FINAL: some todos os custo_total das sugestões. Se > R$ ${aporteMax.toFixed(2)}, REDUZA quantidades até caber no orçamento.`
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
