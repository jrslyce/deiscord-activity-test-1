import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { emptyEquipped, seedInventory } from "@/lib/seed";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json();
  const { discord_user_id, username, avatar } = body || {};

  if (!discord_user_id || !username) {
    return NextResponse.json(
      { error: "discord_user_id and username are required" },
      { status: 400 },
    );
  }

  const db = await getDb();
  const profiles = db.collection("profiles");

  const now = new Date().toISOString();

  const existing = await profiles.findOne({ discord_user_id });
  if (existing) {
    await profiles.updateOne(
      { discord_user_id },
      { $set: { username, avatar: avatar ?? null, updated_at: now } },
    );
    return NextResponse.json({ ok: true });
  }

  await profiles.insertOne({
    discord_user_id,
    username,
    avatar: avatar ?? null,
    created_at: now,
    updated_at: now,
    base_stats: {
      strength: 10,
      vitality: 10,
      dexterity: 10,
      intelligence: 10,
      mind: 10,
    },
    inventory: seedInventory(),
    equipped: emptyEquipped(),
  });

  return NextResponse.json({ ok: true });
}
