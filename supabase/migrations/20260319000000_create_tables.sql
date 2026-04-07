CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'candidate',
  evaluation_id TEXT,
  candidate_id TEXT,
  permissions TEXT DEFAULT '[]',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS evaluations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  description TEXT,
  instructions TEXT,
  case_file_url TEXT,
  case_file_name TEXT,
  deadline TEXT,
  max_score REAL NOT NULL DEFAULT 10,
  admin_password TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS phases (
  id TEXT PRIMARY KEY,
  evaluation_id TEXT NOT NULL REFERENCES evaluations(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  weight REAL NOT NULL,
  sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sections (
  id TEXT PRIMARY KEY,
  phase_id TEXT NOT NULL REFERENCES phases(id),
  name TEXT NOT NULL,
  description TEXT,
  weight REAL NOT NULL,
  sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS criteria (
  id TEXT PRIMARY KEY,
  section_id TEXT NOT NULL REFERENCES sections(id),
  name TEXT NOT NULL,
  description TEXT,
  weight REAL NOT NULL,
  sort_order INTEGER NOT NULL,
  rubric TEXT
);

CREATE TABLE IF NOT EXISTS cutoffs (
  id TEXT PRIMARY KEY,
  evaluation_id TEXT NOT NULL REFERENCES evaluations(id),
  label TEXT NOT NULL,
  min_score REAL NOT NULL,
  action TEXT NOT NULL,
  sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  evaluation_id TEXT NOT NULL REFERENCES evaluations(id),
  number INTEGER NOT NULL,
  draw_seed TEXT,
  drawn_at TEXT
);

CREATE TABLE IF NOT EXISTS candidates (
  id TEXT PRIMARY KEY,
  evaluation_id TEXT NOT NULL REFERENCES evaluations(id),
  team_id TEXT REFERENCES teams(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  group_name TEXT,
  magic_token TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  candidate_id TEXT NOT NULL REFERENCES candidates(id),
  team_id TEXT REFERENCES teams(id),
  phase_id TEXT NOT NULL REFERENCES phases(id),
  file_url TEXT,
  file_name TEXT,
  raw_text TEXT,
  ai_usage TEXT,
  ai_usage_description TEXT,
  submitted_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_results (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES submissions(id),
  scores TEXT NOT NULL,
  section_scores TEXT NOT NULL,
  final_score REAL NOT NULL,
  profile TEXT,
  feedback TEXT,
  suggested_questions TEXT,
  evaluated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS human_evaluators (
  id TEXT PRIMARY KEY,
  evaluation_id TEXT NOT NULL REFERENCES evaluations(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT,
  access_token TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS human_reviews (
  id TEXT PRIMARY KEY,
  evaluator_id TEXT NOT NULL REFERENCES human_evaluators(id),
  submission_id TEXT NOT NULL REFERENCES submissions(id),
  analytical_score REAL NOT NULL,
  reasoning_score REAL NOT NULL,
  originality_score REAL NOT NULL,
  communication_score REAL NOT NULL,
  overall_score REAL NOT NULL,
  impression TEXT,
  recommendation TEXT NOT NULL,
  reviewed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS consolidated_results (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES teams(id),
  phase_id TEXT NOT NULL REFERENCES phases(id),
  ai_score REAL,
  human_score REAL,
  human_review_count INTEGER DEFAULT 0,
  divergence REAL,
  final_score REAL,
  classification TEXT,
  divergence_flag TEXT,
  feedback TEXT,
  feedback_sent INTEGER DEFAULT 0,
  updated_at TEXT NOT NULL
);
