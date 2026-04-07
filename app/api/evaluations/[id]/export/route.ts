import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { candidates, teams, consolidatedResults } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireMember } from "@/lib/api-auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireMember("view_reports");
    if (!auth.ok) return auth.response;

    const { id } = await params;

    const candidateList = await db.query.candidates.findMany({
      where: eq(candidates.evaluationId, id),
    });
    const teamList = await db.query.teams.findMany({
      where: eq(teams.evaluationId, id),
    });

    let csv =
      "Nome,Email,Turma,Equipe,Nota IA,Nota Banca,Nota Final,Classificacao\n";

    for (const c of candidateList) {
      const team = teamList.find((t) => t.id === c.teamId);
      let aiScore = "";
      let humanScore = "";
      let finalScore = "";
      let classification = "";

      if (c.teamId) {
        const result = await db.query.consolidatedResults.findFirst({
          where: eq(consolidatedResults.teamId, c.teamId),
        });
        if (result) {
          aiScore = result.aiScore?.toString() || "";
          humanScore = result.humanScore?.toString() || "";
          finalScore = result.finalScore?.toString() || "";
          classification = result.classification || "";
        }
      }

      csv += `"${c.name}","${c.email}","${c.group || ""}",${team?.number || ""},${aiScore},${humanScore},${finalScore},"${classification}"\n`;
    }

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=candidatos-${id}.csv`,
      },
    });
  } catch (error) {
    console.error("Failed to export candidates:", error);
    return NextResponse.json({ error: "Failed to export" }, { status: 500 });
  }
}
