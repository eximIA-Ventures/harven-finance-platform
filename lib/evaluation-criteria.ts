// ============================================================================
// CRITÉRIOS DE AVALIAÇÃO HUMANA — Case Study
// ============================================================================
// Baseado em: Harvard Case Method, CFA Research Challenge scoring,
// e briefing PS Liga MF Harven.
// O avaliador humano avalia TODOS os critérios abaixo com nota 1-10.
// O sistema calcula automaticamente usando os pesos definidos.
// ============================================================================

export interface EvalCriterion {
  id: string;
  section: string;
  sectionWeight: number;
  name: string;
  weight: number; // within section
  description: string;
  guide: string; // what to look for
  rubric: {
    "9-10": string;
    "7-8": string;
    "5-6": string;
    "3-4": string;
    "1-2": string;
  };
}

export const CASE_CRITERIA: EvalCriterion[] = [
  // ── SEÇÃO 1: Compreensão do Problema (15%) ──
  {
    id: "compreensao",
    section: "Compreensão do Problema",
    sectionWeight: 0.15,
    name: "Entendimento do contexto",
    weight: 1.0,
    description: "O candidato entendeu o problema central? Identificou o que realmente importa?",
    guide: "Procure: identificação correta do problema central, compreensão do setor, reconhecimento de nuances (não apenas repetir o enunciado).",
    rubric: {
      "9-10": "Compreensão profunda. Identifica nuances do setor e do momento da empresa. Faz conexões não-óbvias.",
      "7-8": "Boa compreensão. Identifica os pontos principais. Pode perder uma nuance menor.",
      "5-6": "Superficial. Repete informações do enunciado sem agregar interpretação própria.",
      "3-4": "Parcial. Confunde elementos ou foca em aspectos irrelevantes.",
      "1-2": "Não demonstra compreensão. Resposta genérica que poderia servir para qualquer empresa.",
    },
  },

  // ── SEÇÃO 2: Qualidade da Análise (25%) ──
  {
    id: "uso-dados",
    section: "Qualidade da Análise",
    sectionWeight: 0.25,
    name: "Uso correto dos dados",
    weight: 0.4,
    description: "Usou os dados fornecidos corretamente? Calculou indicadores relevantes?",
    guide: "Procure: uso de dados dos exhibits, cálculos corretos (margens, endividamento, crescimento), comparação com benchmarks.",
    rubric: {
      "9-10": "Usa todos os dados relevantes, calcula indicadores corretos, compara com peers ou benchmarks.",
      "7-8": "Usa a maioria dos dados. Pode ter 1 erro menor ou deixar de usar 1 indicador relevante.",
      "5-6": "Usa dados básicos sem aprofundar. Não calcula indicadores próprios.",
      "3-4": "Poucos dados utilizados. Erros conceituais (confunde receita com lucro, etc).",
      "1-2": "Ignora os dados fornecidos ou os interpreta de forma completamente errada.",
    },
  },
  {
    id: "interpretacao",
    section: "Qualidade da Análise",
    sectionWeight: 0.25,
    name: "Interpretação e insight",
    weight: 0.35,
    description: "As conclusões tiradas dos dados fazem sentido? Há insight além do óbvio?",
    guide: "Procure: análise que vai além de descrever números — explica causas, identifica tendências, faz conexões.",
    rubric: {
      "9-10": "Interpreta tendências, identifica causas-raiz, conecta dados com contexto macro e setorial.",
      "7-8": "Boa interpretação com gaps menores. Identifica as tendências principais.",
      "5-6": "Interpretação superficial. Descreve os números sem explicar o porquê.",
      "3-4": "Interpretação incorreta ou ausente. Tira conclusões que os dados não suportam.",
      "1-2": "Não interpreta. Apenas lista números sem qualquer análise.",
    },
  },
  {
    id: "profundidade",
    section: "Qualidade da Análise",
    sectionWeight: 0.25,
    name: "Profundidade da análise",
    weight: 0.25,
    description: "Foi além do superficial? Cruzou informações de diferentes fontes?",
    guide: "Procure: análise multicamada (cruza financeiro com operacional, macro com micro), pesquisa adicional.",
    rubric: {
      "9-10": "Análise multicamada. Cruza dados de diferentes fontes. Pesquisou informações adicionais.",
      "7-8": "Boa profundidade em pelo menos 1-2 dimensões. Vai além do material fornecido.",
      "5-6": "Cumpre o básico. Analisa o que foi pedido sem ir além.",
      "3-4": "Raso. Aborda os tópicos de forma genérica.",
      "1-2": "Não há análise real. Texto sem substância.",
    },
  },

  // ── SEÇÃO 3: Raciocínio e Tese (25%) ──
  {
    id: "coerencia-tese",
    section: "Raciocínio e Tese",
    sectionWeight: 0.25,
    name: "Coerência da tese",
    weight: 0.5,
    description: "A conclusão faz sentido? Os argumentos sustentam a tese? Há contradições internas?",
    guide: "Procure: tese clara (comprar/vender/manter), argumentos que sustentam a conclusão, ausência de contradições.",
    rubric: {
      "9-10": "Tese clara, bem fundamentada e logicamente consistente. Cada argumento sustenta a conclusão.",
      "7-8": "Tese defensável. Pode ter 1 ponto fraco na argumentação, mas a estrutura geral é sólida.",
      "5-6": "Lógica aceitável mas com gaps. Conclusão não decorre totalmente da análise.",
      "3-4": "Contradições internas. Conclusão parece arbitrária ou desconectada dos dados.",
      "1-2": "Sem lógica. Conclusão jogada sem fundamentação. Achismo puro.",
    },
  },
  {
    id: "originalidade",
    section: "Raciocínio e Tese",
    sectionWeight: 0.25,
    name: "Originalidade e criatividade",
    weight: 0.5,
    description: "Trouxe algo que não é óbvio? Fez conexões criativas? Pensou diferente?",
    guide: "Procure: insights que surpreendem, conexões não-óbvias, perspectivas que os dados não diziam explicitamente.",
    rubric: {
      "9-10": "Traz insights que vão além dos dados. Faz conexões inesperadas. Surpreende o avaliador.",
      "7-8": "Vai além do óbvio em pelo menos 1-2 pontos. Mostra pensamento independente.",
      "5-6": "Cumpre o pedido sem ir além. Responde às perguntas sem perspectiva própria.",
      "3-4": "Repete informações do enunciado com outras palavras. Sem valor agregado.",
      "1-2": "Claramente copiado ou gerado sem edição. Zero contribuição original.",
    },
  },

  // ── SEÇÃO 4: Riscos (15%) ──
  {
    id: "identificacao-riscos",
    section: "Identificação de Riscos",
    sectionWeight: 0.15,
    name: "Mapeamento de riscos",
    weight: 0.5,
    description: "Identificou riscos relevantes? Considerou cenários adversos?",
    guide: "Procure: riscos macro (Selic, câmbio), setoriais (concorrência, clima) e específicos (governança, dívida). Não aceite riscos genéricos.",
    rubric: {
      "9-10": "Mapeia riscos macro, setoriais E específicos. Diferencia probabilidade de impacto. Propõe monitoramento.",
      "7-8": "Identifica riscos relevantes. Pode faltar profundidade em 1 categoria.",
      "5-6": "Riscos genéricos ('risco de mercado', 'crise') sem conectar à empresa específica.",
      "3-4": "Riscos superficiais. Apenas 1 risco mencionado de forma vaga.",
      "1-2": "Não identifica riscos ou diz que 'não há riscos relevantes'.",
    },
  },
  {
    id: "mitigantes",
    section: "Identificação de Riscos",
    sectionWeight: 0.15,
    name: "Planos de mitigação",
    weight: 0.5,
    description: "Propôs formas concretas de lidar com os riscos identificados?",
    guide: "Procure: mitigantes específicos (hedge, diversificação, plano B), não apenas 'monitorar a situação'.",
    rubric: {
      "9-10": "Mitigantes concretos e acionáveis para cada risco. Propõe gatilhos de ação.",
      "7-8": "Propostas razoáveis de mitigação para os riscos principais.",
      "5-6": "Mitigantes genéricos ('acompanhar de perto'). Sem ação concreta.",
      "3-4": "Sem plano de mitigação real. Apenas identifica riscos sem propor solução.",
      "1-2": "Ignora completamente a necessidade de mitigação.",
    },
  },

  // ── SEÇÃO 5: Apresentação e Comunicação (20%) ──
  {
    id: "estrutura",
    section: "Apresentação e Comunicação",
    sectionWeight: 0.20,
    name: "Estrutura e organização",
    weight: 0.4,
    description: "O texto está bem organizado? Tem seções claras? É fácil de seguir?",
    guide: "Procure: seções lógicas, fluxo narrativo (problema → análise → conclusão), uso de headings.",
    rubric: {
      "9-10": "Estrutura impecável. Seções claras com fluxo lógico. Gráficos/tabelas quando pertinente.",
      "7-8": "Bem organizado. Texto claro. Pode ter 1-2 pontos de formatação a melhorar.",
      "5-6": "Organização aceitável. Texto por vezes confuso. Falta estrutura em partes.",
      "3-4": "Mal organizado. Difícil de seguir. Parágrafos longos sem estrutura.",
      "1-2": "Caótico. Sem estrutura identificável. Impossível seguir o raciocínio.",
    },
  },
  {
    id: "clareza-escrita",
    section: "Apresentação e Comunicação",
    sectionWeight: 0.20,
    name: "Clareza de escrita",
    weight: 0.35,
    description: "A linguagem é clara e profissional? Sem erros graves?",
    guide: "Procure: linguagem profissional (não informal), ausência de erros graves de português, concisão.",
    rubric: {
      "9-10": "Linguagem profissional e concisa. Sem erros. Agradável de ler.",
      "7-8": "Texto claro com 1-2 erros menores. Linguagem adequada.",
      "5-6": "Texto compreensível mas com erros ou linguagem informal demais.",
      "3-4": "Erros frequentes que comprometem a leitura. Prolixo.",
      "1-2": "Erros graves. Incompreensível em partes.",
    },
  },
  {
    id: "uso-visual",
    section: "Apresentação e Comunicação",
    sectionWeight: 0.20,
    name: "Uso de elementos visuais",
    weight: 0.25,
    description: "Usou tabelas, gráficos ou outros elementos visuais para reforçar a análise?",
    guide: "Procure: tabelas de dados, gráficos de tendência, quadros comparativos. Não é obrigatório, mas diferencia.",
    rubric: {
      "9-10": "Excelente uso de visuais. Tabelas e gráficos que reforçam a análise. Profissional.",
      "7-8": "Bom uso de pelo menos 1-2 elementos visuais pertinentes.",
      "5-6": "Texto puro, sem visuais. Adequado mas perde oportunidade de clareza.",
      "3-4": "Visuais mal feitos ou irrelevantes.",
      "1-2": "Nenhum esforço visual. Bloco de texto corrido.",
    },
  },
];

// ============================================================================
// CRITÉRIOS DE AVALIAÇÃO HUMANA — Pitch
// ============================================================================
export const PITCH_CRITERIA: EvalCriterion[] = [
  {
    id: "dominio-conteudo",
    section: "Domínio do Conteúdo",
    sectionWeight: 0.30,
    name: "Conhecimento demonstrado",
    weight: 1.0,
    description: "O candidato domina o que escreveu? Consegue explicar sem ler?",
    guide: "Procure: capacidade de explicar sem consultar notas, trazer dados de memória, responder perguntas com profundidade.",
    rubric: {
      "9-10": "Domina completamente. Explica sem consultar notas. Vai além do que escreveu.",
      "7-8": "Bom domínio. Consulta notas ocasionalmente. Responde bem à maioria das perguntas.",
      "5-6": "Domínio parcial. Depende muito das notas. Hesita em perguntas fora do script.",
      "3-4": "Fraco. Lê o case. Forte indicativo de que NÃO escreveu o material.",
      "1-2": "Não domina. Contradiz o que está escrito.",
    },
  },
  {
    id: "comunicacao-oral",
    section: "Comunicação Oral",
    sectionWeight: 0.20,
    name: "Clareza e storytelling",
    weight: 1.0,
    description: "Explica conceitos complexos de forma compreensível? É conciso?",
    guide: "Procure: narrativa clara, gestão de tempo, analogias quando necessário, concisão.",
    rubric: {
      "9-10": "Comunicação excelente. Storytelling claro. Tempo bem gerenciado. Usa analogias.",
      "7-8": "Boa comunicação. Claro na maior parte. Pode se perder em 1 momento.",
      "5-6": "Às vezes confuso ou prolixo. Perde o fio da narrativa.",
      "3-4": "Difícil de seguir. Desorganizado. Ultrapassa muito o tempo.",
      "1-2": "Incoerente. Não consegue transmitir a mensagem.",
    },
  },
  {
    id: "defesa-tese",
    section: "Capacidade de Defesa",
    sectionWeight: 0.25,
    name: "Defesa sob pressão",
    weight: 1.0,
    description: "Quando questionado, defende com argumentos ou recua?",
    guide: "Procure: defesa com dados e lógica, admite limitações quando pertinente, pensa em tempo real, não inventa.",
    rubric: {
      "9-10": "Defende com dados e lógica. Admite limitações e reposiciona. Pensa em tempo real.",
      "7-8": "Boa defesa. Responde bem à maioria das objeções. Pode vacilar em 1 ponto.",
      "5-6": "Repete argumentos do case sem adaptar. Desconfortável quando pressionado.",
      "3-4": "Abandona argumentos rapidamente. Muda de opinião a cada pergunta. Ou teimosia sem dados.",
      "1-2": "Não defende. Congela. Diz 'não sei' a tudo. Ou inventa dados.",
    },
  },
  {
    id: "profundidade-tecnica",
    section: "Profundidade Técnica",
    sectionWeight: 0.15,
    name: "Vocabulário e conceitos",
    weight: 1.0,
    description: "Usa vocabulário financeiro corretamente? Demonstra entendimento?",
    guide: "Procure: uso correto de termos (EBITDA, P/L, alavancagem), distinção entre conceitos relacionados.",
    rubric: {
      "9-10": "Vocabulário preciso. Sabe a diferença na prática, não só na teoria. Usa conceitos corretamente.",
      "7-8": "Boa profundidade. Pode errar 1 termo. Base sólida.",
      "5-6": "Usa termos corretamente mas sem demonstrar compreensão profunda.",
      "3-4": "Confunde conceitos (usa EBITDA e lucro bruto como sinônimos, por exemplo).",
      "1-2": "Usa termos errados ou não usa vocabulário técnico nenhum.",
    },
  },
  {
    id: "postura-confianca",
    section: "Postura e Confiança",
    sectionWeight: 0.10,
    name: "Presença e segurança",
    weight: 1.0,
    description: "Transmite segurança? Mantém compostura?",
    guide: "Procure: segurança sem arrogância, contato visual, linguagem corporal aberta, nervosismo controlado.",
    rubric: {
      "9-10": "Presença forte. Seguro sem ser arrogante. Olha para a câmera. Linguagem corporal aberta.",
      "7-8": "Confiante na maior parte. Nervosismo normal e controlado.",
      "5-6": "Visivelmente nervoso. Lê muito das notas. Evita contato visual.",
      "3-4": "Muito nervoso. Evita câmera. Linguagem corporal fechada.",
      "1-2": "Desconfortável ao ponto de comprometer a comunicação.",
    },
  },
];

// Helper: get unique sections with their criteria
export function getSections(criteria: EvalCriterion[]) {
  const sections: Array<{
    name: string;
    weight: number;
    criteria: EvalCriterion[];
  }> = [];

  for (const c of criteria) {
    let section = sections.find((s) => s.name === c.section);
    if (!section) {
      section = { name: c.section, weight: c.sectionWeight, criteria: [] };
      sections.push(section);
    }
    section.criteria.push(c);
  }

  return sections;
}

// Calculate weighted score from criterion scores
export function calculateScore(
  criteria: EvalCriterion[],
  scores: Record<string, number>
): { sectionScores: Record<string, number>; finalScore: number } {
  const sections = getSections(criteria);
  const sectionScores: Record<string, number> = {};
  let finalScore = 0;

  for (const section of sections) {
    let sectionTotal = 0;
    for (const c of section.criteria) {
      const score = scores[c.id] ?? 0;
      sectionTotal += score * c.weight;
    }
    sectionScores[section.name] = Math.round(sectionTotal * 100) / 100;
    finalScore += sectionTotal * section.weight;
  }

  return {
    sectionScores,
    finalScore: Math.round(finalScore * 100) / 100,
  };
}
