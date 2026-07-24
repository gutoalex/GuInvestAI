import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Briefcase,
  DollarSign,
  Calendar,
  Bot,
  Camera,
  BarChart3,
  Target,
  Calculator,
  Settings,
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/carteira', icon: Briefcase, label: 'Carteira' },
  { to: '/dividendos', icon: DollarSign, label: 'Dividendos' },
  { to: '/calendario', icon: Calendar, label: 'Calendário' },
  { to: '/ia', icon: Bot, label: 'IA Chat' },
  { to: '/imagem', icon: Camera, label: 'Analisar Imagem' },
  { to: '/comparador', icon: BarChart3, label: 'Comparador' },
  { to: '/metas', icon: Target, label: 'Metas' },
  { to: '/simulador', icon: Calculator, label: 'Simulador' },
  { to: '/configuracoes', icon: Settings, label: 'Configurações' },
]

export default function Sidebar() {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-white dark:bg-dark-card border-r border-gray-100 dark:border-dark-border flex-col z-40">
        <div className="p-5 border-b border-gray-100 dark:border-dark-border">
          <h1 className="text-xl font-bold text-primary-600">
            <span className="text-2xl">🤖</span> GuInvestAI
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Assistente Financeiro com IA</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-border'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-card border-t border-gray-100 dark:border-dark-border z-40 safe-area-bottom">
        <div className="flex overflow-x-auto gap-1 px-2 py-2 scrollbar-hide">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 min-w-[60px] p-2 rounded-lg text-xs transition-all flex-shrink-0 ${
                  isActive
                    ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                    : 'text-gray-500 dark:text-gray-400'
                }`
              }
            >
              <item.icon size={20} />
              <span className="text-[10px] whitespace-nowrap">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  )
}
