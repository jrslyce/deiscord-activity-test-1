import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { emptyEquipped, seedInventory } from "@/lib/seed";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
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
      const updated = await profiles.findOne(
        { discord_user_id },
        { projection: { _id: 0 } },
      );
      return NextResponse.json(updated);
    }

    const newProfile = {
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
    };

    await profiles.insertOne(newProfile);

    return NextResponse.json(newProfile);
  } catch (error) {
    console.error("Profile upsert error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error stack:", errorStack);
    return NextResponse.json(
      { error: errorMessage, details: errorStack },
      { status: 500 },
    );
  }
}
