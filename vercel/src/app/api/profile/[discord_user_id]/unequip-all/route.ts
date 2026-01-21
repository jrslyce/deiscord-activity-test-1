import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { emptyEquipped } from "@/lib/seed";

export const runtime = "nodejs";

export async function PUT(
  _req: Request,
  { params }: { params: { discord_user_id: string } },
) {
  const id = params.discord_user_id;
  const db = await getDb();
  const profiles = db.collection("profiles");

  const updated_at = new Date().toISOString();

  const res = await profiles.updateOne(
    { discord_user_id: id },
    { $set: { equipped: emptyEquipped(), updated_at } },
  );

  if (res.matchedCount === 0) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const doc = await profiles.findOne(
    { discord_user_id: id },
    { projection: { _id: 0 } },
  );

  return NextResponse.json(doc);
}
