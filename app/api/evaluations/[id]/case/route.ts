import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { uploadCaseFile } from "@/lib/actions/evaluations";
import { requireMember } from "@/lib/api-auth";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireMember("manage_eval");
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Arquivo excede 10MB" }, { status: 400 });
    }

    if (ALLOWED_TYPES.length > 0 && !ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Tipo de arquivo não permitido. Use PDF ou DOCX." }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `case-${id}-${sanitizedName}`;
    const filePath = path.join(uploadsDir, fileName);
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    const fileUrl = `/uploads/${fileName}`;
    await uploadCaseFile(id, file.name, fileUrl);

    return NextResponse.json({ url: fileUrl });
  } catch (error) {
    console.error("Upload failed:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
