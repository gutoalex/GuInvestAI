// =============================================
// Lista curada de ativos recomendados
// FIIs, Ações e ETFs com bom histórico
// DY = Dividend Yield anual estimado (%)
// lastDiv = último dividendo/provento por cota (R$)
// =============================================

export const RECOMMENDATIONS = [
  // === FIIs ===
  {
    ticker: 'MXRF11',
    nome: 'Maxi Renda',
    tipo: 'FII',
    segmento: 'Híbrido',
    preco: 9.73,
    dy: 12.5,
    lastDiv: 0.10,
    descricao: 'FII mais popular do Brasil. Híbrido com foco em CRIs e imóveis.',
  },
  {
    ticker: 'KNCR11',
    nome: 'Kinea Rendimentos',
    tipo: 'FII',
    segmento: 'Papel',
    preco: 106.72,
    dy: 12.8,
    lastDiv: 1.10,
    descricao: 'Focado em CRIs atrelados ao CDI. Ótimo para juros altos.',
  },
  {
    ticker: 'XPML11',
    nome: 'XP Malls',
    tipo: 'FII',
    segmento: 'Tijolo',
    preco: 106.60,
    dy: 10.5,
    lastDiv: 0.92,
    descricao: 'Shoppings de alta qualidade. Valorização + dividendos.',
  },
  {
    ticker: 'HGLG11',
    nome: 'CSHG Logística',
    tipo: 'FII',
    segmento: 'Tijolo',
    preco: 156.00,
    dy: 9.2,
    lastDiv: 1.20,
    descricao: 'Galpões logísticos premium. Contratos longos e estáveis.',
  },
  {
    ticker: 'CPTS11',
    nome: 'Capitânia Securities',
    tipo: 'FII',
    segmento: 'Papel',
    preco: 7.51,
    dy: 13.0,
    lastDiv: 0.08,
    descricao: 'Papel com excelente gestão. Diversificado em CRIs.',
  },
  {
    ticker: 'BTLG11',
    nome: 'BTG Logística',
    tipo: 'FII',
    segmento: 'Tijolo',
    preco: 97.50,
    dy: 9.8,
    lastDiv: 0.79,
    descricao: 'Logística de qualidade com contratos atípicos.',
  },
  {
    ticker: 'KNIP11',
    nome: 'Kinea Índice de Preços',
    tipo: 'FII',
    segmento: 'Papel',
    preco: 92.00,
    dy: 11.5,
    lastDiv: 0.88,
    descricao: 'CRIs atrelados ao IPCA. Proteção contra inflação.',
  },
  {
    ticker: 'VISC11',
    nome: 'Vinci Shopping Centers',
    tipo: 'FII',
    segmento: 'Tijolo',
    preco: 114.00,
    dy: 9.6,
    lastDiv: 0.91,
    descricao: 'Shoppings diversificados pelo Brasil.',
  },
  {
    ticker: 'IRDM11',
    nome: 'Iridium Recebíveis',
    tipo: 'FII',
    segmento: 'Papel',
    preco: 68.50,
    dy: 13.5,
    lastDiv: 0.77,
    descricao: 'CRIs high yield. Maior risco, maior retorno.',
  },
  {
    ticker: 'GGRC11',
    nome: 'GGR Covepi',
    tipo: 'FII',
    segmento: 'Tijolo',
    preco: 9.72,
    dy: 11.0,
    lastDiv: 0.09,
    descricao: 'Logística e indústria. Bom custo-benefício.',
  },

  // === AÇÕES (Dividendos) ===
  {
    ticker: 'BBAS3',
    nome: 'Banco do Brasil',
    tipo: 'Ação',
    segmento: 'Banco',
    preco: 28.50,
    dy: 9.5,
    lastDiv: 0.22,
    descricao: 'Maior banco público. Lucros consistentes e dividendos altos.',
  },
  {
    ticker: 'TAEE11',
    nome: 'Taesa',
    tipo: 'Ação',
    segmento: 'Energia',
    preco: 35.80,
    dy: 9.0,
    lastDiv: 0.27,
    descricao: 'Transmissão de energia. Receita previsível e bons proventos.',
  },
  {
    ticker: 'ITSA4',
    nome: 'Itaúsa',
    tipo: 'Ação',
    segmento: 'Holding',
    preco: 10.20,
    dy: 7.5,
    lastDiv: 0.06,
    descricao: 'Holding do Itaú. Diversificada e consistente há décadas.',
  },
  {
    ticker: 'PETR4',
    nome: 'Petrobras PN',
    tipo: 'Ação',
    segmento: 'Petróleo',
    preco: 37.00,
    dy: 14.0,
    lastDiv: 0.43,
    descricao: 'Maior empresa do Brasil. DY altíssimo, mas volátil.',
  },
  {
    ticker: 'VALE3',
    nome: 'Vale',
    tipo: 'Ação',
    segmento: 'Mineração',
    preco: 62.00,
    dy: 8.5,
    lastDiv: 0.44,
    descricao: 'Gigante da mineração. Exportadora, dolarizada.',
  },
  {
    ticker: 'BBDC4',
    nome: 'Bradesco PN',
    tipo: 'Ação',
    segmento: 'Banco',
    preco: 14.50,
    dy: 7.0,
    lastDiv: 0.08,
    descricao: 'Um dos maiores bancos privados. Em recuperação.',
  },
  {
    ticker: 'WEGE3',
    nome: 'WEG',
    tipo: 'Ação',
    segmento: 'Indústria',
    preco: 52.00,
    dy: 1.5,
    lastDiv: 0.07,
    descricao: 'Empresa de crescimento. Pouco dividendo, mas valoriza muito.',
  },
  {
    ticker: 'EGIE3',
    nome: 'Engie Brasil',
    tipo: 'Ação',
    segmento: 'Energia',
    preco: 42.00,
    dy: 6.5,
    lastDiv: 0.23,
    descricao: 'Geração de energia limpa. Dividendos estáveis.',
  },

  // === ETFs ===
  {
    ticker: 'IVVB11',
    nome: 'iShares S&P 500',
    tipo: 'ETF',
    segmento: 'EUA',
    preco: 320.00,
    dy: 0,
    lastDiv: 0,
    descricao: 'Replica o S&P 500. Exposição ao mercado americano.',
  },
  {
    ticker: 'BOVA11',
    nome: 'iShares Ibovespa',
    tipo: 'ETF',
    segmento: 'Brasil',
    preco: 125.00,
    dy: 0,
    lastDiv: 0,
    descricao: 'Replica o Ibovespa. Diversificação instantânea no Brasil.',
  },
  {
    ticker: 'HASH11',
    nome: 'Hashdex Crypto',
    tipo: 'ETF',
    segmento: 'Crypto',
    preco: 45.00,
    dy: 0,
    lastDiv: 0,
    descricao: 'Exposição a Bitcoin e criptos via B3. Alto risco/retorno.',
  },
]

// Mantém compatibilidade com o import antigo
export const FII_RECOMMENDATIONS = RECOMMENDATIONS.filter(r => r.tipo === 'FII')

// Calcula rendimento mensal estimado por cotas
export function calcMonthlyIncome(asset, qtdCotas) {
  return asset.lastDiv * qtdCotas
}

// Calcula quantas cotas cabem num valor
export function calcQuotasForBudget(asset, budget) {
  return Math.floor(budget / asset.preco)
}
