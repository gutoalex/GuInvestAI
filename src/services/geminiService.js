import { GoogleGenerativeAI } from '@google/generative-ai'
import { getSettings } from './dataService'

let genAI = null
let model = null
//atualizar
function initGemini() {
  const settings = getSettings()
  if (!settings.geminiApiKey) return null

  genAI = new GoogleGenerativeAI(settings.geminiApiKey)
  model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

  return model
}

let lastApiKey = ''

function getModel() {
  const settings = getSettings()
  // Reinicializa se a key mudou
  if (!model || settings.geminiApiKey !== lastApiKey) {
    lastApiKey = settings.geminiApiKey
    model = null
    initGemini()
  }
  return model
}

// Chat livre com Gemini
export async function chatWithGemini(message, context = '') {
  const m = getModel()
  if (!m) throw new Error('Configure sua API Key do Gemini nas Configurações.')

  const systemPrompt = `Você é o GuInvestAI, um assistente financeiro pessoal especializado em investimentos brasileiros (FIIs, Ações, ETFs, Tesouro Direto).
Responda sempre em português do Brasil.
Seja claro, direto e educativo. Quando possível, use dados e indicadores.
Sempre lembre que suas sugestões são informativas e que a decisão final é do usuário.
${context ? `\nContexto da carteira do usuário:\n${context}` : ''}`

  const result = await m.generateContent([
    { text: systemPrompt },
    { text: message }
  ])

  return result.response.text()
}

// Análise de ativo específico
export async function analyzeAsset(asset, marketData = {}) {
  const m = getModel()
  if (!m) throw new Error('Configure sua API Key do Gemini nas Configurações.')

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

  const result = await m.generateContent(prompt)
  return result.response.text()
}

// Análise de imagem (Gemini Vision)
export async function analyzeImage(imageBase64, mimeType = 'image/png') {
  const m = getModel()
  if (!m) throw new Error('Configure sua API Key do Gemini nas Configurações.')

  const prompt = `Extraia as seguintes informações da imagem fornecida, que representa um extrato de investimentos ou um print de tela de corretora:
- Nome do Ativo (Ticker)
- Quantidade
- Preço Unitário
- Valor Total Investido
- Dividendos Recebidos (se presente)

Formate a saída como um JSON válido, por exemplo:
[{"ticker": "MXRF11", "quantidade": 100, "preco_unitario": 10.25, "valor_total": 1025.00, "dividendos": 10.50}]

Se não conseguir identificar algum campo, use null. Retorne APENAS o JSON, sem texto adicional.`

  const result = await m.generateContent([
    { text: prompt },
    {
      inlineData: {
        data: imageBase64,
        mimeType
      }
    }
  ])

  const text = result.response.text()
  
  // Tenta extrair JSON da resposta
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return JSON.parse(text)
  } catch {
    return { raw: text, error: 'Não foi possível extrair dados estruturados' }
  }
}

// Sugestões de investimento
export async function getSuggestion(portfolio, amount, profile) {
  const m = getModel()
  if (!m) throw new Error('Configure sua API Key do Gemini nas Configurações.')

  const prompt = `Tenho R$ ${amount} para investir. Com base na minha carteira atual:
${portfolio.map(a => `- ${a.ticker} (${a.tipo}): ${a.quantidade} cotas, PM: R$${a.precoMedio?.toFixed(2)}`).join('\n')}

Meu perfil de investidor é ${profile.perfil || 'moderado'} (Objetivo: ${profile.objetivo || 'crescimento patrimonial'}, Idade: ${profile.idade || 'não informada'}).

Quais seriam as melhores opções de investimento para diversificar ou otimizar minha carteira? 
Apresente 2-3 sugestões com justificativa breve.
Responda em português do Brasil.`

  const result = await m.generateContent(prompt)
  return result.response.text()
}

export function isConfigured() {
  const settings = getSettings()
  return !!settings.geminiApiKey
}
