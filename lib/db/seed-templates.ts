// Pre-built evaluation templates for quick setup
export type EvaluationTemplate = {
  name: string;
  type: string;
  phases: {
    name: string;
    slug: string;
    weight: number;
    sections: {
      name: string;
      description: string;
      weight: number;
      criteria: {
        name: string;
        description: string;
        weight: number;
        rubric: {
          exceptional: string;
          good: string;
          basic: string;
          insufficient: string;
          poor: string;
        };
      }[];
    }[];
  }[];
  cutoffs: { label: string; minScore: number; action: string }[];
};

export const templates: Record<string, EvaluationTemplate> = {
  "case-study": {
    name: "Case Study",
    type: "case-study",
    phases: [
      {
        name: "Case Study",
        slug: "case",
        weight: 0.6,
        sections: [
          {
            name: "Compreensão do Problema",
            description: "Entendeu o contexto? Identificou o que realmente importa?",
            weight: 0.1,
            criteria: [
              {
                name: "Compreensão contextual",
                description: "Demonstra compreensão profunda do contexto e nuances",
                weight: 1.0,
                rubric: {
                  exceptional: "Compreensão profunda. Identifica nuances do setor e do momento da empresa.",
                  good: "Boa compreensão. Identifica os pontos principais.",
                  basic: "Superficial. Repete informações sem agregar interpretação.",
                  insufficient: "Parcial. Confunde elementos ou foca em aspectos irrelevantes.",
                  poor: "Não demonstra compreensão. Resposta genérica.",
                },
              },
            ],
          },
          {
            name: "Qualidade da Análise Financeira",
            description: "Usou dados corretamente? Calculou indicadores relevantes?",
            weight: 0.25,
            criteria: [
              {
                name: "Uso de dados",
                description: "Candidato usou os dados fornecidos corretamente?",
                weight: 0.3,
                rubric: {
                  exceptional: "Usa todos os dados relevantes, calcula indicadores corretos, compara com benchmarks.",
                  good: "Usa a maioria dos dados. Pode ter 1 erro menor.",
                  basic: "Usa dados básicos sem aprofundar.",
                  insufficient: "Poucos dados utilizados. Erros conceituais.",
                  poor: "Ignora os dados ou interpreta errado.",
                },
              },
              {
                name: "Interpretação dos resultados",
                description: "As conclusões tiradas dos dados fazem sentido?",
                weight: 0.4,
                rubric: {
                  exceptional: "Interpreta tendências, identifica causas, conecta com contexto.",
                  good: "Boa interpretação com gaps menores.",
                  basic: "Interpretação superficial.",
                  insufficient: "Interpretação incorreta ou ausente.",
                  poor: "Não interpreta, apenas lista números.",
                },
              },
              {
                name: "Profundidade da análise",
                description: "Foi além do superficial?",
                weight: 0.3,
                rubric: {
                  exceptional: "Análise multicamada, cruza dados de diferentes fontes.",
                  good: "Boa profundidade em pelo menos 1 dimensão.",
                  basic: "Cumpre o básico.",
                  insufficient: "Raso.",
                  poor: "Não há análise real.",
                },
              },
            ],
          },
          {
            name: "Raciocínio e Lógica da Tese",
            description: "A conclusão faz sentido? Os argumentos se sustentam?",
            weight: 0.25,
            criteria: [
              {
                name: "Coerência da tese",
                description: "A tese é logicamente consistente?",
                weight: 0.5,
                rubric: {
                  exceptional: "Tese clara, bem fundamentada. Cada argumento sustenta a conclusão.",
                  good: "Tese defensável. Pode ter 1 ponto fraco.",
                  basic: "Lógica aceitável mas com gaps.",
                  insufficient: "Contradições internas. Conclusão arbitrária.",
                  poor: "Sem lógica. Achismo puro.",
                },
              },
              {
                name: "Originalidade",
                description: "Trouxe insights além do óbvio?",
                weight: 0.5,
                rubric: {
                  exceptional: "Insights que vão além dos dados. Conexões não-óbvias.",
                  good: "Vai além do óbvio em pelo menos 1-2 pontos.",
                  basic: "Cumpre o pedido sem ir além.",
                  insufficient: "Repete informações com outras palavras.",
                  poor: "Zero valor agregado.",
                },
              },
            ],
          },
          {
            name: "Identificação de Riscos",
            description: "Capacidade de identificar e tratar riscos",
            weight: 0.15,
            criteria: [
              {
                name: "Mapeamento de riscos",
                description: "Mapeou riscos macro, setoriais e específicos?",
                weight: 0.5,
                rubric: {
                  exceptional: "Mapeia riscos macro, setoriais E específicos. Diferencia probabilidade de impacto.",
                  good: "Identifica riscos relevantes. Pode faltar profundidade em 1 categoria.",
                  basic: "Riscos genéricos sem conectar à empresa específica.",
                  insufficient: "Riscos superficiais ou ausentes.",
                  poor: "Não identifica riscos.",
                },
              },
              {
                name: "Planos de mitigação",
                description: "Propôs formas de lidar com os riscos?",
                weight: 0.5,
                rubric: {
                  exceptional: "Propõe mitigantes concretos e monitoramento.",
                  good: "Propostas razoáveis de mitigação.",
                  basic: "Mitigantes genéricos.",
                  insufficient: "Sem plano de mitigação.",
                  poor: "Ignora completamente.",
                },
              },
            ],
          },
          {
            name: "Clareza e Estrutura",
            description: "Texto claro? Bem organizado?",
            weight: 0.25,
            criteria: [
              {
                name: "Organização e clareza",
                description: "Estrutura, linguagem e formatação",
                weight: 1.0,
                rubric: {
                  exceptional: "Excelente. Bem organizado, linguagem profissional, gráficos quando pertinentes.",
                  good: "Boa organização. Texto claro. 1-2 erros menores.",
                  basic: "Aceitável. Texto por vezes confuso.",
                  insufficient: "Mal organizado. Difícil de seguir.",
                  poor: "Caótico. Sem estrutura identificável.",
                },
              },
            ],
          },
        ],
      },
      {
        name: "Pitch",
        slug: "pitch",
        weight: 0.4,
        sections: [
          {
            name: "Domínio do Conteúdo",
            description: "Entende o que escreveu? Responde perguntas com segurança?",
            weight: 0.3,
            criteria: [
              {
                name: "Domínio demonstrado",
                description: "Domina completamente o conteúdo apresentado",
                weight: 1.0,
                rubric: {
                  exceptional: "Domina completamente. Explica sem consultar notas. Vai além do que escreveu.",
                  good: "Bom domínio. Consulta notas ocasionalmente.",
                  basic: "Domínio parcial. Depende muito das notas.",
                  insufficient: "Domínio fraco. Lê o case. Forte indicativo de que NÃO escreveu.",
                  poor: "Não domina. Contradiz o que está escrito.",
                },
              },
            ],
          },
          {
            name: "Clareza de Comunicação",
            description: "Explica conceitos complexos de forma compreensível?",
            weight: 0.2,
            criteria: [
              {
                name: "Comunicação",
                description: "Storytelling, clareza e gestão de tempo",
                weight: 1.0,
                rubric: {
                  exceptional: "Comunicação excelente. Storytelling claro. Tempo bem gerenciado.",
                  good: "Boa comunicação. Claro na maior parte.",
                  basic: "Às vezes confuso ou prolixo.",
                  insufficient: "Difícil de seguir. Desorganizado.",
                  poor: "Incoerente.",
                },
              },
            ],
          },
          {
            name: "Capacidade de Defesa",
            description: "Quando questionado, defende com argumentos ou recua?",
            weight: 0.25,
            criteria: [
              {
                name: "Defesa da tese",
                description: "Capacidade de defender posição sob pressão",
                weight: 1.0,
                rubric: {
                  exceptional: "Defende com dados e lógica. Admite limitações. Pensa em tempo real.",
                  good: "Boa defesa. Responde bem à maioria das objeções.",
                  basic: "Repete argumentos do case sem adaptar.",
                  insufficient: "Abandona argumentos rapidamente. Muda de opinião a cada pergunta.",
                  poor: "Não defende. Congela. Inventa dados.",
                },
              },
            ],
          },
          {
            name: "Profundidade Técnica",
            description: "Usa vocabulário financeiro corretamente?",
            weight: 0.15,
            criteria: [
              {
                name: "Vocabulário e conceitos",
                description: "Precisão técnica no uso de termos e conceitos",
                weight: 1.0,
                rubric: {
                  exceptional: "Vocabulário preciso. Usa conceitos corretamente no contexto.",
                  good: "Boa profundidade. Pode errar 1 termo.",
                  basic: "Usa termos corretamente mas sem compreensão profunda.",
                  insufficient: "Confunde conceitos.",
                  poor: "Usa termos errados ou não usa nenhum.",
                },
              },
            ],
          },
          {
            name: "Postura e Confiança",
            description: "Transmite segurança? Mantém compostura?",
            weight: 0.1,
            criteria: [
              {
                name: "Presença",
                description: "Segurança, linguagem corporal, controle emocional",
                weight: 1.0,
                rubric: {
                  exceptional: "Presença forte. Seguro sem ser arrogante.",
                  good: "Confiante na maior parte. Nervosismo controlado.",
                  basic: "Visivelmente nervoso. Lê muito das notas.",
                  insufficient: "Muito nervoso. Evita câmera.",
                  poor: "Desconfortável ao ponto de comprometer a comunicação.",
                },
              },
            ],
          },
        ],
      },
    ],
    cutoffs: [
      { label: "Destaque", minScore: 8.0, action: "Aprovado com distinção" },
      { label: "Aprovado", minScore: 7.0, action: "Aprovado" },
      { label: "Borderline", minScore: 5.0, action: "Revisão pelo comitê" },
      { label: "Reprovado", minScore: 0, action: "Reprovado com feedback" },
    ],
  },

  hackathon: {
    name: "Hackathon",
    type: "hackathon",
    phases: [
      {
        name: "Projeto",
        slug: "project",
        weight: 0.7,
        sections: [
          {
            name: "Problema",
            description: "Clareza na identificação e relevância do problema",
            weight: 0.2,
            criteria: [
              { name: "Identificação do problema", description: "Problema bem definido e relevante", weight: 1.0, rubric: { exceptional: "Problema claramente definido com dados de suporte.", good: "Problema bem identificado.", basic: "Problema genérico.", insufficient: "Problema vago.", poor: "Não define o problema." } },
            ],
          },
          {
            name: "Solução",
            description: "Qualidade e inovação da solução proposta",
            weight: 0.3,
            criteria: [
              { name: "Inovação e viabilidade", description: "Solução criativa e executável", weight: 1.0, rubric: { exceptional: "Solução inovadora, viável e bem justificada.", good: "Solução sólida com boa justificativa.", basic: "Solução funcional mas sem diferencial.", insufficient: "Solução fraca ou inviável.", poor: "Sem solução clara." } },
            ],
          },
          {
            name: "Execução Técnica",
            description: "Qualidade da implementação",
            weight: 0.3,
            criteria: [
              { name: "Implementação", description: "Código, arquitetura e funcionalidade", weight: 1.0, rubric: { exceptional: "Implementação robusta, código limpo, funcionalidade completa.", good: "Boa implementação com funcionalidade principal.", basic: "Implementação básica, funciona.", insufficient: "Implementação incompleta.", poor: "Não funciona." } },
            ],
          },
          {
            name: "Modelo de Negócio",
            description: "Viabilidade comercial",
            weight: 0.2,
            criteria: [
              { name: "Viabilidade", description: "Sustentabilidade e potencial de mercado", weight: 1.0, rubric: { exceptional: "Modelo sólido com projeções realistas.", good: "Modelo defensável.", basic: "Modelo superficial.", insufficient: "Modelo irrealista.", poor: "Sem modelo." } },
            ],
          },
        ],
      },
      {
        name: "Pitch",
        slug: "pitch",
        weight: 0.3,
        sections: [
          {
            name: "Apresentação",
            description: "Qualidade geral da apresentação",
            weight: 1.0,
            criteria: [
              { name: "Comunicação e defesa", description: "Clareza, confiança e capacidade de resposta", weight: 1.0, rubric: { exceptional: "Apresentação excepcional. Defende com dados e convicção.", good: "Boa apresentação. Responde bem.", basic: "Apresentação funcional.", insufficient: "Apresentação fraca.", poor: "Não consegue apresentar." } },
            ],
          },
        ],
      },
    ],
    cutoffs: [
      { label: "Vencedor", minScore: 8.5, action: "Premiado" },
      { label: "Destaque", minScore: 7.0, action: "Menção honrosa" },
      { label: "Participante", minScore: 0, action: "Certificado de participação" },
    ],
  },
};
