// =============================================
// Multi-AI Service com Fallback
// Ordem: OpenAI (grátis) → Groq (grátis) → Gemini (pago)
// Análise de imagem: sempre Gemini
// =============================================

import { getSettings } from './dataService'
import { GoogleGenAI } from '@google/genai'

const GEMINI_MODEL = 'gemini-3.5-flash'

// =============================================
// PROVIDERS
// =============================================

async function callOpenAI(messages, systemPrompt) {
  const settings = getSettings()
  if (!settings.openaiApiKey) return null

  const body = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    temperature: 0.7,
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.openaiApiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error?.message || `OpenAI: ${response.status}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

async function callGroq(messages, systemPrompt) {
  const settings = getSettings()
  if (!settings.groqApiKey) return null

  const body = {
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    temperature: 0.7,
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.groqApiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error?.message || `Groq: ${response.status}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

async function callGemini(prompt, systemPrompt) {
  const settings = getSettings()
  if (!settings.geminiApiKey) return null

  const client = new GoogleGenAI({ apiKey: settings.geminiApiKey })

  const response = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      systemInstruction: systemPrompt,
    },
  })

  return response.text
}

// =============================================
// FALLBACK ENGINE
// =============================================

async function callWithFallback(userMessage, systemPrompt) {
  const messages = [{ role: 'user', content: userMessage }]
  const errors = []

  // 1. Tenta OpenAI
  try {
    const result = await callOpenAI(messages, systemPrompt)
    if (result) return { text: result, provider: 'OpenAI' }
  } catch (e) {
    errors.push(`OpenAI: ${e.message}`)
  }

  // 2. Tenta Groq
  try {
    const result = await callGroq(messages, systemPrompt)
    if (result) return { text: result, provider: 'Groq' }
  } catch (e) {
    errors.push(`Groq: ${e.message}`)
  }

  // 3. Tenta Gemini (pago)
  try {
    const result = await callGemini(userMessage, systemPrompt)
    if (result) return { text: result, provider: 'Gemini' }
  } catch (e) {
    errors.push(`Gemini: ${e.message}`)
  }

  // Nenhum funcionou
  if (errors.length === 0) {
    throw new Error('Configure pelo menos uma API Key nas Configurações (OpenAI, Groq ou Gemini).')
  }
  throw new Error(`Todas as IAs falharam:\n${errors.join('\n')}`)
}

// =============================================
// FUNÇÕES PÚBLICAS
// =============================================

const SYSTEM_PROMPT = `Você é o GuInvestAI, um assistente financeiro pessoal especializado em investimentos brasileiros (FIIs, Ações, ETFs, Tesouro Direto).
Responda sempre em português do Brasil.
Seja claro, direto e educativo. Quando possível, use dados e indicadores.
Sempre lembre que suas sugestões são informativas e que a decisão final é do usuário.`

// Chat livre com fallback
export async function chatWithAI(message, context = '') {
  const systemWithContext = SYSTEM_PROMPT + (context ? `\n\nContexto da carteira do usuário:\n${context}` : '')
  return callWithFallback(message, systemWithContext)
}

// Análise de ativo específico
export async function analyzeAsset(asset, marketData = {}) {
  const prompt = `Analise o ativo ${asset.ticker} com base nas seguintes informações da minha carteira:
- Preço Médio: R$ ${asset.precoMedio?.toFixed(2)}
- Quantidade: ${asset.quantidade}
- Preço Atual: R$ ${(asset.precoAtual || asset.precoMedio)?.toFixed(2)}
- Lucro/Prejuízo: ${(((asset.precoAtual || asset.precoMedio) - asset.precoMedio) / asset.precoMedio * 100).toFixed(2)}%
- Tipo: ${asset.tipo}
${marketData.dy ? `- Dividend Yield: ${marketData.dy}%` : ''}

Considere o cenário atual do mercado brasileiro. Forneça:
1. Análise breve do ativo
2. Pontos positivos e riscos
3. Conclusão: manter, aumentar posição ou reduzir

Responda em português do Brasil de forma clara e educativa.`

  return callWithFallback(prompt, SYSTEM_PROMPT)
}

// Sugestões de investimento
export async function getSuggestion(portfolio, amount, profile) {
  const prompt = `Tenho R$ ${amount} para investir. Com base na minha carteira atual:
${portfolio.map(a => `- ${a.ticker} (${a.tipo}): ${a.quantidade} cotas, PM: R$${a.precoMedio?.toFixed(2)}`).join('\n')}

Meu perfil de investidor é ${profile.perfil || 'moderado'} (Objetivo: ${profile.objetivo || 'crescimento patrimonial'}, Idade: ${profile.idade || 'não informada'}).

Quais seriam as melhores opções de investimento para diversificar ou otimizar minha carteira? 
Apresente 2-3 sugestões com justificativa breve.
Responda em português do Brasil.`

  return callWithFallback(prompt, SYSTEM_PROMPT)
}

// Extrai insights estruturados (usa fallback também)
export async function extractInsights(analysisText) {
  const prompt = `Analise o texto abaixo (que é uma análise de carteira de investimentos) e extraia os pontos-chave como um array JSON.

Cada insight deve ter:
- "tipo": um de ["alocacao", "alerta", "sugestao", "ponto_forte", "resumo"]
- "conteudo": texto curto e direto (máximo 150 caracteres)
- "categoria": opcional, ex: "diversificacao", "risco", "dividendos", "aporte"

Retorne APENAS o array JSON, sem texto adicional. Extraia entre 3 e 8 insights.

Texto da análise:
${analysisText}`

  try {
    const { text } = await callWithFallback(prompt, 'Você é um extrator de dados. Retorne APENAS JSON válido, sem markdown, sem texto extra.')
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) return JSON.parse(jsonMatch[0])
    return JSON.parse(text)
  } catch {
    return []
  }
}

// Análise de imagem — SEMPRE usa Gemini (único que suporta vision grátis de qualidade)
export async function analyzeImage(imageBase64, mimeType = 'image/png') {
  const settings = getSettings()
  if (!settings.geminiApiKey) {
    throw new Error('A análise de imagem requer a API Key do Gemini configurada.')
  }

  const client = new GoogleGenAI({ apiKey: settings.geminiApiKey })

  const prompt = `Extraia as seguintes informações da imagem fornecida, que representa um extrato de investimentos ou um print de tela de corretora:
- Nome do Ativo (Ticker)
- Quantidade
- Preço Unitário
- Valor Total Investido
- Dividendos Recebidos (se presente)

Formate a saída como um JSON válido, por exemplo:
[{"ticker": "MXRF11", "quantidade": 100, "preco_unitario": 10.25, "valor_total": 1025.00, "dividendos": 10.50}]

Se não conseguir identificar algum campo, use null. Retorne APENAS o JSON, sem texto adicional.`

  const response = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      { text: prompt },
      {
        inlineData: {
          data: imageBase64,
          mimeType,
        },
      },
    ],
  })

  const text = response.text

  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) return JSON.parse(jsonMatch[0])
    return JSON.parse(text)
  } catch {
    return { raw: text, error: 'Não foi possível extrair dados estruturados' }
  }
}

// Verifica se pelo menos uma IA está configurada
export function isConfigured() {
  const settings = getSettings()
  return !!(settings.geminiApiKey || settings.openaiApiKey || settings.groqApiKey)
}

// Retorna quais providers estão configurados
export function getConfiguredProviders() {
  const settings = getSettings()
  const providers = []
  if (settings.openaiApiKey) providers.push('OpenAI')
  if (settings.groqApiKey) providers.push('Groq')
  if (settings.geminiApiKey) providers.push('Gemini')
  return providers
}
