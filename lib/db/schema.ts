import { pgTable, text, integer, real } from "drizzle-orm/pg-core";

// ============================================================================
// USERS — unified login. Two types: "candidate" or "member"
// Members have configurable permissions set by superadmin
// ============================================================================
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull().default("candidate"), // "candidate" | "member"
  evaluationId: text("evaluation_id"),
  candidateId: text("candidate_id"), // FK to candidates (for type=candidate)
  // Permissions (for type=member) — stored as JSON array
  // e.g. ["admin","evaluate","edit","view_ranking","manage_users"]
  permissions: text("permissions").default("[]"),
  createdAt: text("created_at").notNull(),
  // Member-specific columns (added via migration)
  mustChangePassword: integer("must_change_password").default(0),
  avatarUrl: text("avatar_url"),
  course: text("course"),
  semester: text("semester"),
  memberStatus: text("member_status").default("trainee"), // trainee | membro | vice-presidente | presidente | alumni
  nucleusId: text("nucleus_id"),
  joinedAt: text("joined_at"),
  linkedinUrl: text("linkedin_url"),
  bio: text("bio"),
  points: integer("points").default(0),
  anoIngresso: text("ano_ingresso"),
  sala: text("sala"),
  instagram: text("instagram"),
  telefone: text("telefone"),
  empresa: text("empresa"),
  cargoEmpresa: text("cargo_empresa"),
  empresaSite: text("empresa_site"),
  empresaLinkedin: text("empresa_linkedin"),
  empresaDescricao: text("empresa_descricao"),
});

// ============================================================================
// EVALUATIONS — the top-level entity (e.g. "PS Liga MF 2026.1")
// ============================================================================
export const evaluations = pgTable("evaluations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // "case-study" | "hackathon" | "valuation" | "consultoria"
  status: text("status").notNull().default("draft"), // "draft" | "open" | "evaluating" | "completed"
  description: text("description"),
  instructions: text("instructions"), // rich text instructions for candidates
  caseFileUrl: text("case_file_url"), // path to uploaded case PDF
  caseFileName: text("case_file_name"),
  deadline: text("deadline"), // ISO date string
  maxScore: real("max_score").notNull().default(10),
  adminPassword: text("admin_password").notNull(), // hashed
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// ============================================================================
// PHASES — case (60%) + pitch (40%)
// ============================================================================
export const phases = pgTable("phases", {
  id: text("id").primaryKey(),
  evaluationId: text("evaluation_id")
    .notNull()
    .references(() => evaluations.id),
  name: text("name").notNull(), // "Case Study", "Pitch"
  slug: text("slug").notNull(), // "case", "pitch"
  weight: real("weight").notNull(), // 0.6, 0.4
  order: integer("sort_order").notNull(),
});

// ============================================================================
// SECTIONS — groups of criteria within a phase
// ============================================================================
export const sections = pgTable("sections", {
  id: text("id").primaryKey(),
  phaseId: text("phase_id")
    .notNull()
    .references(() => phases.id),
  name: text("name").notNull(), // "Análise Setorial"
  description: text("description"),
  weight: real("weight").notNull(), // 0.25
  order: integer("sort_order").notNull(),
});

// ============================================================================
// CRITERIA — individual scoring dimensions
// ============================================================================
export const criteria = pgTable("criteria", {
  id: text("id").primaryKey(),
  sectionId: text("section_id")
    .notNull()
    .references(() => sections.id),
  name: text("name").notNull(), // "Uso correto dos dados"
  description: text("description"),
  weight: real("weight").notNull(), // 0.30
  order: integer("sort_order").notNull(),
  rubric: text("rubric"), // JSON: { exceptional, good, basic, insufficient, poor }
});

// ============================================================================
// CUTOFFS — score thresholds for classification
// ============================================================================
export const cutoffs = pgTable("cutoffs", {
  id: text("id").primaryKey(),
  evaluationId: text("evaluation_id")
    .notNull()
    .references(() => evaluations.id),
  label: text("label").notNull(), // "Destaque", "Aprovado", "Borderline", "Reprovado"
  minScore: real("min_score").notNull(),
  action: text("action").notNull(), // "Aprovado com distinção"
  order: integer("sort_order").notNull(),
});

// ============================================================================
// TEAMS — groups of candidates (numbered: Equipe 1, 2, 3...)
// ============================================================================
export const teams = pgTable("teams", {
  id: text("id").primaryKey(),
  evaluationId: text("evaluation_id")
    .notNull()
    .references(() => evaluations.id),
  number: integer("number").notNull(), // 1, 2, 3...
  drawSeed: text("draw_seed"), // reproducible seed
  drawnAt: text("drawn_at"),
});

// ============================================================================
// CANDIDATES — imported from Google Forms CSV
// ============================================================================
export const candidates = pgTable("candidates", {
  id: text("id").primaryKey(),
  evaluationId: text("evaluation_id")
    .notNull()
    .references(() => evaluations.id),
  teamId: text("team_id").references(() => teams.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  group: text("group_name"), // turma/curso — used for draw constraints
  magicToken: text("magic_token").notNull(), // unique access token
  status: text("status").notNull().default("pending"), // "pending" | "submitted" | "evaluated" | "completed"
  createdAt: text("created_at").notNull(),
});

// ============================================================================
// SUBMISSIONS — files uploaded by candidates
// ============================================================================
export const submissions = pgTable("submissions", {
  id: text("id").primaryKey(),
  candidateId: text("candidate_id")
    .notNull()
    .references(() => candidates.id),
  teamId: text("team_id").references(() => teams.id),
  phaseId: text("phase_id")
    .notNull()
    .references(() => phases.id),
  fileUrl: text("file_url"), // path to uploaded file
  fileName: text("file_name"),
  rawText: text("raw_text"), // extracted text content
  aiUsage: text("ai_usage"), // "none" | "research" | "writing" | "extensive"
  aiUsageDescription: text("ai_usage_description"),
  submittedAt: text("submitted_at").notNull(),
});

// ============================================================================
// AI RESULTS — scores from Claude evaluation
// ============================================================================
export const aiResults = pgTable("ai_results", {
  id: text("id").primaryKey(),
  submissionId: text("submission_id")
    .notNull()
    .references(() => submissions.id),
  scores: text("scores").notNull(), // JSON: { sectionId: { criterionId: { score, justification } } }
  sectionScores: text("section_scores").notNull(), // JSON: { sectionId: score }
  finalScore: real("final_score").notNull(),
  profile: text("profile"), // "Equity Research", "Macro", etc.
  feedback: text("feedback"), // generated feedback text
  suggestedQuestions: text("suggested_questions"), // JSON: string[]
  evaluatedAt: text("evaluated_at").notNull(),
});

// ============================================================================
// HUMAN EVALUATORS — members of the review panel (banca)
// ============================================================================
export const humanEvaluators = pgTable("human_evaluators", {
  id: text("id").primaryKey(),
  evaluationId: text("evaluation_id")
    .notNull()
    .references(() => evaluations.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role"), // "Prof. Luciano", "Coordenador"
  accessToken: text("access_token").notNull(), // magic link token
  createdAt: text("created_at").notNull(),
});

// ============================================================================
// HUMAN REVIEWS — simplified scoring by panel members
// ============================================================================
export const humanReviews = pgTable("human_reviews", {
  id: text("id").primaryKey(),
  evaluatorId: text("evaluator_id")
    .notNull()
    .references(() => humanEvaluators.id),
  submissionId: text("submission_id")
    .notNull()
    .references(() => submissions.id),
  analyticalScore: real("analytical_score").notNull(), // 0-10
  reasoningScore: real("reasoning_score").notNull(), // 0-10
  originalityScore: real("originality_score").notNull(), // 0-10
  communicationScore: real("communication_score").notNull(), // 0-10
  overallScore: real("overall_score").notNull(), // calculated
  impression: text("impression"), // free text
  recommendation: text("recommendation").notNull(), // "approve" | "concerns" | "reject"
  reviewedAt: text("reviewed_at").notNull(),
});

// ============================================================================
// CONSOLIDATED RESULTS — final scores combining AI + Human
// ============================================================================
export const consolidatedResults = pgTable("consolidated_results", {
  id: text("id").primaryKey(),
  teamId: text("team_id")
    .notNull()
    .references(() => teams.id),
  phaseId: text("phase_id")
    .notNull()
    .references(() => phases.id),
  aiScore: real("ai_score"),
  humanScore: real("human_score"), // average of all human reviews
  humanReviewCount: integer("human_review_count").default(0),
  divergence: real("divergence"), // |ai - human|
  finalScore: real("final_score"), // (ai * 0.55) + (human * 0.45)
  classification: text("classification"), // "Destaque" | "Aprovado" | "Borderline" | "Reprovado"
  divergenceFlag: text("divergence_flag"), // "ok" | "warning" | "critical"
  feedback: text("feedback"), // final consolidated feedback
  feedbackSent: integer("feedback_sent").default(0), // boolean
  updatedAt: text("updated_at").notNull(),
});

// ============================================================================
// NUCLEI — research groups within the finance club
// ============================================================================
export const nuclei = pgTable("nuclei", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  color: text("color").default("#C4A882"),
  coordinatorId: text("coordinator_id"),
  createdAt: text("created_at").notNull(),
});

// ============================================================================
// NUCLEUS PROJECTS — semester projects per nucleus
// ============================================================================
export const nucleusProjects = pgTable("nucleus_projects", {
  id: text("id").primaryKey(),
  nucleusId: text("nucleus_id")
    .notNull()
    .references(() => nuclei.id),
  name: text("name").notNull(),
  description: text("description"),
  semester: text("semester").notNull(),
  status: text("status").default("active"),
  company: text("company"),
  ticker: text("ticker"),
  deliverableType: text("deliverable_type"),
  dueDate: text("due_date"),
  createdAt: text("created_at").notNull(),
});

// ============================================================================
// PROJECT DELIVERABLES — files uploaded for projects
// ============================================================================
export const projectDeliverables = pgTable("project_deliverables", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => nucleusProjects.id),
  userId: text("user_id").notNull(),
  fileUrl: text("file_url"),
  fileName: text("file_name"),
  fileType: text("file_type"),
  notes: text("notes"),
  uploadedAt: text("uploaded_at").notNull(),
});

// ============================================================================
// PORTFOLIO POSITIONS — investment tracking
// ============================================================================
export const portfolioPositions = pgTable("portfolio_positions", {
  id: text("id").primaryKey(),
  nucleusId: text("nucleus_id").references(() => nuclei.id),
  ticker: text("ticker").notNull(),
  companyName: text("company_name").notNull(),
  positionType: text("position_type").default("long"),
  entryDate: text("entry_date").notNull(),
  entryPrice: real("entry_price").notNull(),
  quantity: real("quantity").default(0),
  currentPrice: real("current_price"),
  exitDate: text("exit_date"),
  exitPrice: real("exit_price"),
  thesis: text("thesis"),
  thesisAuthor: text("thesis_author"),
  status: text("status").default("open"),
  createdAt: text("created_at").notNull(),
});

// ============================================================================
// EVENTS — meetings, workshops, guest speakers
// ============================================================================
export const events = pgTable("events", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  eventType: text("event_type").default("meeting"),
  location: text("location"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  speaker: text("speaker"),
  speakerTitle: text("speaker_title"),
  maxAttendees: integer("max_attendees"),
  imageUrl: text("image_url"),
  meetingUrl: text("meeting_url"),
  locationType: text("location_type").default("presencial"), // "presencial" | "online" | "hibrido"
  visibility: text("visibility").default("all"), // "all" | "personal"
  createdBy: text("created_by"),
  createdAt: text("created_at").notNull(),
});

// ============================================================================
// EVENT ATTENDEES — registrations and check-ins
// ============================================================================
export const eventAttendees = pgTable("event_attendees", {
  id: text("id").primaryKey(),
  eventId: text("event_id")
    .notNull()
    .references(() => events.id),
  userId: text("user_id").notNull(),
  status: text("status").default("registered"),
  checkedInAt: text("checked_in_at"),
  registeredAt: text("registered_at").notNull(),
});

// ============================================================================
// COMPETITIONS — case competitions, hackathons, challenges
// ============================================================================
export const competitions = pgTable("competitions", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  organizer: text("organizer"),
  description: text("description"),
  competitionType: text("competition_type").default("case"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  result: text("result"),
  placement: text("placement"),
  teamMembers: text("team_members"),
  documents: text("documents"),
  createdAt: text("created_at").notNull(),
});

// ============================================================================
// WIKI PAGES — knowledge base for the finance club
// ============================================================================
export const wikiPages = pgTable("wiki_pages", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  content: text("content"),
  category: text("category").default("general"), // guides | templates | processes | references
  resourceType: text("resource_type").default("article"), // article | template | file | link
  parentId: text("parent_id"),
  authorId: text("author_id"),
  isPublished: integer("is_published").default(1),
  sortOrder: integer("sort_order").default(0),
  // File/resource fields
  fileUrl: text("file_url"),
  fileName: text("file_name"),
  fileType: text("file_type"), // pdf | pptx | xlsx | docx
  externalUrl: text("external_url"),
  coverColor: text("cover_color").default("#C4A882"),
  tags: text("tags"), // JSON array
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// ============================================================================
// JOURNEYS — reusable journey templates
// ============================================================================
export const journeys = pgTable("journeys", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  journeyType: text("journey_type").default("custom"), // case-competition | investment-thesis | trainee-onboarding | nucleus-project | custom
  color: text("color").default("#C4A882"),
  icon: text("icon").default("route"),
  coverImage: text("cover_image"), // URL for journey cover/banner image
  status: text("journey_status").default("active"), // active | draft | archived
  selfEnroll: integer("self_enroll").default(0), // 1 = participants can create groups and join
  estimatedDays: integer("estimated_days"),
  isTemplate: integer("is_template").default(1),
  createdBy: text("created_by"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// ============================================================================
// JOURNEY STAGES — ordered phases within a journey
// ============================================================================
export const journeyStages = pgTable("journey_stages", {
  id: text("id").primaryKey(),
  journeyId: text("journey_id")
    .notNull()
    .references(() => journeys.id),
  name: text("name").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull(),
  color: text("color").default("#C4A882"),
  estimatedDays: integer("estimated_days"),
  unlockRule: text("unlock_rule").default("sequential"), // sequential | parallel | manual
});

// ============================================================================
// JOURNEY TASKS — deliverables within a stage
// ============================================================================
export const journeyTasks = pgTable("journey_tasks", {
  id: text("id").primaryKey(),
  stageId: text("stage_id")
    .notNull()
    .references(() => journeyStages.id),
  name: text("name").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull(),
  taskType: text("task_type").notNull().default("text"), // text | file | link | quiz | checklist
  isRequired: integer("is_required").default(1),
  scope: text("scope").default("group"), // group | individual
  reviewType: text("review_type").default("mentor"), // mentor | peer | ai | auto
  config: text("config"), // JSON: type-specific configuration
  maxScore: real("max_score").default(10),
  weight: real("weight").default(1),
});

// ============================================================================
// JOURNEY INSTANCES — started journeys for groups/individuals
// ============================================================================
export const journeyInstances = pgTable("journey_instances", {
  id: text("id").primaryKey(),
  journeyId: text("journey_id")
    .notNull()
    .references(() => journeys.id),
  name: text("name").notNull(),
  status: text("status").default("active"), // active | paused | completed | archived
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  mentorId: text("mentor_id"),
  nucleusId: text("nucleus_id"),
  metadata: text("metadata"), // JSON
  createdBy: text("created_by"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// ============================================================================
// JOURNEY PARTICIPANTS — who is on each instance
// ============================================================================
export const journeyParticipants = pgTable("journey_participants", {
  id: text("id").primaryKey(),
  instanceId: text("instance_id")
    .notNull()
    .references(() => journeyInstances.id),
  userId: text("user_id").notNull(),
  role: text("role").default("participant"), // participant | mentor | observer
  status: text("status").default("active"), // active | dropped | completed
  currentStageId: text("current_stage_id"),
  completedAt: text("completed_at"),
  joinedAt: text("joined_at").notNull(),
});

// ============================================================================
// TASK SUBMISSIONS — what participants submit for tasks
// ============================================================================
export const taskSubmissions = pgTable("task_submissions", {
  id: text("id").primaryKey(),
  instanceId: text("instance_id")
    .notNull()
    .references(() => journeyInstances.id),
  taskId: text("task_id")
    .notNull()
    .references(() => journeyTasks.id),
  userId: text("user_id").notNull(),
  content: text("content"),
  fileUrl: text("file_url"),
  fileName: text("file_name"),
  linkUrl: text("link_url"),
  status: text("status").default("submitted"), // draft | submitted | under_review | approved | revision_requested
  score: real("score"),
  submittedAt: text("submitted_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// ============================================================================
// TASK REVIEWS — feedback on submissions
// ============================================================================
export const taskReviews = pgTable("task_reviews", {
  id: text("id").primaryKey(),
  submissionId: text("submission_id")
    .notNull()
    .references(() => taskSubmissions.id),
  reviewerId: text("reviewer_id"),
  reviewType: text("review_type").notNull(), // mentor | peer | ai | auto
  score: real("score"),
  feedback: text("feedback"),
  status: text("status").default("completed"), // pending | completed
  aiOutput: text("ai_output"), // JSON
  reviewedAt: text("reviewed_at").notNull(),
});

// ============================================================================
// JOURNEY FILES — shared resources available to all groups in a journey
// ============================================================================
export const journeyFiles = pgTable("journey_files", {
  id: text("id").primaryKey(),
  journeyId: text("journey_id")
    .notNull()
    .references(() => journeys.id),
  name: text("name").notNull(),
  description: text("description"),
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type"), // pdf | xlsx | docx | pptx | image | other
  fileSize: integer("file_size"), // bytes
  uploadedBy: text("uploaded_by"),
  createdAt: text("created_at").notNull(),
});

// ============================================================================
// KANBAN CARDS — free-form tasks created by participants within an instance
// ============================================================================
export const kanbanCards = pgTable("kanban_cards", {
  id: text("id").primaryKey(),
  instanceId: text("instance_id")
    .notNull()
    .references(() => journeyInstances.id),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("todo"), // todo | doing | review | done
  priority: text("priority").default("medium"), // low | medium | high | urgent
  assigneeId: text("assignee_id"), // user id
  stageId: text("stage_id"), // optional link to journey stage
  dueDate: text("due_date"),
  sortOrder: integer("sort_order").default(0),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// ============================================================================
// TYPES
// ============================================================================
export type User = typeof users.$inferSelect;
export type Evaluation = typeof evaluations.$inferSelect;
export type NewEvaluation = typeof evaluations.$inferInsert;
export type Phase = typeof phases.$inferSelect;
export type Section = typeof sections.$inferSelect;
export type Criterion = typeof criteria.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type Candidate = typeof candidates.$inferSelect;
export type Submission = typeof submissions.$inferSelect;
export type AiResult = typeof aiResults.$inferSelect;
export type HumanEvaluator = typeof humanEvaluators.$inferSelect;
export type HumanReview = typeof humanReviews.$inferSelect;
export type ConsolidatedResult = typeof consolidatedResults.$inferSelect;
export type Nucleus = typeof nuclei.$inferSelect;
export type NewNucleus = typeof nuclei.$inferInsert;
export type NucleusProject = typeof nucleusProjects.$inferSelect;
export type NewNucleusProject = typeof nucleusProjects.$inferInsert;
export type ProjectDeliverable = typeof projectDeliverables.$inferSelect;
export type NewProjectDeliverable = typeof projectDeliverables.$inferInsert;
export type PortfolioPosition = typeof portfolioPositions.$inferSelect;
export type NewPortfolioPosition = typeof portfolioPositions.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type EventAttendee = typeof eventAttendees.$inferSelect;
export type NewEventAttendee = typeof eventAttendees.$inferInsert;
export type Competition = typeof competitions.$inferSelect;
export type NewCompetition = typeof competitions.$inferInsert;
export type WikiPage = typeof wikiPages.$inferSelect;
export type NewWikiPage = typeof wikiPages.$inferInsert;
export type Journey = typeof journeys.$inferSelect;
export type NewJourney = typeof journeys.$inferInsert;
export type JourneyStage = typeof journeyStages.$inferSelect;
export type NewJourneyStage = typeof journeyStages.$inferInsert;
export type JourneyTask = typeof journeyTasks.$inferSelect;
export type NewJourneyTask = typeof journeyTasks.$inferInsert;
export type JourneyInstance = typeof journeyInstances.$inferSelect;
export type NewJourneyInstance = typeof journeyInstances.$inferInsert;
export type JourneyParticipant = typeof journeyParticipants.$inferSelect;
export type NewJourneyParticipant = typeof journeyParticipants.$inferInsert;
export type TaskSubmission = typeof taskSubmissions.$inferSelect;
export type NewTaskSubmission = typeof taskSubmissions.$inferInsert;
export type TaskReview = typeof taskReviews.$inferSelect;
export type NewTaskReview = typeof taskReviews.$inferInsert;
export type KanbanCard = typeof kanbanCards.$inferSelect;
export type NewKanbanCard = typeof kanbanCards.$inferInsert;
