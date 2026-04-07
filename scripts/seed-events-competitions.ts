/**
 * Seed script for events and competitions tables.
 * Run once: npx tsx scripts/seed-events-competitions.ts
 */
import { db } from "../lib/db";
import { events, competitions } from "../lib/db/schema";
import crypto from "crypto";

async function seed() {
  const now = new Date().toISOString();

  // --- 4 Events ---
  const eventsData = [
    {
      id: crypto.randomUUID().slice(0, 8),
      title: "Reuniao Semanal de Analise",
      description: "Discussao de teses e acompanhamento de portfolio",
      eventType: "meeting",
      location: "Sala de Mercados - Bloco B",
      startDate: "2026-03-25T18:00:00",
      endDate: "2026-03-25T19:30:00",
      speaker: null,
      speakerTitle: null,
      maxAttendees: 25,
      createdBy: null,
      createdAt: now,
    },
    {
      id: crypto.randomUUID().slice(0, 8),
      title: "Palestra: Valuations no Agronegocio",
      description:
        "Prof. Ricardo Almeida apresenta metodologias de valuation para empresas do setor agroindustrial",
      eventType: "palestra",
      location: "Auditorio Central",
      startDate: "2026-03-28T19:30:00",
      endDate: "2026-03-28T21:00:00",
      speaker: "Prof. Ricardo Almeida",
      speakerTitle: "Professor de Financas Corporativas",
      maxAttendees: 80,
      createdBy: null,
      createdAt: now,
    },
    {
      id: crypto.randomUUID().slice(0, 8),
      title: "Workshop Bloomberg Terminal",
      description:
        "Introducao pratica ao Bloomberg Terminal: funcoes essenciais para analise de mercado",
      eventType: "workshop",
      location: "Lab de Informatica 3",
      startDate: "2026-04-02T14:00:00",
      endDate: "2026-04-02T17:00:00",
      speaker: "Lucas Mendes",
      speakerTitle: "Analista de Mercado",
      maxAttendees: 15,
      createdBy: null,
      createdAt: now,
    },
    {
      id: crypto.randomUUID().slice(0, 8),
      title: "Preparacao CFA Research Challenge",
      description:
        "Sessao de treinamento para a equipe que representara a Liga na CFA Research Challenge",
      eventType: "competicao",
      location: "Sala de Reunioes 2",
      startDate: "2026-04-05T10:00:00",
      endDate: "2026-04-05T12:00:00",
      speaker: null,
      speakerTitle: null,
      maxAttendees: 6,
      createdBy: null,
      createdAt: now,
    },
  ];

  // --- 3 Competitions ---
  const competitionsData = [
    {
      id: crypto.randomUUID().slice(0, 8),
      name: "CFA Research Challenge 2026",
      organizer: "CFA Institute",
      description:
        "Competicao global de analise de equity research. Equipes analisam uma empresa publica e apresentam a analistas profissionais.",
      competitionType: "research",
      startDate: "2026-04-01",
      endDate: "2026-06-15",
      result: "Em andamento",
      placement: null,
      teamMembers: JSON.stringify([
        "Carlos Silva",
        "Ana Lima",
        "Pedro Santos",
        "Julia Costa",
      ]),
      documents: JSON.stringify([
        "Regulamento.pdf",
        "Template_Report.docx",
        "Briefing.pdf",
      ]),
      createdAt: now,
    },
    {
      id: crypto.randomUUID().slice(0, 8),
      name: "Constellation Challenge",
      organizer: "Constellation Asset",
      description:
        "Case competition de stock picking e construcao de portfolio long/short",
      competitionType: "case",
      startDate: "2026-02-10",
      endDate: "2026-02-12",
      result: "Semifinalista",
      placement: "Top 8",
      teamMembers: JSON.stringify([
        "Lucas Mendes",
        "Bruna Kato",
        "Rafael Torres",
      ]),
      documents: JSON.stringify(["Case_Submission.pdf", "Presentation.pptx"]),
      createdAt: now,
    },
    {
      id: crypto.randomUUID().slice(0, 8),
      name: "BTG Pactual Challenge 2025",
      organizer: "BTG Pactual",
      description:
        "Desafio de analise de case de M&A e reestruturacao corporativa",
      competitionType: "case",
      startDate: "2025-09-15",
      endDate: "2025-09-17",
      result: "3o lugar",
      placement: "3o lugar",
      teamMembers: JSON.stringify([
        "Carlos Silva",
        "Julia Costa",
        "Maria Lima",
      ]),
      documents: JSON.stringify([
        "Case_Analysis.pdf",
        "Financial_Model.xlsx",
        "Pitch_Deck.pptx",
        "Appendix.pdf",
      ]),
      createdAt: now,
    },
  ];

  console.log("Seeding events...");
  for (const evt of eventsData) {
    await db.insert(events).values(evt);
    console.log(`  Created event: ${evt.title}`);
  }

  console.log("Seeding competitions...");
  for (const comp of competitionsData) {
    await db.insert(competitions).values(comp);
    console.log(`  Created competition: ${comp.name}`);
  }

  console.log("Done!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
