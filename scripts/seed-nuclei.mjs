/**
 * Seed nuclei (research groups) into the nuclei table.
 * Run: node scripts/seed-nuclei.mjs
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
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

const nucleiData = [
  {
    id: randomUUID().slice(0, 8),
    name: "Equity Research",
    slug: "equity-research",
    description: "Analise e valuation de empresas listadas",
    color: "#C4A882",
  },
  {
    id: randomUUID().slice(0, 8),
    name: "Global Macro",
    slug: "global-macro",
    description: "Analise macroeconomica e cenarios",
    color: "#7C9E8F",
  },
  {
    id: randomUUID().slice(0, 8),
    name: "M&A e Private Equity",
    slug: "ma-private-equity",
    description: "Fusoes, aquisicoes e investimentos privados",
    color: "#8B9CC4",
  },
  {
    id: randomUUID().slice(0, 8),
    name: "Renda Fixa",
    slug: "renda-fixa",
    description: "Titulos publicos, credito e derivativos",
    color: "#C48BB4",
  },
  {
    id: randomUUID().slice(0, 8),
    name: "Quantitativo",
    slug: "quantitativo",
    description: "Estrategias quantitativas e backtesting",
    color: "#4b9560",
  },
];

async function seed() {
  console.log("Seeding nuclei...");

  for (const n of nucleiData) {
    // Upsert: skip if slug already exists
    const existing = await sql`SELECT id FROM nuclei WHERE slug = ${n.slug}`;
    if (existing.length > 0) {
      console.log(`  [skip] ${n.name} (already exists)`);
      continue;
    }

    await sql`
      INSERT INTO nuclei (id, name, slug, description, color, created_at)
      VALUES (${n.id}, ${n.name}, ${n.slug}, ${n.description}, ${n.color}, ${new Date().toISOString()})
    `;
    console.log(`  [ok] ${n.name}`);
  }

  console.log("Done. Seeded nuclei.");
  await sql.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
