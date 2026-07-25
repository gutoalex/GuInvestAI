// =============================================
// ADICIONAR AO SEU APPS SCRIPT EXISTENTE
// =============================================

// 1. Adicione na função setupSheets() (dentro dela, junto com as outras abas):

/*
  // Aba Insights
  let insights = ss.getSheetByName('Insights');
  if (!insights) {
    insights = ss.insertSheet('Insights');
  }
  if (insights.getLastRow() === 0) {
    insights.appendRow(['id', 'data', 'tipo', 'conteudo', 'categoria', 'createdAt']);
  }
*/

// 2. Adicione no switch do doGet (case 'getInsights'):
/*
      case 'getInsights':
        result = getInsights();
        break;
*/

// 3. Adicione no switch do doPost (case 'addInsight' e 'addInsights'):
/*
      case 'addInsight':
        result = addInsight(data.payload);
        break;
      case 'addInsights':
        result = addInsights(data.payload);
        break;
      case 'clearInsights':
        result = clearInsights();
        break;
*/

// 4. Adicione estas funções no final do script:

function getInsights() {
  const sheet = getSpreadsheet().getSheetByName('Insights');
  if (!sheet || sheet.getLastRow() <= 1) return [];
  
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).getValues();
  return data.map(row => ({
    id: row[0],
    data: row[1],
    tipo: row[2],
    conteudo: row[3],
    categoria: row[4],
    createdAt: row[5],
  }));
}

function addInsight(insight) {
  const sheet = getSpreadsheet().getSheetByName('Insights');
  if (!sheet) {
    const ss = getSpreadsheet();
    const newSheet = ss.insertSheet('Insights');
    newSheet.appendRow(['id', 'data', 'tipo', 'conteudo', 'categoria', 'createdAt']);
  }
  const targetSheet = getSpreadsheet().getSheetByName('Insights');
  const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
  
  targetSheet.appendRow([
    id,
    insight.data || new Date().toISOString().split('T')[0],
    insight.tipo || 'geral',
    insight.conteudo,
    insight.categoria || '',
    new Date().toISOString(),
  ]);
  
  return { success: true, id: id };
}

function addInsights(insights) {
  const sheet = getSpreadsheet().getSheetByName('Insights');
  if (!sheet) {
    const ss = getSpreadsheet();
    const newSheet = ss.insertSheet('Insights');
    newSheet.appendRow(['id', 'data', 'tipo', 'conteudo', 'categoria', 'createdAt']);
  }
  const targetSheet = getSpreadsheet().getSheetByName('Insights');
  
  const ids = [];
  insights.forEach(insight => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    targetSheet.appendRow([
      id,
      insight.data || new Date().toISOString().split('T')[0],
      insight.tipo || 'geral',
      insight.conteudo,
      insight.categoria || '',
      new Date().toISOString(),
    ]);
    ids.push(id);
  });
  
  return { success: true, count: ids.length };
}

function clearInsights() {
  const sheet = getSpreadsheet().getSheetByName('Insights');
  if (sheet && sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).clear();
  }
  return { success: true };
}
