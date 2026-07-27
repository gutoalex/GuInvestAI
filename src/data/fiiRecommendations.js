// Lista curada de FIIs populares com bom histórico
// Dados aproximados - atualizados pela IA quando solicitado
// DY = Dividend Yield anual estimado (%)
// lastDiv = último dividendo por cota (R$)

export const FII_RECOMMENDATIONS = [
  {
    ticker: 'MXRF11',
    nome: 'Maxi Renda',
    segmento: 'Híbrido',
    preco: 9.73,
    dy: 12.5,
    lastDiv: 0.10,
    descricao: 'FII mais popular do Brasil. Híbrido com foco em CRIs e imóveis.',
  },
  {
    ticker: 'KNCR11',
    nome: 'Kinea Rendimentos',
    segmento: 'Papel',
    preco: 106.72,
    dy: 12.8,
    lastDiv: 1.10,
    descricao: 'Focado em CRIs atrelados ao CDI. Ótimo para cenário de juros altos.',
  },
  {
    ticker: 'XPML11',
    nome: 'XP Malls',
    segmento: 'Tijolo',
    preco: 106.60,
    dy: 10.5,
    lastDiv: 0.92,
    descricao: 'Shoppings de alta qualidade. Valorização + dividendos.',
  },
  {
    ticker: 'HGLG11',
    nome: 'CSHG Logística',
    segmento: 'Tijolo',
    preco: 156.00,
    dy: 9.2,
    lastDiv: 1.20,
    descricao: 'Galpões logísticos premium. Contratos longos e estáveis.',
  },
  {
    ticker: 'CPTS11',
    nome: 'Capitânia Securities',
    segmento: 'Papel',
    preco: 7.51,
    dy: 13.0,
    lastDiv: 0.08,
    descricao: 'Papel com excelente gestão. Diversificado em CRIs.',
  },
  {
    ticker: 'BTLG11',
    nome: 'BTG Logística',
    segmento: 'Tijolo',
    preco: 97.50,
    dy: 9.8,
    lastDiv: 0.79,
    descricao: 'Logística de qualidade com contratos atípicos.',
  },
  {
    ticker: 'KNIP11',
    nome: 'Kinea Índice de Preços',
    segmento: 'Papel',
    preco: 92.00,
    dy: 11.5,
    lastDiv: 0.88,
    descricao: 'CRIs atrelados ao IPCA. Proteção contra inflação.',
  },
  {
    ticker: 'VISC11',
    nome: 'Vinci Shopping Centers',
    segmento: 'Tijolo',
    preco: 114.00,
    dy: 9.6,
    lastDiv: 0.91,
    descricao: 'Shoppings diversificados pelo Brasil.',
  },
  {
    ticker: 'IRDM11',
    nome: 'Iridium Recebíveis',
    segmento: 'Papel',
    preco: 68.50,
    dy: 13.5,
    lastDiv: 0.77,
    descricao: 'CRIs high yield. Maior risco, maior retorno.',
  },
  {
    ticker: 'GGRC11',
    nome: 'GGR Covepi',
    segmento: 'Tijolo',
    preco: 9.72,
    dy: 11.0,
    lastDiv: 0.09,
    descricao: 'Logística e indústria. Bom custo-benefício.',
  },
]

// Calcula rendimento mensal estimado por cotas
export function calcMonthlyIncome(fii, qtdCotas) {
  return fii.lastDiv * qtdCotas
}

// Calcula quantas cotas cabem num valor
export function calcQuotasForBudget(fii, budget) {
  return Math.floor(budget / fii.preco)
}
