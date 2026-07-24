import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react'
import { chatWithGemini, isConfigured } from '../services/geminiService'
import { getAssets, getPortfolioSummary, getTotalDividends, getProfile } from '../services/dataService'
import { formatCurrency } from '../utils/helpers'
import { Link } from 'react-router-dom'

const quickQuestions = [
  '📊 Analisar minha carteira',
  '💡 Onde investir R$ 500?',
  '⚠️ Mostrar riscos da carteira',
  '📈 Vale comprar mais FIIs?',
  '🎯 Melhor diversificação',
  '💰 Quanto investir este mês?',
]

export default function AIChat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function getPortfolioContext() {
    const assets = getAssets()
    const summary = getPortfolioSummary()
    const profile = getProfile()
    const totalDiv = getTotalDividends()

    if (assets.length === 0) return 'O usuário ainda não possui ativos cadastrados na carteira.'

    let ctx = `Patrimônio total: ${formatCurrency(summary.totalPatrimonio)}\n`
    ctx += `Total investido: ${formatCurrency(summary.totalInvestido)}\n`
    ctx += `Lucro/Prejuízo: ${formatCurrency(summary.lucro)} (${summary.lucroPct.toFixed(2)}%)\n`
    ctx += `Total dividendos recebidos: ${formatCurrency(totalDiv)}\n`
    ctx += `Perfil: ${profile.perfil || 'não informado'}\n`
    ctx += `Objetivo: ${profile.objetivo || 'não informado'}\n\n`
    ctx += `Ativos na carteira:\n`
    assets.forEach(a => {
      ctx += `- ${a.ticker} (${a.tipo}): ${a.quantidade} cotas, PM: R$${a.precoMedio?.toFixed(2)}\n`
    })
    return ctx
  }

  async function handleSend(text = null) {
    const message = text || input.trim()
    if (!message) return

    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: message }])
    setLoading(true)

    try {
      const context = getPortfolioContext()
      const response = await chatWithGemini(message, context)
      setMessages(prev => [...prev, { role: 'assistant', content: response }])
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ Erro: ${error.message}` }])
    } finally {
      setLoading(false)
    }
  }

  if (!isConfigured()) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🤖 Chat com IA</h1>
        <div className="card text-center py-12">
          <Bot size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Configure a API do Gemini</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Para usar o assistente de IA, configure sua API Key do Google Gemini nas configurações.
          </p>
          <Link to="/configuracoes" className="btn-primary">
            Ir para Configurações
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🤖 Chat com IA</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Converse com seu assistente financeiro</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Sparkles size={40} className="mx-auto mb-4 text-primary-400" />
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
              Como posso te ajudar?
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto">
              {quickQuestions.map(q => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="btn-secondary text-sm text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                <Bot size={16} className="text-primary-600" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
              msg.role === 'user'
                ? 'bg-primary-600 text-white rounded-br-md'
                : 'bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border text-gray-800 dark:text-dark-text rounded-bl-md'
            }`}>
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-dark-border flex items-center justify-center flex-shrink-0">
                <User size={16} className="text-gray-600 dark:text-gray-400" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
              <Bot size={16} className="text-primary-600" />
            </div>
            <div className="bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-2xl rounded-bl-md px-4 py-3">
              <Loader2 size={16} className="animate-spin text-primary-500" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Pergunte algo sobre seus investimentos..."
          className="input-field flex-1"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          disabled={loading}
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
          className="btn-primary px-4"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}
