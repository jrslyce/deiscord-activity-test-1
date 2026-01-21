import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { code, redirect_uri } = (await req.json()) as {
    code?: string;
    redirect_uri?: string;
  };

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Missing DISCORD_CLIENT_ID / DISCORD_CLIENT_SECRET" },
      { status: 400 },
    );
  }

  if (!code || !redirect_uri) {
    return NextResponse.json(
      { error: "code and redirect_uri are required" },
      { status: 400 },
    );
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri,
  });

  const resp = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!resp.ok) {
    const t = await resp.text();
    return NextResponse.json(
      { error: "Discord token exchange failed", details: t },
      { status: 400 },
    );
  }

  const json = await resp.json();
  return NextResponse.json(json);
}
