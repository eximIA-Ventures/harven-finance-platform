import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET = "journey-files";

const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MAX_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Arquivo obrigatorio" }, { status: 400 });
    }

    if (!ALLOWED_TYPES[file.type]) {
      return NextResponse.json(
        { error: `Tipo nao permitido. Use: ${Object.values(ALLOWED_TYPES).join(", ").toUpperCase()}` },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Arquivo excede 50MB" }, { status: 400 });
    }

    const ext = ALLOWED_TYPES[file.type] || "bin";
    const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `${auth.user.id}-${Date.now()}-${sanitized}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadRes = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${fileName}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          "Content-Type": file.type,
          "x-upsert": "true",
        },
        body: buffer,
      }
    );

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      console.error("Supabase upload error:", err);
      return NextResponse.json({ error: "Upload falhou" }, { status: 500 });
    }

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${fileName}`;

    return NextResponse.json({
      url: publicUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: ext,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload falhou" }, { status: 500 });
  }
}
