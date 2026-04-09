import { z } from "zod";

// ============================================================================
// Auth
// ============================================================================
export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha obrigatória"),
});

// ============================================================================
// Evaluations
// ============================================================================
export const createEvaluationSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(["case-study", "hackathon", "valuation", "consultoria"]),
  description: z.string().optional(),
  adminPassword: z.string().min(6),
});

export const updateEvaluationSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  instructions: z.string().optional(),
  deadline: z.string().optional(),
  status: z.enum(["draft", "open", "evaluating", "completed"]).optional(),
});

// ============================================================================
// Candidates
// ============================================================================
export const importCandidatesSchema = z.object({
  candidates: z.array(
    z.object({
      name: z.string().min(1),
      email: z.string().email(),
      group: z.string().optional(),
    })
  ),
  defaultPassword: z.string().min(6).optional(),
});

export const deleteCandidateSchema = z.object({
  candidateId: z.string().min(1),
});

// ============================================================================
// Draw
// ============================================================================
export const drawTeamsSchema = z.object({
  teamCount: z.number().int().min(1).max(100),
  constraints: z.record(z.unknown()).optional(),
});

// ============================================================================
// Evaluate (AI)
// ============================================================================
export const evaluateSchema = z.object({
  submissionIds: z.array(z.string().min(1)).min(1),
});

// ============================================================================
// Users & Members
// ============================================================================
export const createMemberSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  password: z.string().min(6),
  course: z.string().optional(),
  semester: z.string().optional(),
  member_status: z.string().optional(),
  joined_at: z.string().optional(),
  ano_ingresso: z.string().optional(),
  sala: z.string().optional(),
});

export const createUserSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  password: z.string().min(6),
  permissions: z.array(z.string()).optional(),
});

export const updatePermissionsSchema = z.object({
  permissions: z.array(z.string()).optional(),
  memberStatus: z.enum(["presidente", "vice-presidente", "trainee", "alumni"]).optional(),
});

// ============================================================================
// Evaluators
// ============================================================================
export const addEvaluatorSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  role: z.string().optional(),
  password: z.string().min(6).optional(),
});

// ============================================================================
// Events
// ============================================================================
export const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  event_type: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  start_date: z.string().min(1),
  end_date: z.string().nullable().optional(),
  speaker: z.string().nullable().optional(),
  speaker_title: z.string().nullable().optional(),
  max_attendees: z.number().int().nullable().optional(),
  image_url: z.string().nullable().optional(),
  meeting_url: z.string().nullable().optional(),
  location_type: z.enum(["presencial", "online", "hibrido"]).nullable().optional(),
  visibility: z.enum(["all", "personal"]).nullable().optional(),
  invited_user_ids: z.array(z.string()).optional(),
});

// ============================================================================
// Portfolio
// ============================================================================
export const createPositionSchema = z.object({
  ticker: z.string().min(1).max(20),
  company_name: z.string().min(1).max(200),
  position_type: z.enum(["long", "short"]).optional(),
  entry_date: z.string().min(1),
  entry_price: z.number().positive(),
  quantity: z.number().optional(),
  current_price: z.number().positive().optional(),
  thesis: z.string().optional(),
  thesis_author: z.string().optional(),
});

// ============================================================================
// Wiki
// ============================================================================
export const createWikiPageSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().optional(),
  category: z.enum(["guides", "templates", "processes", "references"]).optional(),
  resource_type: z.enum(["article", "template", "file", "link"]).optional(),
  author_id: z.string().optional(),
  sort_order: z.number().int().optional(),
  file_url: z.string().optional(),
  file_name: z.string().optional(),
  file_type: z.string().optional(),
  external_url: z.string().optional(),
  cover_color: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// ============================================================================
// Candidate Submission
// ============================================================================
export const submitCaseSchema = z.object({
  candidateId: z.string().min(1),
  phaseId: z.string().min(1),
  teamId: z.string().nullable().default(null),
  rawText: z.string().min(1, "Texto da submissão é obrigatório"),
  fileName: z.string().default("submission.txt"),
  aiUsage: z.string().default("none"),
  aiUsageDescription: z.string().default(""),
});

// ============================================================================
// Human Review
// ============================================================================
export const humanReviewSchema = z.object({
  analyticalScore: z.number().min(0).max(10),
  reasoningScore: z.number().min(0).max(10),
  originalityScore: z.number().min(0).max(10),
  communicationScore: z.number().min(0).max(10),
  impression: z.string().optional(),
  recommendation: z.enum(["approve", "concerns", "reject"]),
});

// ============================================================================
// Feedback
// ============================================================================
export const updateFeedbackSchema = z.object({
  teamId: z.string().min(1),
  feedback: z.string().optional(),
  feedbackSent: z.boolean().optional(),
});

// ============================================================================
// Competitions
// ============================================================================
export const createCompetitionSchema = z.object({
  name: z.string().min(1).max(200),
  organizer: z.string().optional(),
  description: z.string().optional(),
  competition_type: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  result: z.string().optional(),
  placement: z.string().optional(),
  team_members: z.string().optional(),
});

// ============================================================================
// Journeys
// ============================================================================
export const createJourneySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  journey_type: z.enum(["case-competition", "investment-thesis", "trainee-onboarding", "nucleus-project", "capacitacao", "custom"]).optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  cover_image: z.string().optional(),
  status: z.enum(["active", "draft", "archived"]).optional(),
  self_enroll: z.boolean().optional(),
  estimated_days: z.number().int().positive().optional(),
  is_template: z.boolean().optional(),
});

export const updateJourneySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  journey_type: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  cover_image: z.string().nullable().optional(),
  status: z.enum(["active", "draft", "archived"]).optional(),
  self_enroll: z.boolean().optional(),
  estimated_days: z.number().int().positive().optional(),
});

export const createStageSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  sort_order: z.number().int().min(0),
  color: z.string().optional(),
  estimated_days: z.number().int().positive().optional(),
  unlock_rule: z.enum(["sequential", "parallel", "manual"]).optional(),
});

export const createJourneyTaskSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  sort_order: z.number().int().min(0),
  task_type: z.enum(["text", "file", "link", "quiz", "checklist", "video", "attendance", "material"]),
  is_required: z.boolean().optional(),
  review_type: z.enum(["mentor", "peer", "ai", "auto"]).optional(),
  config: z.record(z.unknown()).nullable().optional(),
  max_score: z.number().positive().optional(),
  weight: z.number().positive().optional(),
  material_url: z.string().nullable().optional(),
  material_file_name: z.string().nullable().optional(),
  material_file_size: z.number().nullable().optional(),
  is_released: z.boolean().optional(),
});

export const createQuizQuestionSchema = z.object({
  question: z.string().min(1).max(1000),
  question_type: z.enum(["multiple_choice", "true_false", "open_text"]).optional(),
  options: z.array(z.object({ label: z.string(), text: z.string() })).optional(),
  correct_answer: z.string().optional(),
  sort_order: z.number().int().min(0).optional(),
  points: z.number().positive().optional(),
});

export const createInstanceSchema = z.object({
  journey_id: z.string().min(1),
  name: z.string().min(1).max(200),
  start_date: z.string().min(1),
  end_date: z.string().nullable().optional(),
  mentor_id: z.string().nullable().optional(),
  nucleus_id: z.string().nullable().optional(),
  participant_ids: z.array(z.string()).min(1),
});

export const submitJourneyTaskSchema = z.object({
  task_id: z.string().min(1),
  content: z.string().optional(),
  file_url: z.string().optional(),
  file_name: z.string().optional(),
  link_url: z.string().optional(),
});

export const reviewSubmissionSchema = z.object({
  submission_id: z.string().min(1),
  score: z.number().min(0).max(10).optional(),
  feedback: z.string().optional(),
  status: z.enum(["approved", "revision_requested"]),
});

export const reorderSchema = z.object({
  stages: z.array(z.object({ id: z.string(), sort_order: z.number().int().min(0) })).optional(),
  tasks: z.array(z.object({ id: z.string(), sort_order: z.number().int().min(0) })).optional(),
});

// ============================================================================
// Kanban
// ============================================================================
export const createKanbanCardSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  status: z.enum(["todo", "doing", "review", "done"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  assignee_id: z.string().nullable().optional(),
  stage_id: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
});

export const updateKanbanCardSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.enum(["todo", "doing", "review", "done"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  assignee_id: z.string().nullable().optional(),
  stage_id: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  sort_order: z.number().int().min(0).optional(),
});

// ============================================================================
// Helper
// ============================================================================
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): { ok: true; data: T } | { ok: false; error: string } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const firstError = result.error.errors[0];
    return { ok: false, error: `${firstError.path.join(".")}: ${firstError.message}` };
  }
  return { ok: true, data: result.data };
}
