// =============================================
// Serviço de integração com Google Sheets via Apps Script
// =============================================

import { getSettings } from './dataService'

function getAppsScriptUrl() {
  const settings = getSettings()
  return settings.sheetsUrl || ''
}

// Faz GET request ao Apps Script
async function fetchGet(action) {
  const url = getAppsScriptUrl()
  if (!url) throw new Error('Configure a URL do Apps Script nas Configurações.')

  const response = await fetch(`${url}?action=${action}`)
  if (!response.ok) throw new Error('Erro ao conectar com Google Sheets')
  return response.json()
}

// Faz POST request ao Apps Script
async function fetchPost(action, payload) {
  const url = getAppsScriptUrl()
  if (!url) throw new Error('Configure a URL do Apps Script nas Configurações.')

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action, payload }),
  })
  if (!response.ok) throw new Error('Erro ao enviar dados para Google Sheets')
  return response.json()
}

// =============================================
// LEITURA
// =============================================

export async function fetchAllFromSheets() {
  return fetchGet('getAll')
}

export async function fetchAssetsFromSheets() {
  return fetchGet('getAssets')
}

export async function fetchDividendsFromSheets() {
  return fetchGet('getDividends')
}

export async function fetchTransactionsFromSheets() {
  return fetchGet('getTransactions')
}

export async function fetchProfileFromSheets() {
  return fetchGet('getProfile')
}

export async function fetchGoalsFromSheets() {
  return fetchGet('getGoals')
}

// =============================================
// ESCRITA
// =============================================

export async function addAssetToSheets(asset) {
  return fetchPost('addAsset', asset)
}

export async function removeAssetFromSheets(ticker) {
  return fetchPost('removeAsset', { ticker })
}

export async function addTransactionToSheets(transaction) {
  return fetchPost('addTransaction', transaction)
}

export async function addDividendToSheets(dividend) {
  return fetchPost('addDividend', dividend)
}

export async function saveProfileToSheets(profile) {
  return fetchPost('saveProfile', profile)
}

export async function addGoalToSheets(goal) {
  return fetchPost('addGoal', goal)
}

export async function removeGoalFromSheets(id) {
  return fetchPost('removeGoal', { id })
}

// Sync completo - envia todos os dados locais para a planilha
export async function syncAllToSheets(data) {
  return fetchPost('syncAll', data)
}

// Setup inicial das abas
export async function setupSheets() {
  return fetchGet('setup')
}

// =============================================
// INSIGHTS
// =============================================

export async function fetchInsightsFromSheets() {
  return fetchGet('getInsights')
}

export async function addInsightToSheets(insight) {
  return fetchPost('addInsight', insight)
}

export async function addInsightsToSheets(insights) {
  return fetchPost('addInsights', insights)
}

// Verifica se a integração está configurada
export function isSheetsConfigured() {
  const settings = getSettings()
  return !!settings.sheetsUrl
}
