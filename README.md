# 🤖 GuInvestAI - Assistente Financeiro com IA

Aplicativo web pessoal para acompanhamento e análise de investimentos com IA (Gemini).

## Funcionalidades

- 📊 **Dashboard** - Visão geral do patrimônio e carteira
- 💼 **Carteira** - Cadastro e gestão de ativos (FIIs, Ações, ETFs)
- 💰 **Dividendos** - Controle de proventos recebidos
- 📅 **Calendário** - Eventos de pagamento
- 🤖 **Chat com IA** - Converse com o Gemini sobre seus investimentos
- 📷 **Análise de Imagem** - Extraia dados de prints de extratos
- 📊 **Comparador** - Compare ativos com análise da IA
- 🎯 **Metas** - Defina e acompanhe objetivos financeiros
- 🧮 **Simulador** - Projeções de patrimônio e dividendos
- ⚙️ **Configurações** - Tema, perfil, backup

## Tecnologias

- React + Vite
- TailwindCSS
- Chart.js
- Google Gemini API
- LocalStorage (dados)
- GitHub Pages (hospedagem)

## Como Usar

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Gerar build para produção
npm run build

# Deploy no GitHub Pages
npm run deploy
```

## Configuração

1. Obtenha uma API Key do Gemini em: https://aistudio.google.com/apikey
2. Abra o app e vá em Configurações
3. Cole sua API Key
4. Pronto! O chat e as análises de IA estarão disponíveis

## Backup

Os dados são salvos localmente no navegador (LocalStorage). Use a função de Export/Import nas Configurações para fazer backup.
