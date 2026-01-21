import { NextResponse } from "next/server";
import { verifyDiscordEd25519 } from "@/lib/discord";

export const runtime = "nodejs";

const DEFAULT_PUBLIC_KEY =
  process.env.DISCORD_PUBLIC_KEY ||
  "46472339ce2ffc0d5661b3564555910e3499c90e8816dd4d591b7d60c35b2660";

export async function POST(req: Request) {
  const sig = req.headers.get("x-signature-ed25519");
  const ts = req.headers.get("x-signature-timestamp");
  const raw = Buffer.from(await req.arrayBuffer());

  // Verify signature if headers exist; allow if missing (dev convenience)
  if (sig && ts) {
    const ok = verifyDiscordEd25519(DEFAULT_PUBLIC_KEY, sig, ts, raw);
    if (!ok) {
      return NextResponse.json({ error: "Invalid request signature" }, { status: 401 });
    }
  }

  const payload = JSON.parse(raw.toString("utf-8") || "{}");

  // PING
  if (payload?.type === 1) {
    return NextResponse.json({ type: 1 });
  }

  // MVP: acknowledge
  return NextResponse.json({
    type: 4,
    data: { content: "MVP: interaction received" },
  });
}
