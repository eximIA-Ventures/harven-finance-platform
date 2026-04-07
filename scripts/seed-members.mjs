/**
 * Seed initial members into the users table.
 * Run: node scripts/seed-members.mjs
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createHash, randomUUID } from "crypto";
import postgres from "postgres";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local
const envPath = resolve(__dirname, "..", ".env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx);
  const val = trimmed.slice(eqIdx + 1);
  if (!process.env[key]) process.env[key] = val;
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("ERROR: DATABASE_URL not found in .env.local");
  process.exit(1);
}

const sql = postgres(databaseUrl, { ssl: "require" });

const passwordHash = createHash("sha256").update("membro2026").digest("hex");

const members = [
  {
    name: "Carlos Silva",
    email: "carlos@aluno.harven.edu.br",
    course: "ADM",
    semester: "2024.1",
    member_status: "coordenador",
    joined_at: "2024-08-01",
  },
  {
    name: "Ana Lima",
    email: "ana@aluno.harven.edu.br",
    course: "AGRO",
    semester: "2024.1",
    member_status: "coordenador",
    joined_at: "2024-08-01",
  },
  {
    name: "Pedro Santos",
    email: "pedro@aluno.harven.edu.br",
    course: "ADM",
    semester: "2024.2",
    member_status: "membro",
    joined_at: "2025-02-01",
  },
  {
    name: "Julia Costa",
    email: "julia@aluno.harven.edu.br",
    course: "AGRO",
    semester: "2025.1",
    member_status: "membro",
    joined_at: "2025-08-01",
  },
  {
    name: "Lucas Mendes",
    email: "lucas@aluno.harven.edu.br",
    course: "ADM",
    semester: "2025.1",
    member_status: "membro",
    joined_at: "2025-08-01",
  },
  {
    name: "Bruna Kato",
    email: "bruna@aluno.harven.edu.br",
    course: "AGRO",
    semester: "2025.2",
    member_status: "trainee",
    joined_at: "2026-02-01",
  },
  {
    name: "Rafael Torres",
    email: "rafael@aluno.harven.edu.br",
    course: "ADM",
    semester: "2025.2",
    member_status: "trainee",
    joined_at: "2026-02-01",
  },
  {
    name: "Maria Oliveira",
    email: "maria@aluno.harven.edu.br",
    course: "AGRO",
    semester: "2024.1",
    member_status: "alumni",
    joined_at: "2023-08-01",
  },
];

async function run() {
  console.log("Seeding members...\n");
  const now = new Date().toISOString();

  for (const m of members) {
    const id = randomUUID().slice(0, 8);

    // Upsert: skip if email already exists
    const existing =
      await sql`SELECT id FROM users WHERE email = ${m.email.toLowerCase()}`;
    if (existing.length > 0) {
      console.log(`  SKIP ${m.name} (${m.email}) — already exists`);
      // Update member columns even if user exists
      await sql`
        UPDATE users SET
          course = ${m.course},
          semester = ${m.semester},
          member_status = ${m.member_status},
          joined_at = ${m.joined_at},
          type = 'member'
        WHERE email = ${m.email.toLowerCase()}
      `;
      continue;
    }

    await sql`
      INSERT INTO users (id, email, password_hash, name, type, permissions, created_at, course, semester, member_status, joined_at)
      VALUES (${id}, ${m.email.toLowerCase()}, ${passwordHash}, ${m.name}, 'member', '[]', ${now}, ${m.course}, ${m.semester}, ${m.member_status}, ${m.joined_at})
    `;
    console.log(`  OK   ${m.name} (${m.email}) — id: ${id}`);
  }

  console.log(`\nDone. ${members.length} members processed.`);
  await sql.end();
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
