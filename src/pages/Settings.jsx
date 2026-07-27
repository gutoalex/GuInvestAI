import { useState, useEffect } from 'react'
import { Save, Download, Upload, Moon, Sun, Key, Trash2, Cloud, RefreshCw, Loader2 } from 'lucide-react'
import { getSettings, saveSettings, getProfile, saveProfile, exportData, importData, getAssets, getTransactions, getDividends, getGoals } from '../services/dataService'
import { syncAllToSheets, fetchAllFromSheets, setupSheets, isSheetsConfigured } from '../services/sheetsService'

export default function Settings() {
  const [settings, setSettingsState] = useState(getSettings())
  const [profile, setProfileState] = useState(getProfile())
  const [saved, setSaved] = useState(false)
  const [importStatus, setImportStatus] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState(null)

  const handleSaveSettings = () => {
    saveSettings(settings)
    saveProfile(profile)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleSyncToSheets = async () => {
    setSyncing(true)
    setSyncStatus(null)
    try {
      const data = {
        assets: getAssets(),
        transactions: getTransactions(),
        dividends: getDividends(),
        profile: getProfile(),
        goals: getGoals(),
      }
      await syncAllToSheets(data)
      setSyncStatus('success')
    } catch (err) {
      setSyncStatus('error: ' + err.message)
    } finally {
      setSyncing(false)
      setTimeout(() => setSyncStatus(null), 4000)
    }
  }

  const handleSyncFromSheets = async () => {
    setSyncing(true)
    setSyncStatus(null)
    try {
      const data = await fetchAllFromSheets()
      if (data.error) throw new Error(data.error)
      // Importa dados da planilha para o localStorage
      const importStr = JSON.stringify({
        assets: data.assets || [],
        transactions: data.transactions || [],
        dividends: data.dividends || [],
        profile: data.profile || {},
        goals: data.goals || [],
      })
      importData(importStr)
      setProfileState(getProfile())
      setSyncStatus('success')
    } catch (err) {
      setSyncStatus('error: ' + err.message)
    } finally {
      setSyncing(false)
      setTimeout(() => setSyncStatus(null), 4000)
    }
  }

  const handleSetupSheets = async () => {
    setSyncing(true)
    try {
      await setupSheets()
      setSyncStatus('setup-ok')
    } catch (err) {
      setSyncStatus('error: ' + err.message)
    } finally {
      setSyncing(false)
      setTimeout(() => setSyncStatus(null), 4000)
    }
  }

  const handleExport = () => {
    const data = exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `guinvestai-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = importData(event.target.result)
      if (result.success) {
        setImportStatus('success')
        setSettingsState(getSettings())
        setProfileState(getProfile())
      } else {
        setImportStatus('error')
      }
      setTimeout(() => setImportStatus(null), 3000)
    }
    reader.readAsText(file)
  }

  const handleClearData = () => {
    if (confirm('Tem certeza? Isso apagará TODOS os seus dados. Faça um backup antes!')) {
      localStorage.clear()
      window.location.reload()
    }
  }

  const toggleTheme = () => {
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark'
    setSettingsState({ ...settings, theme: newTheme })
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
    saveSettings({ ...settings, theme: newTheme })
  }

  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.theme === 'dark')
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">⚙️ Configurações</h1>

      {/* API Keys */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Key size={18} /> Chaves de IA (Fallback automático)
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Configure uma ou mais IAs. O sistema tenta na ordem: OpenAI → Groq → Gemini. Análise de imagem usa sempre Gemini.
        </p>

        <div className="space-y-4">
          {/* OpenAI */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              OpenAI API Key <span className="text-green-600">(gratuita até limite)</span>
            </label>
            <input
              type="password"
              placeholder="sk-..."
              className="input-field"
              value={settings.openaiApiKey || ''}
              onChange={e => setSettingsState({ ...settings, openaiApiKey: e.target.value })}
            />
            <p className="text-xs text-gray-400 mt-1">
              Obtenha em: <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener" className="text-primary-600 hover:underline">platform.openai.com/api-keys</a>
            </p>
          </div>

          {/* Groq */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Groq API Key <span className="text-green-600">(grátis, sem cartão)</span>
            </label>
            <input
              type="password"
              placeholder="gsk_..."
              className="input-field"
              value={settings.groqApiKey || ''}
              onChange={e => setSettingsState({ ...settings, groqApiKey: e.target.value })}
            />
            <p className="text-xs text-gray-400 mt-1">
              Obtenha em: <a href="https://console.groq.com/keys" target="_blank" rel="noopener" className="text-primary-600 hover:underline">console.groq.com/keys</a> — Super rápido e gratuito!
            </p>
          </div>

          {/* Gemini */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Gemini API Key <span className="text-amber-600">(paga — usado como fallback e para imagens)</span>
            </label>
            <input
              type="password"
              placeholder="Sua API Key do Gemini"
              className="input-field"
              value={settings.geminiApiKey || ''}
              onChange={e => setSettingsState({ ...settings, geminiApiKey: e.target.value })}
            />
            <p className="text-xs text-gray-400 mt-1">
              Obtenha em: <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" className="text-primary-600 hover:underline">aistudio.google.com/apikey</a>
            </p>
          </div>

          {/* Alpha Vantage */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Alpha Vantage API Key <span className="text-green-600">(grátis — cotações em tempo real)</span>
            </label>
            <input
              type="password"
              placeholder="Sua API Key do Alpha Vantage"
              className="input-field"
              value={settings.alphaVantageKey || ''}
              onChange={e => setSettingsState({ ...settings, alphaVantageKey: e.target.value })}
            />
            <p className="text-xs text-gray-400 mt-1">
              Obtenha em: <a href="https://www.alphavantage.co/support/#api-key" target="_blank" rel="noopener" className="text-primary-600 hover:underline">alphavantage.co</a> — 25 consultas/dia grátis
            </p>
          </div>
        </div>
      </div>

      {/* Google Sheets */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Cloud size={18} /> Google Sheets (Banco de Dados)
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Cole aqui a URL do Apps Script publicado para sincronizar dados com o Google Sheets.
        </p>
        <input
          type="text"
          placeholder="https://script.google.com/macros/s/.../exec"
          className="input-field mb-3"
          value={settings.sheetsUrl || ''}
          onChange={e => setSettingsState({ ...settings, sheetsUrl: e.target.value })}
        />
        {settings.sheetsUrl && (
          <div className="flex flex-wrap gap-2">
            <button onClick={handleSetupSheets} disabled={syncing} className="btn-secondary text-sm flex items-center gap-1">
              {syncing ? <Loader2 size={14} className="animate-spin" /> : <Cloud size={14} />}
              Criar Abas
            </button>
            <button onClick={handleSyncToSheets} disabled={syncing} className="btn-primary text-sm flex items-center gap-1">
              {syncing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              Enviar para Planilha
            </button>
            <button onClick={handleSyncFromSheets} disabled={syncing} className="btn-secondary text-sm flex items-center gap-1">
              {syncing ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              Baixar da Planilha
            </button>
          </div>
        )}
        {syncStatus === 'success' && <p className="text-green-600 text-sm mt-2">✓ Sincronizado com sucesso!</p>}
        {syncStatus === 'setup-ok' && <p className="text-green-600 text-sm mt-2">✓ Abas criadas na planilha!</p>}
        {syncStatus?.startsWith('error') && <p className="text-red-600 text-sm mt-2">✗ {syncStatus}</p>}
      </div>

      {/* Perfil do Investidor */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Perfil do Investidor</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Essas informações ajudam a IA a fornecer recomendações personalizadas.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nome</label>
            <input
              type="text"
              className="input-field"
              value={profile.nome}
              onChange={e => setProfileState({ ...profile, nome: e.target.value })}
              placeholder="Seu nome"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Perfil</label>
            <select
              className="input-field"
              value={profile.perfil}
              onChange={e => setProfileState({ ...profile, perfil: e.target.value })}
            >
              <option value="conservador">Conservador</option>
              <option value="moderado">Moderado</option>
              <option value="agressivo">Agressivo</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Objetivo</label>
            <input
              type="text"
              className="input-field"
              value={profile.objetivo}
              onChange={e => setProfileState({ ...profile, objetivo: e.target.value })}
              placeholder="Ex: Renda passiva, aposentadoria"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Idade</label>
            <input
              type="number"
              className="input-field"
              value={profile.idade}
              onChange={e => setProfileState({ ...profile, idade: e.target.value })}
              placeholder="25"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Renda Mensal (R$)</label>
            <input
              type="number"
              className="input-field"
              value={profile.renda}
              onChange={e => setProfileState({ ...profile, renda: e.target.value })}
              placeholder="5000"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Valor Investido (R$)</label>
            <input
              type="number"
              className="input-field"
              value={profile.valorInvestido}
              onChange={e => setProfileState({ ...profile, valorInvestido: e.target.value })}
              placeholder="50000"
            />
          </div>
        </div>
      </div>

      {/* Tema */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tema</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Alterne entre claro e escuro</p>
          </div>
          <button onClick={toggleTheme} className="btn-secondary flex items-center gap-2">
            {settings.theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            {settings.theme === 'dark' ? 'Claro' : 'Escuro'}
          </button>
        </div>
      </div>

      {/* Backup */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Backup de Dados</h2>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
            <Download size={16} /> Exportar JSON
          </button>
          <label className="btn-secondary flex items-center gap-2 cursor-pointer">
            <Upload size={16} /> Importar JSON
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
          <button onClick={handleClearData} className="bg-red-50 hover:bg-red-100 text-red-600 font-medium py-2.5 px-5 rounded-xl transition-all flex items-center gap-2">
            <Trash2 size={16} /> Limpar Dados
          </button>
        </div>
        {importStatus === 'success' && <p className="text-green-600 text-sm mt-2">✓ Dados importados com sucesso!</p>}
        {importStatus === 'error' && <p className="text-red-600 text-sm mt-2">✗ Erro ao importar dados</p>}
      </div>

      {/* Salvar */}
      <button onClick={handleSaveSettings} className="btn-primary flex items-center gap-2">
        <Save size={16} />
        {saved ? '✓ Salvo!' : 'Salvar Configurações'}
      </button>
    </div>
  )
}
