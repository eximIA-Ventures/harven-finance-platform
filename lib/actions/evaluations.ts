"use server";

import { db } from "@/lib/db";
import {
  evaluations,
  phases,
  sections,
  criteria,
  cutoffs,
  candidates,
  teams,
  humanEvaluators,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateToken } from "@/lib/utils";
import { type EvaluationTemplate } from "@/lib/db/seed-templates";
import crypto from "crypto";

function genId() {
  return crypto.randomUUID().slice(0, 8);
}

function now() {
  return new Date().toISOString();
}

function hashPassword(password: string): string {
  // Use bcrypt for secure password hashing
  const bcrypt = require("bcryptjs");
  return bcrypt.hashSync(password, 10);
}

export async function createEvaluation(data: {
  name: string;
  type: string;
  description?: string;
  instructions?: string;
  deadline?: string;
  password: string;
  template: EvaluationTemplate;
}) {
  const evalId = genId();
  const ts = now();

  await db.insert(evaluations).values({
    id: evalId,
    name: data.name,
    type: data.type,
    description: data.description || null,
    instructions: data.instructions || null,
    deadline: data.deadline || null,
    adminPassword: hashPassword(data.password),
    createdAt: ts,
    updatedAt: ts,
  });

  // Insert cutoffs
  for (let i = 0; i < data.template.cutoffs.length; i++) {
    const c = data.template.cutoffs[i];
    await db.insert(cutoffs).values({
      id: `${evalId}-cut-${i}`,
      evaluationId: evalId,
      label: c.label,
      minScore: c.minScore,
      action: c.action,
      order: i,
    });
  }

  // Insert phases, sections, criteria
  for (let pi = 0; pi < data.template.phases.length; pi++) {
    const phase = data.template.phases[pi];
    const phaseId = `${evalId}-p${pi}`;

    await db.insert(phases).values({
      id: phaseId,
      evaluationId: evalId,
      name: phase.name,
      slug: phase.slug,
      weight: phase.weight,
      order: pi,
    });

    for (let si = 0; si < phase.sections.length; si++) {
      const section = phase.sections[si];
      const sectionId = `${phaseId}-s${si}`;

      await db.insert(sections).values({
        id: sectionId,
        phaseId,
        name: section.name,
        description: section.description,
        weight: section.weight,
        order: si,
      });

      for (let ci = 0; ci < section.criteria.length; ci++) {
        const criterion = section.criteria[ci];
        await db.insert(criteria).values({
          id: `${sectionId}-c${ci}`,
          sectionId,
          name: criterion.name,
          description: criterion.description,
          weight: criterion.weight,
          order: ci,
          rubric: JSON.stringify(criterion.rubric),
        });
      }
    }
  }

  return evalId;
}

export async function getEvaluation(id: string) {
  const eval_ = await db.query.evaluations.findFirst({
    where: eq(evaluations.id, id),
  });
  return eval_ || null;
}

export async function listEvaluations() {
  return db.query.evaluations.findMany({
    orderBy: (e, { desc }) => [desc(e.createdAt)],
  });
}

export async function getEvaluationFull(id: string) {
  const eval_ = await db.query.evaluations.findFirst({
    where: eq(evaluations.id, id),
  });
  if (!eval_) return null;

  const phaseList = await db.query.phases.findMany({
    where: eq(phases.evaluationId, id),
    orderBy: (p, { asc }) => [asc(p.order)],
  });

  const fullPhases = await Promise.all(
    phaseList.map(async (phase) => {
      const sectionList = await db.query.sections.findMany({
        where: eq(sections.phaseId, phase.id),
        orderBy: (s, { asc }) => [asc(s.order)],
      });

      const fullSections = await Promise.all(
        sectionList.map(async (section) => {
          const criteriaList = await db.query.criteria.findMany({
            where: eq(criteria.sectionId, section.id),
            orderBy: (c, { asc }) => [asc(c.order)],
          });
          return { ...section, criteria: criteriaList };
        })
      );

      return { ...phase, sections: fullSections };
    })
  );

  const cutoffList = await db.query.cutoffs.findMany({
    where: eq(cutoffs.evaluationId, id),
    orderBy: (c, { desc }) => [desc(c.minScore)],
  });

  const teamList = await db.query.teams.findMany({
    where: eq(teams.evaluationId, id),
    orderBy: (t, { asc }) => [asc(t.number)],
  });

  const candidateList = await db.query.candidates.findMany({
    where: eq(candidates.evaluationId, id),
  });

  const evaluatorList = await db.query.humanEvaluators.findMany({
    where: eq(humanEvaluators.evaluationId, id),
  });

  return {
    ...eval_,
    phases: fullPhases,
    cutoffs: cutoffList,
    teams: teamList,
    candidates: candidateList,
    evaluators: evaluatorList,
  };
}

export async function verifyAdminPassword(evalId: string, password: string): Promise<boolean> {
  const eval_ = await db.query.evaluations.findFirst({
    where: eq(evaluations.id, evalId),
  });
  if (!eval_) return false;
  return eval_.adminPassword === hashPassword(password);
}

export async function importCandidates(
  evaluationId: string,
  rows: { name: string; email: string; group?: string }[]
) {
  const ts = now();
  const inserted = [];

  for (const row of rows) {
    const id = genId();
    const token = generateToken();

    await db.insert(candidates).values({
      id,
      evaluationId,
      name: row.name,
      email: row.email,
      group: row.group || null,
      magicToken: token,
      createdAt: ts,
    });

    inserted.push({ id, name: row.name, email: row.email, token });
  }

  return inserted;
}

export async function drawTeams(
  evaluationId: string,
  teamCount: number,
  constraints: { noSameGroup?: boolean } = {}
) {
  const candidateList = await db.query.candidates.findMany({
    where: eq(candidates.evaluationId, evaluationId),
  });

  // Generate reproducible seed
  const seed = crypto.randomBytes(4).toString("hex");

  // Shuffle candidates (Fisher-Yates with seed-based randomization)
  const shuffled = [...candidateList];
  let seedNum = parseInt(seed, 16);
  for (let i = shuffled.length - 1; i > 0; i--) {
    seedNum = (seedNum * 1103515245 + 12345) & 0x7fffffff;
    const j = seedNum % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // If constraint: no same group, try to distribute
  if (constraints.noSameGroup) {
    // Group candidates by their group
    const byGroup: Record<string, typeof shuffled> = {};
    const noGroup: typeof shuffled = [];

    for (const c of shuffled) {
      if (c.group) {
        if (!byGroup[c.group]) byGroup[c.group] = [];
        byGroup[c.group].push(c);
      } else {
        noGroup.push(c);
      }
    }

    // Round-robin distribute groups across teams
    const distributed: typeof shuffled = [];
    const groups = Object.values(byGroup);
    let maxLen = Math.max(...groups.map((g) => g.length), 0);

    for (let round = 0; round < maxLen; round++) {
      for (const group of groups) {
        if (round < group.length) {
          distributed.push(group[round]);
        }
      }
    }
    distributed.push(...noGroup);
    shuffled.splice(0, shuffled.length, ...distributed);
  }

  // Create teams
  const ts = now();
  const teamIds: string[] = [];

  for (let t = 0; t < teamCount; t++) {
    const teamId = `${evaluationId}-t${t + 1}`;
    await db.insert(teams).values({
      id: teamId,
      evaluationId,
      number: t + 1,
      drawSeed: seed,
      drawnAt: ts,
    });
    teamIds.push(teamId);
  }

  // Assign candidates to teams (round-robin)
  for (let i = 0; i < shuffled.length; i++) {
    const teamIdx = i % teamCount;
    await db
      .update(candidates)
      .set({ teamId: teamIds[teamIdx] })
      .where(eq(candidates.id, shuffled[i].id));
  }

  return { seed, teamCount, candidatesAssigned: shuffled.length };
}

export async function addHumanEvaluator(
  evaluationId: string,
  data: { name: string; email: string; role?: string }
) {
  const id = genId();
  const token = generateToken();

  await db.insert(humanEvaluators).values({
    id,
    evaluationId,
    name: data.name,
    email: data.email,
    role: data.role || null,
    accessToken: token,
    createdAt: now(),
  });

  return { id, token };
}

export async function updateEvaluationStatus(id: string, status: string) {
  await db
    .update(evaluations)
    .set({ status, updatedAt: now() })
    .where(eq(evaluations.id, id));
}

export async function uploadCaseFile(evalId: string, fileName: string, fileUrl: string) {
  await db
    .update(evaluations)
    .set({ caseFileUrl: fileUrl, caseFileName: fileName, updatedAt: now() })
    .where(eq(evaluations.id, evalId));
}
