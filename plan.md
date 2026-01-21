# Discord Activity – Equip Detail MVP Plan

## Goal
Build a Discord Activity (Embedded App SDK) that recreates the **Equip Detail** screen in a cyberpunk/sci‑fi style with interactive equipment management, Discord authentication, and MongoDB persistence.

## Architecture (MVP)
- **Frontend**: React + Tailwind + shadcn/ui
  - Runs both inside Discord Activity iframe **and** in a regular browser (Dev/Test mode).
  - Uses `process.env.REACT_APP_BACKEND_URL` for API calls.
- **Backend**: FastAPI
  - API is served under `/api/*`.
  - Uses MongoDB via `MONGO_URL` from `backend/.env`.
  - Provides persistence for user profile, inventory, and equipped loadout.
  - Provides stub endpoints required by Discord Developer Portal URLs:
    - `/api/interactions`
    - `/api/verify`
- **Database**: MongoDB
  - Single `profiles` collection for MVP (simpler than multiple collections).

## Data Model (MongoDB)
Collection: `profiles`
```json
{
  "discord_user_id": "123" | "dev-...",
  "username": "...",
  "avatar": "https://..." | null,
  "created_at": "ISO",
  "updated_at": "ISO",
  "base_stats": {
    "strength": 10,
    "vitality": 10,
    "dexterity": 10,
    "intelligence": 10,
    "mind": 10
  },
  "inventory": [
    {
      "item_id": "uuid",
      "slot": "head" | "shoulders" | "chest" | "hands" | "legs" | "feet" | "main_hand" | "off_hand",
      "name": "...",
      "rarity": "common" | "epic" | "legendary",
      "stat_bonus": {"strength": 2, "vitality": 0, "dexterity": 0, "intelligence": 0, "mind": 0}
    }
  ],
  "equipped": {
    "head": "item_id" | null,
    "shoulders": null,
    "chest": null,
    "hands": null,
    "legs": null,
    "feet": null,
    "main_hand": null,
    "off_hand": null
  }
}
```

## Backend APIs (MVP)
### Required by app
- `GET /api/` → sanity check
- `POST /api/profile/upsert` → create/update profile; seeds inventory if new
- `GET /api/profile/{discord_user_id}` → fetch profile
- `PUT /api/profile/{discord_user_id}/equipped` → update equipped mapping
- `PUT /api/profile/{discord_user_id}/unequip-all` → clear all slots
- `PUT /api/profile/{discord_user_id}/auto-equip` → equip best item per slot (by rarity)

### Discord portal URLs (stubbed for MVP)
- `POST /api/interactions` → validates signature when possible and responds to PING
- `GET /api/verify` → simple “ok” response

## Frontend Flows
1. **Boot**
   - Detect if running in Discord Activity context.
   - If Discord:
     - Initialize `DiscordSDK(CLIENT_ID)`
     - `await discordSdk.ready()`
     - `authorize({ scopes: ['identify','guilds'] })`
     - `authenticate({ code })`
     - Set `auth.user` into state.
   - If Browser:
     - Show a Dev login (username input) and create a mock user id.
2. **Profile Sync**
   - Call `POST /api/profile/upsert` with `{discord_user_id, username, avatar}`.
   - Then `GET /api/profile/{id}` to hydrate inventory + equipped.
3. **Equip UI**
   - Equipment slots around center character.
   - Clicking a slot opens a slide-in panel listing items for that slot.
   - Clicking an item equips it, updates computed stats, persists via `PUT /equipped`.
4. **Actions**
   - Auto‑Equip: calls backend auto-equip.
   - Unequip All: clears all slots.
   - Share Loadout: in Discord uses `discordSdk.commands.setActivity(...)` (best-effort; errors handled gracefully). In browser mode shows toast.
5. **Extra Pages**
   - `/terms` and `/privacy` routes.

## UI/UX Notes
- Dark glassmorphism panels (`backdrop-blur`) + dotted grid background.
- Cyberpunk cyan accent: `#00e5ff`.
- No centered text alignment; readable, left-aligned typography.
- Every interactive element + critical display includes `data-testid`.

## Testing Approach
- Automated E2E via `testing_agent_v3`:
  - App loads in browser mode.
  - Dev login works.
  - Slots open panel.
  - Equip item updates slot + stats.
  - Auto-equip and unequip-all work.
  - Terms/Privacy pages load.
- Basic backend checks via curl (sanity + profile persistence).

