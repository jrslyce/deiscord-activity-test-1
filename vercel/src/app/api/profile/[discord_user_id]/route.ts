import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ discord_user_id: string }> },
) {
  const { discord_user_id: id } = await params;
  const db = await getDb();
  const profiles = db.collection("profiles");

  const doc = await profiles.findOne(
    { discord_user_id: id },
    { projection: { _id: 0 } },
  );

  if (!doc) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json(doc);
}
