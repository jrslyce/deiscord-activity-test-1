# Equip Detail (Next.js + MongoDB) – Vercel Single-Deploy

This folder contains the **single-deploy** version of the Equip Detail Discord Activity:
- **Next.js App Router** frontend
- **Next.js API routes** for all backend endpoints
- **MongoDB** persistence (via `MONGODB_URI`)

## Local dev
```bash
cd vercel
npm install
# set env vars (see .env.example)
npm run dev
```

## Deploy on Vercel
Create a Vercel project from this repo and set:
- **Root Directory**: `vercel`
- Framework: Next.js (auto)

### Environment variables (Vercel → Project → Settings → Environment Variables)
- `MONGODB_URI` (required)
- `DB_NAME` (optional)
- `DISCORD_CLIENT_ID` (recommended)
- `DISCORD_CLIENT_SECRET` (required for Discord OAuth)
- `NEXT_PUBLIC_DISCORD_CLIENT_ID` (recommended)
- `DISCORD_PUBLIC_KEY` (recommended)

## Discord Developer Portal URLs (after deployment)
If your deployed URL is `https://YOUR_VERCEL_URL`:
- Interactions Endpoint URL: `https://YOUR_VERCEL_URL/api/interactions`
- Linked Roles Verification URL: `https://YOUR_VERCEL_URL/api/verify`
- Terms of Service URL: `https://YOUR_VERCEL_URL/terms`
- Privacy Policy URL: `https://YOUR_VERCEL_URL/privacy`
