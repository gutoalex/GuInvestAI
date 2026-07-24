import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import Dashboard from './pages/Dashboard'
import Portfolio from './pages/Portfolio'
import Dividends from './pages/Dividends'
import Calendar from './pages/Calendar'
import AIChat from './pages/AIChat'
import ImageAnalysis from './pages/ImageAnalysis'
import Comparator from './pages/Comparator'
import Goals from './pages/Goals'
import Simulator from './pages/Simulator'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/carteira" element={<Portfolio />} />
        <Route path="/dividendos" element={<Dividends />} />
        <Route path="/calendario" element={<Calendar />} />
        <Route path="/ia" element={<AIChat />} />
        <Route path="/imagem" element={<ImageAnalysis />} />
        <Route path="/comparador" element={<Comparator />} />
        <Route path="/metas" element={<Goals />} />
        <Route path="/simulador" element={<Simulator />} />
        <Route path="/configuracoes" element={<Settings />} />
      </Routes>
    </Layout>
  )
}
