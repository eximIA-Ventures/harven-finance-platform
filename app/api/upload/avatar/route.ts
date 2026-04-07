import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET = "avatars";

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, WebP and GIF are allowed" },
        { status: 400 }
      );
    }

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "File must be under 2MB" }, { status: 400 });
    }

    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${auth.user.id}-${Date.now()}.${ext}`;

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
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${fileName}`;

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
