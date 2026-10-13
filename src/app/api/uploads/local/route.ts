import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/helpers";
import { localStorage } from "@/infrastructure/storage/local-storage";

export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  try {
    await requireUser();
    const url = new URL(request.url);
    const key = url.searchParams.get("key");

    if (!key) {
      return NextResponse.json({ success: false, error: { message: "Storage key is required" } }, { status: 400 });
    }

    const contentType = request.headers.get("content-type") || "application/octet-stream";
    const buffer = Buffer.from(await request.arrayBuffer());

    await localStorage.save({
      key,
      body: buffer,
      contentType,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { message: error instanceof Error ? error.message : "Upload failed" } },
      { status: 500 }
    );
  }
}
