// =============================================
// ADICIONAR AO SEU APPS SCRIPT EXISTENTE
// Aba "Cotacoes" com GOOGLEFINANCE para preços em tempo real
// =============================================

// 1. No switch do doGet, adicione este case:
/*
      case 'getCotacoes':
        result = getCotacoes();
        break;
*/

// 2. Adicione esta função no final do script:

function getCotacoes() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName('Cotacoes');
  
  // Se a aba não existe, cria e popula com os ativos da carteira
  if (!sheet) {
    sheet = ss.insertSheet('Cotacoes');
    setupCotacoes();
  }
  
  if (sheet.getLastRow() <= 1) return [];
  
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 5).getValues();
  return data
    .filter(row => row[0] && row[1] > 0)
    .map(row => ({
      ticker: row[0],
      preco: row[1],
      variacao: row[2] || 0,
      variacaoPct: row[3] || 0,
      atualizado: row[4] || new Date().toISOString(),
    }));
}

// 3. Adicione também no switch do doGet:
/*
      case 'setupCotacoes':
        result = setupCotacoes();
        break;
*/

// 4. Função para criar/atualizar a aba Cotacoes com formulas GOOGLEFINANCE:

function setupCotacoes() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName('Cotacoes');
  
  if (!sheet) {
    sheet = ss.insertSheet('Cotacoes');
  }
  
  // Header
  sheet.getRange(1, 1, 1, 5).setValues([['ticker', 'preco', 'variacao', 'variacaoPct', 'atualizado']]);
  
  // Busca tickers da aba Ativos
  const ativosSheet = ss.getSheetByName('Ativos');
  let tickers = [];
  
  if (ativosSheet && ativosSheet.getLastRow() > 1) {
    const data = ativosSheet.getRange(2, 1, ativosSheet.getLastRow() - 1, 1).getValues();
    tickers = data.map(row => row[0]).filter(t => t);
  }
  
  // Se não tem ativos, usa lista padrão
  if (tickers.length === 0) {
    tickers = ['MXRF11', 'KNCR11', 'XPML11', 'GGRC11', 'CPTS11'];
  }
  
  // Limpa dados antigos
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, 5).clear();
  }
  
  // Popula com fórmulas GOOGLEFINANCE
  tickers.forEach((ticker, i) => {
    const row = i + 2;
    const bvmfTicker = 'BVMF:' + ticker;
    
    // Coluna A: ticker
    sheet.getRange(row, 1).setValue(ticker);
    // Coluna B: preço atual
    sheet.getRange(row, 2).setFormula('=IFERROR(GOOGLEFINANCE("' + bvmfTicker + '", "price"), 0)');
    // Coluna C: variação do dia (R$)
    sheet.getRange(row, 3).setFormula('=IFERROR(GOOGLEFINANCE("' + bvmfTicker + '", "change"), 0)');
    // Coluna D: variação percentual
    sheet.getRange(row, 4).setFormula('=IFERROR(GOOGLEFINANCE("' + bvmfTicker + '", "changepct"), 0)');
    // Coluna E: data/hora da atualização
    sheet.getRange(row, 5).setFormula('=NOW()');
  });
  
  return { success: true, message: 'Aba Cotacoes criada com ' + tickers.length + ' ativos!', tickers: tickers };
}

// 5. Função para adicionar um ticker na aba de cotações (útil quando adicionar novo ativo):

function addTickerToCotacoes(ticker) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName('Cotacoes');
  
  if (!sheet) {
    setupCotacoes();
    sheet = ss.getSheetByName('Cotacoes');
  }
  
  // Verifica se já existe
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    const existing = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
    if (existing.includes(ticker.toUpperCase())) {
      return { success: true, message: 'Ticker já existe na aba Cotacoes' };
    }
  }
  
  const newRow = lastRow + 1;
  const bvmfTicker = 'BVMF:' + ticker.toUpperCase();
  
  sheet.getRange(newRow, 1).setValue(ticker.toUpperCase());
  sheet.getRange(newRow, 2).setFormula('=IFERROR(GOOGLEFINANCE("' + bvmfTicker + '", "price"), 0)');
  sheet.getRange(newRow, 3).setFormula('=IFERROR(GOOGLEFINANCE("' + bvmfTicker + '", "change"), 0)');
  sheet.getRange(newRow, 4).setFormula('=IFERROR(GOOGLEFINANCE("' + bvmfTicker + '", "changepct"), 0)');
  sheet.getRange(newRow, 5).setFormula('=NOW()');
  
  return { success: true, message: ticker + ' adicionado à aba Cotacoes' };
}


// =============================================
// RESUMO DO QUE ADICIONAR:
// =============================================
//
// No doGet, dentro do switch:
//   case 'getCotacoes':
//     result = getCotacoes();
//     break;
//   case 'setupCotacoes':
//     result = setupCotacoes();
//     break;
//
// No doPost, dentro do switch (opcional):
//   case 'addTickerCotacao':
//     result = addTickerToCotacoes(data.payload.ticker);
//     break;
//
// Funções a colar no final do script:
//   getCotacoes()
//   setupCotacoes()
//   addTickerToCotacoes(ticker)
//
// Depois: Implantar nova versão!
// =============================================
