import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { RARITY_WEIGHT } from "@/lib/seed";

export const runtime = "nodejs";

export async function PUT(
  _req: NextRequest,
  { params }: { params: Promise<{ discord_user_id: string }> },
) {
  const { discord_user_id: id } = await params;
  const db = await getDb();
  const profiles = db.collection("profiles");

  const profile = await profiles.findOne(
    { discord_user_id: id },
    { projection: { _id: 0 } },
  );

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const inventory = profile.inventory || [];
  const best: Record<string, string | null> = {
    head: null,
    shoulders: null,
    chest: null,
    hands: null,
    legs: null,
    feet: null,
    main_hand: null,
    off_hand: null,
  };

  const bySlot: Record<string, any[]> = {};
  for (const it of inventory) {
    bySlot[it.slot] = bySlot[it.slot] || [];
    bySlot[it.slot].push(it);
  }

  for (const slot of Object.keys(bySlot)) {
    const items = bySlot[slot];
    items.sort((a, b) => {
      const wa = RARITY_WEIGHT[a.rarity as keyof typeof RARITY_WEIGHT] || 0;
      const wb = RARITY_WEIGHT[b.rarity as keyof typeof RARITY_WEIGHT] || 0;
      if (wa !== wb) return wb - wa;
      return String(b.name).localeCompare(String(a.name));
    });
    best[slot] = items[0]?.item_id ?? null;
  }

  const updated_at = new Date().toISOString();

  await profiles.updateOne(
    { discord_user_id: id },
    { $set: { equipped: best, updated_at } },
  );

  const doc = await profiles.findOne(
    { discord_user_id: id },
    { projection: { _id: 0 } },
  );

  return NextResponse.json(doc);
}
