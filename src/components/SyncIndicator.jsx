import { useState, useEffect } from 'react'
import { Cloud, CloudOff, Loader2, Check } from 'lucide-react'
import { onSyncStatus, isSheetsConfigured, syncWithCloud } from '../services/sheetsService'

export default function SyncIndicator() {
  const [status, setStatus] = useState(null) // null | syncing | success | error

  useEffect(() => {
    const unsubscribe = onSyncStatus(({ status: s, message }) => {
      setStatus({ type: s, message })

      // Auto-hide success after 3s
      if (s === 'success') {
        setTimeout(() => setStatus(null), 3000)
      }
      // Auto-hide error after 5s
      if (s === 'error') {
        setTimeout(() => setStatus(null), 5000)
      }
    })
    return unsubscribe
  }, [])

  if (!isSheetsConfigured()) return null
  if (!status) return null

  return (
    <div className="fixed bottom-20 md:bottom-4 right-4 z-50 animate-in fade-in">
      {status.type === 'syncing' && (
        <div className="flex items-center gap-2 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl px-3 py-2 shadow-lg">
          <Loader2 size={14} className="animate-spin text-primary-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400">Sincronizando...</span>
        </div>
      )}
      {status.type === 'success' && (
        <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-3 py-2 shadow-lg">
          <Check size={14} className="text-green-600" />
          <span className="text-xs text-green-700 dark:text-green-300">Sincronizado!</span>
        </div>
      )}
      {status.type === 'error' && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2 shadow-lg">
          <CloudOff size={14} className="text-red-500" />
          <span className="text-xs text-red-700 dark:text-red-300">Erro ao sincronizar</span>
        </div>
      )}
    </div>
  )
}
