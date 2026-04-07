import { db } from "../lib/db";
import { portfolioPositions, wikiPages } from "../lib/db/schema";
import crypto from "crypto";

async function seed() {
  const now = new Date().toISOString();

  // ---- Portfolio Positions ----
  const positions = [
    {
      id: crypto.randomUUID().slice(0, 8),
      ticker: "SLCE3",
      companyName: "SLC Agricola",
      positionType: "long",
      entryDate: "2026-01-15",
      entryPrice: 18.5,
      currentPrice: 21.3,
      quantity: 100,
      thesis: "Safra recorde + real desvalorizado",
      thesisAuthor: "Carlos Silva",
      status: "open",
      createdAt: now,
    },
    {
      id: crypto.randomUUID().slice(0, 8),
      ticker: "SMTO3",
      companyName: "Sao Martinho",
      positionType: "long",
      entryDate: "2026-02-01",
      entryPrice: 28.4,
      currentPrice: 26.1,
      quantity: 100,
      thesis: "Recuperacao do preco do acucar",
      thesisAuthor: "Ana Lima",
      status: "open",
      createdAt: now,
    },
    {
      id: crypto.randomUUID().slice(0, 8),
      ticker: "RAIZ4",
      companyName: "Raizen",
      positionType: "short",
      entryDate: "2026-01-20",
      entryPrice: 1.2,
      currentPrice: 0.45,
      exitDate: "2026-03-10",
      exitPrice: 0.45,
      quantity: 1000,
      thesis: "E2G falhou, alavancagem critica",
      thesisAuthor: "Pedro Santos",
      status: "closed",
      createdAt: now,
    },
    {
      id: crypto.randomUUID().slice(0, 8),
      ticker: "AGXY3",
      companyName: "AgroGalaxy",
      positionType: "long",
      entryDate: "2025-11-10",
      entryPrice: 3.8,
      currentPrice: 2.1,
      quantity: 200,
      thesis: "Turnaround com novo CEO",
      thesisAuthor: "Lucas Mendes",
      status: "stopped",
      createdAt: now,
    },
  ];

  for (const pos of positions) {
    await db.insert(portfolioPositions).values(pos);
  }
  console.log(`Seeded ${positions.length} portfolio positions`);

  // ---- Wiki Pages ----
  const pages = [
    {
      id: crypto.randomUUID().slice(0, 8),
      title: "Como fazer um Valuation DCF",
      slug: "como-fazer-um-valuation-dcf",
      category: "Templates",
      authorId: "carlos-silva",
      sortOrder: 1,
      content: `# Valuation por Fluxo de Caixa Descontado (DCF)

## Introducao
O DCF e o metodo mais robusto para avaliar empresas do agronegocio. Ele projeta os fluxos de caixa futuros e os traz a valor presente usando uma taxa de desconto (WACC).

## Passo a Passo

### 1. Projetar Receitas
- Analisar historico de 5 anos de receita
- Considerar ciclos de commodities (acucar, soja, milho)
- Ajustar por sazonalidade e cambio

### 2. Projetar Custos e Margens
- COGS: custo de producao por hectare ou tonelada
- SG&A: despesas administrativas e comerciais
- Capex de manutencao vs. expansao

### 3. Calcular o FCFF (Free Cash Flow to Firm)
FCFF = EBIT x (1 - t) + Depreciacao - Capex - Variacao de Capital de Giro

### 4. Determinar o WACC
- Custo do equity: CAPM (Rf + Beta x ERP + CRP)
- Custo da divida: taxa media ponderada pos-imposto
- Estrutura de capital: D/(D+E)

### 5. Valor Terminal
- Metodo Gordon: FCF x (1+g) / (WACC - g)
- Growth rate terminal: inflacao + PIB real (2-3%)

### 6. Valor por Acao
Enterprise Value = VP dos FCFs + VP do Valor Terminal
Equity Value = EV - Divida Liquida
Valor por Acao = Equity Value / Acoes em Circulacao

## Dicas para Agro
- Sempre modelar cenarios (base, otimista, pessimista)
- Sensibilidade ao preco da commodity e ao cambio
- Considerar biologicos (ativos biologicos no balanco)`,
      createdAt: now,
      updatedAt: now,
      isPublished: 1,
    },
    {
      id: crypto.randomUUID().slice(0, 8),
      title: "Guia de Onboarding - Trainee",
      slug: "guia-de-onboarding-trainee",
      category: "Onboarding",
      authorId: "ana-lima",
      sortOrder: 2,
      content: `# Onboarding de Trainees - Liga de Mercado Financeiro

## Bem-vindo!
Este guia cobre tudo que voce precisa para comecar na Liga MF da Harven.

## Semana 1: Ambientacao
- Conhecer a estrutura da Liga (nucleos, coordenadores, projetos)
- Acesso ao Bloomberg Terminal (solicitar no lab de informatica)
- Criar conta na plataforma Harven Evaluate
- Entrar no grupo do WhatsApp e canal do Discord

## Semana 2: Fundamentos
- Completar o modulo "Introducao ao Mercado de Capitais"
- Ler o relatorio mais recente do nucleo ao qual foi alocado
- Participar da reuniao semanal da Liga

## Semana 3-4: Imersao
- Receber mentoria de um membro senior
- Comecar a contribuir no projeto do nucleo
- Primeira apresentacao interna (5 min sobre um tema do nucleo)

## Ferramentas Obrigatorias
| Ferramenta | Uso | Acesso |
|-----------|-----|--------|
| Bloomberg | Dados de mercado | Lab - solicitar login |
| Excel/Sheets | Modelagem financeira | Pessoal |
| Harven Evaluate | Avaliacoes e ranking | Link de convite |
| Economatica | Dados BR | Lab |

## Compromissos Semanais
- Reuniao da Liga: quartas 19h
- Reuniao do nucleo: definido por cada coordenador
- Entrega semanal: mini-relatorio ou contribuicao ao projeto`,
      createdAt: now,
      updatedAt: now,
      isPublished: 1,
    },
    {
      id: crypto.randomUUID().slice(0, 8),
      title: "Processo de Selecao de Acoes",
      slug: "processo-de-selecao-de-acoes",
      category: "Processos",
      authorId: "pedro-santos",
      sortOrder: 3,
      content: `# Processo de Selecao de Acoes para a Carteira

## Visao Geral
A selecao de acoes segue um pipeline de 4 etapas com criterios quantitativos e qualitativos.

## Etapa 1: Screening Quantitativo
Filtros aplicados no universo B3:
- Liquidez media diaria > R$ 1M
- Market cap > R$ 500M
- ROE > custo de capital (CAPM)
- Divida liquida / EBITDA < 3x
- Crescimento de receita > inflacao (3 anos)

## Etapa 2: Analise Fundamentalista
Para cada empresa que passou no screening:
- Analise setorial (Porter, SWOT)
- Modelagem financeira (DCF + multiplos)
- Governance check (Novo Mercado, tag along, free float)
- ESG score (ambiental, social, governanca)

## Etapa 3: Defesa de Tese
- Membro apresenta tese para a Liga (20 min + Q&A)
- Votacao: aprovacao por maioria simples
- Registro formal da tese (ticker, preco-alvo, prazo, riscos)

## Etapa 4: Gestao da Posicao
- Stop-loss: -15% do preco de entrada (revisavel)
- Take-profit: quando atingir preco-alvo ou tese se materializar
- Revisao trimestral: revalidar tese apos resultados
- Registro de saida: documentar razao e resultado

## Criterios de Veto (qualquer um bloqueia)
- Empresa em recuperacao judicial
- Fraude contabil comprovada
- Liquidez insuficiente para saida
- Conflito de interesse de membro`,
      createdAt: now,
      updatedAt: now,
      isPublished: 1,
    },
    {
      id: crypto.randomUUID().slice(0, 8),
      title: "Template de Relatorio Equity Research",
      slug: "template-de-relatorio-equity-research",
      category: "Templates",
      authorId: "julia-costa",
      sortOrder: 4,
      content: `# Template de Relatorio - Equity Research

## Estrutura Padrao

### 1. Capa
- Ticker e nome da empresa
- Recomendacao (Compra / Neutro / Venda)
- Preco-alvo e upside/downside
- Data e autor

### 2. Sumario Executivo (1 pagina)
- Tese de investimento em 3-5 bullets
- Principais catalisadores
- Principais riscos
- Metricas-chave (P/E, EV/EBITDA, dividend yield)

### 3. Analise Setorial
- Tamanho do mercado e crescimento
- Dinamica competitiva
- Regulacao relevante
- Tendencias macro que impactam o setor

### 4. Analise da Empresa
- Modelo de negocios
- Vantagens competitivas (moat)
- Management track record
- Historico operacional e financeiro

### 5. Projecoes Financeiras
- DRE projetada (3-5 anos)
- Balanco projetado
- Fluxo de caixa projetado
- Premissas detalhadas

### 6. Valuation
- DCF (cenario base, otimista, pessimista)
- Multiplos comparaveis (peers)
- Football field chart

### 7. Riscos
- Riscos operacionais
- Riscos de mercado
- Riscos regulatorios
- Mitigantes identificados

### 8. Apendice
- Tabelas detalhadas
- Glossario de termos
- Fontes e referencias`,
      createdAt: now,
      updatedAt: now,
      isPublished: 1,
    },
    {
      id: crypto.randomUUID().slice(0, 8),
      title: "Como usar o Bloomberg Terminal",
      slug: "como-usar-o-bloomberg-terminal",
      category: "Processos",
      authorId: "lucas-mendes",
      sortOrder: 5,
      content: `# Bloomberg Terminal - Guia de Referencia

## Comandos Essenciais

### Navegacao Basica
- Digite o ticker + [EQUITY] + [GO] para abrir a pagina da empresa
- [HELP] + [HELP] para chat com suporte
- [GRAB] para capturar tela

### Funcoes Mais Usadas
| Comando | Funcao |
|---------|--------|
| DES | Descricao da empresa |
| FA | Analise financeira (demonstracoes) |
| GIP | Grafico intraday |
| GP | Grafico historico |
| RV | Peers/comparaveis do setor |
| WACC | Custo medio ponderado de capital |
| DDM | Modelo de dividendos descontados |
| DRSK | Risco de credito |
| SPLC | Supply chain da empresa |
| BI | Bloomberg Intelligence (relatorios) |

### Para Agro Especificamente
| Comando | Funcao |
|---------|--------|
| GRNI | Indice de graos |
| BCOM | Bloomberg Commodity Index |
| WCRS | Precos de commodities em tempo real |
| AGRI | Dashboard de agricultura |
| GLCO | Custos globais de commodities |

### Excel Add-in
- BDH: dados historicos
- BDP: dados pontuais
- BDS: dados em bulk (lista)
- Exemplo: =BDP("SLCE3 BZ Equity","PX_LAST")

## Dicas
- Use [SECF] para buscar titulos
- [PORT] para gestao de portfolio
- [NEWS] filtrado por setor para acompanhar noticias
- Salve telas favoritas com [PDFB]`,
      createdAt: now,
      updatedAt: now,
      isPublished: 1,
    },
    {
      id: crypto.randomUUID().slice(0, 8),
      title: "Guia de Apresentacao para Competicoes",
      slug: "guia-de-apresentacao-para-competicoes",
      category: "Processos",
      authorId: "ana-lima",
      sortOrder: 6,
      content: `# Guia de Apresentacao para Competicoes de Cases

## Estrutura do Deck (15-20 slides)

### Bloco 1: Contexto (3-4 slides)
- Slide 1: Titulo + equipe
- Slide 2: Entendimento do problema / contexto macro
- Slide 3: Framework de analise adotado
- Slide 4: Dados-chave do setor

### Bloco 2: Analise (6-8 slides)
- Analise quantitativa (dados, graficos, modelagem)
- Analise qualitativa (estrategia, governance, ESG)
- Comparacao com peers
- Cenarios (base, otimista, pessimista)

### Bloco 3: Recomendacao (3-4 slides)
- Recomendacao clara e objetiva
- Preco-alvo e metodologia
- Catalisadores e timeline
- Riscos e mitigantes

### Bloco 4: Fechamento (2 slides)
- Resumo em 1 slide (a "cola" para os jurados)
- Slide de contato / agradecimento

## Boas Praticas de Design
- Fundo escuro, texto claro (contraste alto)
- Maximo 6 bullets por slide
- 1 grafico por slide (nao sobrecarregar)
- Fonte minima 18pt
- Cores consistentes (usar paleta da Liga)

## Defesa Oral
- Ensaiar pelo menos 3x com cronometro
- Dividir falas igualmente entre membros
- Antecipar 10 perguntas mais provaveis
- Ter backup slides para perguntas tecnicas
- Tom: confiante mas nao arrogante

## Erros Comuns
- Excesso de texto nos slides
- Falar rapido demais (ansiedade)
- Nao responder a pergunta feita (tangenciar)
- Nao ter dominio dos numeros do modelo
- Ignorar riscos ou minimizar incertezas`,
      createdAt: now,
      updatedAt: now,
      isPublished: 1,
    },
  ];

  for (const page of pages) {
    await db.insert(wikiPages).values(page);
  }
  console.log(`Seeded ${pages.length} wiki pages`);

  console.log("Done!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
