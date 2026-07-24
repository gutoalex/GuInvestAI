import { useState, useEffect } from 'react'
import { Calendar as CalIcon, DollarSign } from 'lucide-react'
import { getDividends, getAssets } from '../services/dataService'
import { formatCurrency } from '../utils/helpers'

export default function Calendar() {
  const [dividends, setDividends] = useState([])
  const [currentMonth, setCurrentMonth] = useState(new Date())

  useEffect(() => {
    setDividends(getDividends())
  }, [])

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()

  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`
  const monthDividends = dividends.filter(d => d.data?.startsWith(monthStr))

  // Agrupar dividendos por dia
  const divByDay = {}
  monthDividends.forEach(d => {
    const day = parseInt(d.data.split('-')[2])
    if (!divByDay[day]) divByDay[day] = []
    divByDay[day].push(d)
  })

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1))

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📅 Calendário</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Visualize eventos dos seus investimentos</p>
      </div>

      <div className="card">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMonth} className="btn-secondary px-3 py-1.5">←</button>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {monthNames[month]} {year}
          </h2>
          <button onClick={nextMonth} className="btn-secondary px-3 py-1.5">→</button>
        </div>

        {/* Dias da semana */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
            <div key={d} className="text-center text-xs font-medium text-gray-500 py-2">{d}</div>
          ))}
        </div>

        {/* Dias */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }, (_, i) => (
            <div key={`empty-${i}`} className="h-16" />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1
            const hasDividend = divByDay[day]
            const today = new Date()
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()

            return (
              <div
                key={day}
                className={`h-16 rounded-lg p-1 text-xs border transition-colors ${
                  isToday ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/10' :
                  hasDividend ? 'border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800' :
                  'border-transparent hover:bg-gray-50 dark:hover:bg-dark-border'
                }`}
              >
                <span className={`font-medium ${isToday ? 'text-primary-600' : 'text-gray-700 dark:text-gray-300'}`}>
                  {day}
                </span>
                {hasDividend && (
                  <div className="mt-0.5">
                    {hasDividend.slice(0, 2).map((d, idx) => (
                      <div key={idx} className="text-[9px] text-green-600 truncate flex items-center gap-0.5">
                        <DollarSign size={8} />
                        {d.ticker}
                      </div>
                    ))}
                    {hasDividend.length > 2 && (
                      <span className="text-[9px] text-gray-400">+{hasDividend.length - 2}</span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Eventos do mês */}
      {monthDividends.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Dividendos em {monthNames[month]}
          </h2>
          <div className="space-y-2">
            {monthDividends
              .sort((a, b) => a.data.localeCompare(b.data))
              .map(d => (
                <div key={d.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-dark-border last:border-0">
                  <div className="flex items-center gap-2">
                    <DollarSign size={16} className="text-green-500" />
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">{d.ticker}</span>
                      <span className="text-xs text-gray-500 ml-2">{d.data}</span>
                    </div>
                  </div>
                  <span className="font-medium text-green-600">{formatCurrency(d.valor)}</span>
                </div>
              ))
            }
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-border">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Total no mês: <span className="font-bold text-green-600">{formatCurrency(monthDividends.reduce((s, d) => s + (d.valor || 0), 0))}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
