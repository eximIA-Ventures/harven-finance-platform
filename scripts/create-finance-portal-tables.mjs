/**
 * Create database tables for Harven Finance Portal — 6 new modules
 * Run: node scripts/create-finance-portal-tables.mjs
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import postgres from 'postgres';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local manually since dotenv doesn't pick it up by default
const envPath = resolve(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx);
  const val = trimmed.slice(eqIdx + 1);
  if (!process.env[key]) process.env[key] = val;
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('ERROR: DATABASE_URL not found in .env.local');
  process.exit(1);
}

const sql = postgres(databaseUrl, { ssl: 'require' });

const migration = `
-- ============================================================================
-- HARVEN FINANCE PORTAL — New modules migration
-- ============================================================================

-- 1. MEMBERS — extend users table with new columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS course TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS semester TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS member_status TEXT DEFAULT 'trainee';
ALTER TABLE users ADD COLUMN IF NOT EXISTS nucleus_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS joined_at TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- 2. NUCLEI (research groups)
CREATE TABLE IF NOT EXISTS nuclei (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#C4A882',
  coordinator_id TEXT,
  created_at TEXT NOT NULL
);

-- NUCLEUS PROJECTS (semester projects per nucleus)
CREATE TABLE IF NOT EXISTS nucleus_projects (
  id TEXT PRIMARY KEY,
  nucleus_id TEXT NOT NULL REFERENCES nuclei(id),
  name TEXT NOT NULL,
  description TEXT,
  semester TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  company TEXT,
  ticker TEXT,
  deliverable_type TEXT,
  due_date TEXT,
  created_at TEXT NOT NULL
);

-- PROJECT DELIVERABLES (files uploaded for projects)
CREATE TABLE IF NOT EXISTS project_deliverables (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES nucleus_projects(id),
  user_id TEXT NOT NULL,
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  notes TEXT,
  uploaded_at TEXT NOT NULL
);

-- 3. PORTFOLIO (investment tracking)
CREATE TABLE IF NOT EXISTS portfolio_positions (
  id TEXT PRIMARY KEY,
  nucleus_id TEXT REFERENCES nuclei(id),
  ticker TEXT NOT NULL,
  company_name TEXT NOT NULL,
  position_type TEXT DEFAULT 'long',
  entry_date TEXT NOT NULL,
  entry_price REAL NOT NULL,
  quantity REAL DEFAULT 0,
  current_price REAL,
  exit_date TEXT,
  exit_price REAL,
  thesis TEXT,
  thesis_author TEXT,
  status TEXT DEFAULT 'open',
  created_at TEXT NOT NULL
);

-- 5. EVENTS
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT DEFAULT 'meeting',
  location TEXT,
  start_date TEXT NOT NULL,
  end_date TEXT,
  speaker TEXT,
  speaker_title TEXT,
  max_attendees INTEGER,
  created_by TEXT,
  created_at TEXT NOT NULL
);

-- EVENT ATTENDEES
CREATE TABLE IF NOT EXISTS event_attendees (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id),
  user_id TEXT NOT NULL,
  status TEXT DEFAULT 'registered',
  checked_in_at TEXT,
  registered_at TEXT NOT NULL
);

-- 6. COMPETITIONS
CREATE TABLE IF NOT EXISTS competitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  organizer TEXT,
  description TEXT,
  competition_type TEXT DEFAULT 'case',
  start_date TEXT,
  end_date TEXT,
  result TEXT,
  placement TEXT,
  team_members TEXT,
  documents TEXT,
  created_at TEXT NOT NULL
);

-- 7. WIKI / KNOWLEDGE BASE
CREATE TABLE IF NOT EXISTS wiki_pages (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT,
  category TEXT DEFAULT 'general',
  parent_id TEXT,
  author_id TEXT,
  is_published INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;

async function run() {
  console.log('Connecting to Supabase...');

  try {
    await sql.unsafe(migration);
    console.log('All tables and columns created successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    await sql.end();
    process.exit(1);
  }

  // Verify tables exist
  const tables = await sql`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN ('nuclei','nucleus_projects','project_deliverables','portfolio_positions','events','event_attendees','competitions','wiki_pages')
    ORDER BY tablename
  `;
  console.log(`\nVerified ${tables.length} new tables:`);
  for (const t of tables) {
    console.log(`  - ${t.tablename}`);
  }

  // Verify new columns on users
  const cols = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'users'
    AND column_name IN ('avatar_url','course','semester','member_status','nucleus_id','joined_at','linkedin_url','bio','points')
    ORDER BY column_name
  `;
  console.log(`\nVerified ${cols.length} new columns on users:`);
  for (const c of cols) {
    console.log(`  - ${c.column_name}`);
  }
  await sql.end();
  process.exit(errors > 0 ? 1 : 0);
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
