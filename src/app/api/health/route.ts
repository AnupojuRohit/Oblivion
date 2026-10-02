import { NextResponse } from "next/server";
import { connectToDatabase } from "@/infrastructure/mongodb/connection";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDatabase();
    return NextResponse.json({ success: true, data: { status: "ok", database: "ok" } }, { status: 200 });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "DATABASE_UNAVAILABLE", message: "Database health check failed" } },
      { status: 503 },
    );
  }
}
