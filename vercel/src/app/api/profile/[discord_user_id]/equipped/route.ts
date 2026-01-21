import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export const runtime = "nodejs";

export async function PUT(
  req: Request,
  { params }: { params: { discord_user_id: string } },
) {
  const id = params.discord_user_id;
  const body = await req.json();

  const { slot, item_id, equipped } = body || {};

  const db = await getDb();
  const profiles = db.collection("profiles");

  const existing = await profiles.findOne(
    { discord_user_id: id },
    { projection: { _id: 0 } },
  );
  if (!existing) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const updated_at = new Date().toISOString();

  let newEquipped = existing.equipped || {};
  if (equipped) {
    newEquipped = equipped;
  } else {
    if (!slot) {
      return NextResponse.json({ error: "slot is required" }, { status: 400 });
    }
    newEquipped = { ...newEquipped, [slot]: item_id ?? null };
  }

  await profiles.updateOne(
    { discord_user_id: id },
    { $set: { equipped: newEquipped, updated_at } },
  );

  const doc = await profiles.findOne(
    { discord_user_id: id },
    { projection: { _id: 0 } },
  );

  return NextResponse.json(doc);
}
