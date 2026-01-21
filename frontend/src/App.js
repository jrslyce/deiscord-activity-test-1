import React, { useEffect, useMemo, useState } from "react";
import "@/App.css";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import axios from "axios";
import { DiscordSDK } from "@discord/embedded-app-sdk";
import { AnimatePresence, motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Toaster, toast } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CLIENT_ID = "1463607375331332223";

const SLOT_ORDER = [
  "head",
  "shoulders",
  "chest",
  "hands",
  "legs",
  "feet",
  "main_hand",
  "off_hand",
];

const SLOT_LABEL = {
  head: "Head",
  shoulders: "Shoulders",
  chest: "Chest",
  hands: "Hands",
  legs: "Legs",
  feet: "Feet",
  main_hand: "Main Hand",
  off_hand: "Off-Hand",
};

const RARITY_UI = {
  common: {
    label: "Common",
    className: "bg-zinc-800/80 text-zinc-100 border-zinc-600/60",
    glow: "shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
  },
  epic: {
    label: "Epic",
    className: "bg-violet-950/60 text-violet-100 border-violet-400/40",
    glow: "shadow-[0_0_16px_rgba(168,85,247,0.35)]",
  },
  legendary: {
    label: "Legendary",
    className: "bg-amber-950/50 text-amber-100 border-amber-400/40",
    glow: "shadow-[0_0_18px_rgba(251,191,36,0.35)]",
  },
};

function safeHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(16);
}

function isProbablyDiscordActivity() {
  const host = window.location.hostname || "";
  if (host.endsWith("discordsays.com")) return true;
  if (window.location.search.includes("frame_id")) return true;
  try {
    const origins = window.location.ancestorOrigins;
    if (origins && origins.length > 0 && origins[0].includes("discord")) return true;
  } catch {
    // ignore
  }
  return false;
}

function computeTotalStats(profile) {
  const base = profile?.base_stats || {
    strength: 0,
    vitality: 0,
    dexterity: 0,
    intelligence: 0,
    mind: 0,
  };
  const equipped = profile?.equipped || {};
  const inv = profile?.inventory || [];

  const byId = new Map(inv.map((i) => [i.item_id, i]));
  const sum = { ...base };

  Object.values(equipped).forEach((itemId) => {
    if (!itemId) return;
    const it = byId.get(itemId);
    if (!it) return;
    const b = it.stat_bonus || {};
    sum.strength += b.strength || 0;
    sum.vitality += b.vitality || 0;
    sum.dexterity += b.dexterity || 0;
    sum.intelligence += b.intelligence || 0;
    sum.mind += b.mind || 0;
  });

  return sum;
}

function StatRing({ label, value, max = 25, accent = "#00e5ff", testId }) {
  const pct = Math.max(0, Math.min(1, value / max));
  const r = 18;
  const c = 2 * Math.PI * r;
  const dash = c * pct;
  const gap = c - dash;

  return (
    <div
      className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
      data-testid={testId}
    >
      <div className="relative h-12 w-12">
        <svg
          viewBox="0 0 48 48"
          className="h-12 w-12"
          aria-hidden="true"
          data-testid={`${testId}-ring`}
        >
          <circle
            cx="24"
            cy="24"
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.10)"
            strokeWidth="4"
          />
          <circle
            cx="24"
            cy="24"
            r={r}
            fill="none"
            stroke={accent}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${gap}`}
            transform="rotate(-90 24 24)"
            style={{ filter: "drop-shadow(0 0 10px rgba(0,229,255,0.35))" }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div
            className="text-sm font-semibold text-white"
            data-testid={`${testId}-value`}
          >
            {value}
          </div>
        </div>
      </div>
      <div className="min-w-0">
        <div className="text-xs tracking-wide text-zinc-300">{label}</div>
        <div className="text-[11px] text-zinc-500">Total rating</div>
      </div>
    </div>
  );
}

function DevLogin({ onContinue }) {
  const [name, setName] = useState("Pilot");

  return (
    <div
      className="min-h-screen bg-[#07090b] text-white"
      data-testid="dev-login-screen"
    >
      <div className="mx-auto max-w-xl px-6 py-10">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur">
          <div className="text-2xl font-semibold" data-testid="dev-login-title">
            Equip Detail (Browser Mode)
          </div>
          <p className="mt-2 text-sm text-zinc-300" data-testid="dev-login-subtitle">
            Discord Activity context not detected. Enter a name to continue in dev
            mode.
          </p>

          <div className="mt-6 space-y-2">
            <label className="text-xs text-zinc-400" htmlFor="dev-name">
              Username
            </label>
            <Input
              id="dev-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-black/30 border-white/10"
              data-testid="dev-login-username-input"
            />
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="text-xs text-zinc-500" data-testid="dev-login-hint">
              Tip: deploy to test Discord auth inside Activities.
            </div>
            <Button
              onClick={() => onContinue(name)}
              className="rounded-full bg-cyan-400/15 text-cyan-200 border border-cyan-400/20 hover:bg-cyan-400/20"
              data-testid="dev-login-continue-button"
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Terms() {
  return (
    <div className="min-h-screen bg-[#07090b] text-white" data-testid="terms-page">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold" data-testid="terms-title">
          Terms of Service
        </h1>
        <p className="mt-6 text-base text-zinc-300" data-testid="terms-body">
          This is a placeholder Terms of Service page for the Equip Detail Discord
          Activity MVP.
        </p>
      </div>
    </div>
  );
}

function Privacy() {
  return (
    <div
      className="min-h-screen bg-[#07090b] text-white"
      data-testid="privacy-page"
    >
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1
          className="text-4xl sm:text-5xl lg:text-6xl font-semibold"
          data-testid="privacy-title"
        >
          Privacy Policy
        </h1>
        <p className="mt-6 text-base text-zinc-300" data-testid="privacy-body">
          This is a placeholder Privacy Policy page for the Equip Detail Discord
          Activity MVP.
        </p>
      </div>
    </div>
  );
}

function SlotChip({ slot, equippedItem, onClick }) {
  const rarity = equippedItem?.rarity || "common";
  const ui = RARITY_UI[rarity];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`slot-frame group relative w-full rounded-xl border bg-black/25 px-3 py-2 text-left backdrop-blur ${
        equippedItem ? ui.glow : ""
      }`}
      data-testid={`equipment-slot-${slot}-button`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div
            className="text-[11px] uppercase tracking-[0.22em] text-zinc-400"
            data-testid={`equipment-slot-${slot}-label`}
          >
            {SLOT_LABEL[slot]}
          </div>
          <div
            className="mt-1 truncate text-sm font-medium text-white"
            data-testid={`equipment-slot-${slot}-value`}
          >
            {equippedItem ? equippedItem.name : "Empty"}
          </div>
        </div>
        <div className="shrink-0">
          {equippedItem ? (
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${ui.className}`}
              data-testid={`equipment-slot-${slot}-rarity`}
            >
              {ui.label}
            </span>
          ) : (
            <span
              className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] text-zinc-300"
              data-testid={`equipment-slot-${slot}-empty-badge`}
            >
              —
            </span>
          )}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-cyan-300/0 group-hover:ring-cyan-300/20" />
    </button>
  );
}

function ItemRow({ item, onEquip }) {
  const ui = RARITY_UI[item.rarity];
  const bonuses = item.stat_bonus || {};
  const bonusParts = Object.entries(bonuses)
    .filter(([, v]) => (v || 0) !== 0)
    .map(([k, v]) => `${k.replace("_", " ")}: +${v}`);

  return (
    <div
      className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
      data-testid={`inventory-item-${item.item_id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div
              className="truncate text-sm font-semibold text-white"
              data-testid={`inventory-item-${item.item_id}-name`}
            >
              {item.name}
            </div>
            <Badge
              variant="outline"
              className={`text-[11px] ${ui.className}`}
              data-testid={`inventory-item-${item.item_id}-rarity`}
            >
              {ui.label}
            </Badge>
          </div>
          <div
            className="mt-1 text-xs text-zinc-400"
            data-testid={`inventory-item-${item.item_id}-bonuses`}
          >
            {bonusParts.length > 0 ? bonusParts.join("  ") : "No bonuses"}
          </div>
        </div>
        <Button
          onClick={onEquip}
          className="rounded-full bg-cyan-400/15 text-cyan-200 border border-cyan-400/20 hover:bg-cyan-400/20"
          data-testid={`inventory-item-${item.item_id}-equip-button`}
        >
          Equip
        </Button>
      </div>
    </div>
  );
}

function EquipDetailScreen() {
  const [bootStatus, setBootStatus] = useState("booting"); // booting | need-dev-login | loading | ready | error
  const [mode, setMode] = useState("unknown"); // discord | browser

  const [discordSdk, setDiscordSdk] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [teamName, setTeamName] = useState("SFC TEAM");

  const [profile, setProfile] = useState(null);
  const [activeSlot, setActiveSlot] = useState(null);

  const navigate = useNavigate();

  const totalStats = useMemo(() => computeTotalStats(profile), [profile]);

  const equippedItemsBySlot = useMemo(() => {
    const inv = profile?.inventory || [];
    const byId = new Map(inv.map((i) => [i.item_id, i]));
    const equipped = profile?.equipped || {};

    const out = {};
    SLOT_ORDER.forEach((slot) => {
      const id = equipped[slot];
      out[slot] = id ? byId.get(id) : null;
    });
    return out;
  }, [profile]);

  const itemsForActiveSlot = useMemo(() => {
    if (!activeSlot) return [];
    return (profile?.inventory || []).filter((i) => i.slot === activeSlot);
  }, [profile, activeSlot]);

  async function syncProfile(user) {
    await axios.post(`${API}/profile/upsert`, {
      discord_user_id: user.id,
      username: user.username,
      avatar: user.avatar || null,
    });
    const res = await axios.get(`${API}/profile/${encodeURIComponent(user.id)}`);
    setProfile(res.data);
  }

  async function setupDiscord() {
    const sdk = new DiscordSDK(CLIENT_ID);
    setDiscordSdk(sdk);

    await sdk.ready();

    // Authorize (Activity OAuth modal)
    const { code } = await sdk.commands.authorize({
      client_id: CLIENT_ID,
      response_type: "code",
      state: "",
      prompt: "none",
      scope: ["identify", "guilds"],
    });

    // Exchange code via our backend (needs DISCORD_CLIENT_SECRET)
    const tokenResp = await axios.post(`${API}/discord/token`, {
      code,
      redirect_uri: window.location.origin,
    });

    const accessToken = tokenResp.data.access_token;

    const auth = await sdk.commands.authenticate({
      access_token: accessToken,
    });

    if (!auth?.user) {
      throw new Error("Discord authenticate did not return user");
    }

    const user = {
      id: auth.user.id,
      username: auth.user.username,
      avatar: auth.user.avatar
        ? `https://cdn.discordapp.com/avatars/${auth.user.id}/${auth.user.avatar}.png?size=128`
        : null,
    };
    setAuthUser(user);

    // Best-effort channel fetch
    try {
      const channelId = sdk.channelId;
      if (channelId) {
        const ch = await sdk.commands.getChannel({ channel_id: channelId });
        if (ch?.name) setTeamName(ch.name);
      }
    } catch {
      // ignore
    }

    await syncProfile(user);
  }

  async function setupBrowserDev(devName) {
    const user = {
      id: `dev-${safeHash(devName)}`,
      username: devName,
      avatar: null,
    };
    setAuthUser(user);
    await syncProfile(user);
  }

  useEffect(() => {
    let mounted = true;

    async function boot() {
      try {
        const discord = isProbablyDiscordActivity();
        if (discord) {
          setMode("discord");
          setBootStatus("loading");
          await setupDiscord();
          if (!mounted) return;
          setBootStatus("ready");
          return;
        }

        setMode("browser");
        setBootStatus("need-dev-login");
      } catch (e) {
        console.error(e);
        toast.error("Failed to initialize Discord auth", {
          description:
            "If testing in browser, use Browser Mode. If in Discord, ensure backend has DISCORD_CLIENT_SECRET configured.",
        });
        setMode("browser");
        setBootStatus("need-dev-login");
      }
    }

    boot();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function equipItem(slot, itemId) {
    if (!authUser) return;
    const res = await axios.put(`${API}/profile/${encodeURIComponent(authUser.id)}/equipped`, {
      slot,
      item_id: itemId,
    });
    setProfile(res.data);
    toast.success("Equipped", {
      description: `Updated ${SLOT_LABEL[slot]}.`,
    });
  }

  async function unequipAll() {
    if (!authUser) return;
    const res = await axios.put(
      `${API}/profile/${encodeURIComponent(authUser.id)}/unequip-all`,
      {},
    );
    setProfile(res.data);
    toast("Unequipped", { description: "All slots cleared." });
  }

  async function autoEquip() {
    if (!authUser) return;
    const res = await axios.put(
      `${API}/profile/${encodeURIComponent(authUser.id)}/auto-equip`,
      {},
    );
    setProfile(res.data);
    toast("Auto-equipped", { description: "Best items equipped by rarity." });
  }

  async function shareLoadout() {
    if (mode !== "discord" || !discordSdk) {
      toast("Share Loadout", {
        description: "In Browser Mode this is a preview. In Discord it will set activity.",
      });
      return;
    }

    try {
      const state = `Loadout: ${Object.entries(profile?.equipped || {})
        .filter(([, v]) => Boolean(v))
        .length} slots`;

      await discordSdk.commands.setActivity({
        activity: {
          state,
          details: "Equip Detail",
        },
      });

      toast.success("Shared", { description: "Activity updated." });
    } catch (e) {
      console.error(e);
      toast.error("Share failed", {
        description:
          "Discord setActivity may require additional permissions/config. This is best-effort in MVP.",
      });
    }
  }

  if (bootStatus === "need-dev-login") {
    return (
      <DevLogin
        onContinue={async (name) => {
          setBootStatus("loading");
          await setupBrowserDev(name);
          setBootStatus("ready");
        }}
      />
    );
  }

  if (bootStatus !== "ready") {
    return (
      <div
        className="min-h-screen bg-[#07090b] text-white"
        data-testid="loading-screen"
      >
        <div className="mx-auto max-w-4xl px-6 py-10">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur">
            <div className="text-base text-zinc-200" data-testid="loading-text">
              Loading…
            </div>
            <div
              className="mt-2 text-sm text-zinc-500"
              data-testid="loading-subtext"
            >
              Initializing Discord Activity session.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const userAvatar = authUser?.avatar;

  return (
    <div className="min-h-screen equip-bg text-white" data-testid="equip-detail-root">
      <Toaster richColors />

      {/* Safe areas for Discord overlay */}
      <div className="px-5 pt-5 pb-20">
        <div className="mx-auto w-full max-w-7xl">
          {/* Top Bar */}
          <div
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur"
            data-testid="top-bar"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-cyan-400/10 ring-1 ring-inset ring-cyan-300/20" />
              <div>
                <div
                  className="text-xs uppercase tracking-[0.28em] text-zinc-400"
                  data-testid="top-bar-team-label"
                >
                  Team Name
                </div>
                <div
                  className="text-lg font-semibold text-white"
                  data-testid="top-bar-team-name"
                >
                  {teamName}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                className="rounded-full border border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
                onClick={() => navigate("/terms")}
                data-testid="top-bar-terms-button"
              >
                Terms
              </Button>
              <Button
                variant="ghost"
                className="rounded-full border border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
                onClick={() => navigate("/privacy")}
                data-testid="top-bar-privacy-button"
              >
                Privacy
              </Button>

              <div
                className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5"
                data-testid="user-profile-pill"
              >
                <div
                  className="h-8 w-8 overflow-hidden rounded-full bg-white/10"
                  data-testid="user-profile-avatar"
                >
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt="User avatar"
                      className="h-full w-full object-cover"
                      data-testid="user-profile-avatar-img"
                    />
                  ) : (
                    <div
                      className="h-full w-full bg-gradient-to-br from-cyan-400/20 to-fuchsia-400/10"
                      data-testid="user-profile-avatar-fallback"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <div
                    className="text-xs uppercase tracking-[0.24em] text-zinc-400"
                    data-testid="user-profile-mode"
                  >
                    {mode === "discord" ? "Discord" : "Browser"}
                  </div>
                  <div
                    className="truncate text-sm font-semibold"
                    data-testid="user-profile-username"
                  >
                    {authUser?.username}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
            {/* Sidebar Stats */}
            <div
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur"
              data-testid="stats-sidebar"
            >
              <div
                className="text-xs uppercase tracking-[0.28em] text-zinc-400"
                data-testid="stats-title"
              >
                Combat Stats
              </div>
              <div className="mt-4 space-y-3" data-testid="stats-list">
                <StatRing
                  label="Strength"
                  value={totalStats.strength}
                  testId="stat-strength"
                />
                <StatRing
                  label="Vitality"
                  value={totalStats.vitality}
                  testId="stat-vitality"
                />
                <StatRing
                  label="Dexterity"
                  value={totalStats.dexterity}
                  testId="stat-dexterity"
                />
                <StatRing
                  label="Intelligence"
                  value={totalStats.intelligence}
                  testId="stat-intelligence"
                />
                <StatRing label="Mind" value={totalStats.mind} testId="stat-mind" />
              </div>

              <Separator className="my-5 bg-white/10" />

              <div
                className="text-xs uppercase tracking-[0.28em] text-zinc-400"
                data-testid="sidebar-hint-title"
              >
                Quick Tips
              </div>
              <ul
                className="mt-3 space-y-2 text-sm text-zinc-300"
                data-testid="sidebar-hint-list"
              >
                <li>Click a slot to see items for that slot.</li>
                <li>Legendary items glow brighter.</li>
                <li>Use Auto‑Equip to fill everything fast.</li>
              </ul>
            </div>

            {/* Main Equip Area */}
            <div
              className="relative rounded-2xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur"
              data-testid="equip-main"
            >
              <div className="equip-grid" aria-hidden="true" />

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_440px]">
                {/* Center character + slots */}
                <div className="relative min-h-[520px]">
                  <div
                    className="absolute left-1/2 top-1/2 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/15 bg-black/20"
                    style={{ boxShadow: "0 0 60px rgba(0,229,255,0.12)" }}
                    data-testid="character-ring"
                  />

                  <div
                    className="absolute left-1/2 top-1/2 h-[270px] w-[220px] -translate-x-1/2 -translate-y-1/2"
                    data-testid="character-preview"
                  >
                    <div className="h-full w-full rounded-2xl border border-white/10 bg-black/20 p-3">
                      <svg
                        viewBox="0 0 240 300"
                        className="h-full w-full"
                        data-testid="character-placeholder-svg"
                      >
                        <defs>
                          <linearGradient id="cy" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0" stopColor="rgba(0,229,255,0.55)" />
                            <stop offset="1" stopColor="rgba(168,85,247,0.20)" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M120 18c24 0 42 18 42 42s-18 42-42 42-42-18-42-42 18-42 42-42Z"
                          fill="url(#cy)"
                          opacity="0.9"
                        />
                        <path
                          d="M70 130c10-10 22-18 50-18s40 8 50 18l18 32-18 20v78l-50 22-50-22v-78l-18-20 18-32Z"
                          fill="rgba(255,255,255,0.06)"
                          stroke="rgba(0,229,255,0.28)"
                          strokeWidth="2"
                        />
                        <path
                          d="M55 165h130"
                          stroke="rgba(255,255,255,0.10)"
                          strokeWidth="2"
                        />
                        <path
                          d="M80 260l40 18 40-18"
                          stroke="rgba(0,229,255,0.28)"
                          strokeWidth="2"
                        />
                      </svg>
                      <div
                        className="mt-2 text-center text-xs uppercase tracking-[0.28em] text-zinc-400"
                        data-testid="character-caption"
                      >
                        Character Preview
                      </div>
                    </div>
                  </div>

                  {/* Slot Layout */}
                  <div className="absolute inset-0" data-testid="slots-layout">
                    <div className="slot-pos slot-head">
                      <SlotChip
                        slot="head"
                        equippedItem={equippedItemsBySlot.head}
                        onClick={() => setActiveSlot("head")}
                      />
                    </div>
                    <div className="slot-pos slot-shoulders">
                      <SlotChip
                        slot="shoulders"
                        equippedItem={equippedItemsBySlot.shoulders}
                        onClick={() => setActiveSlot("shoulders")}
                      />
                    </div>
                    <div className="slot-pos slot-chest">
                      <SlotChip
                        slot="chest"
                        equippedItem={equippedItemsBySlot.chest}
                        onClick={() => setActiveSlot("chest")}
                      />
                    </div>
                    <div className="slot-pos slot-hands">
                      <SlotChip
                        slot="hands"
                        equippedItem={equippedItemsBySlot.hands}
                        onClick={() => setActiveSlot("hands")}
                      />
                    </div>
                    <div className="slot-pos slot-legs">
                      <SlotChip
                        slot="legs"
                        equippedItem={equippedItemsBySlot.legs}
                        onClick={() => setActiveSlot("legs")}
                      />
                    </div>
                    <div className="slot-pos slot-feet">
                      <SlotChip
                        slot="feet"
                        equippedItem={equippedItemsBySlot.feet}
                        onClick={() => setActiveSlot("feet")}
                      />
                    </div>
                    <div className="slot-pos slot-mainhand">
                      <SlotChip
                        slot="main_hand"
                        equippedItem={equippedItemsBySlot.main_hand}
                        onClick={() => setActiveSlot("main_hand")}
                      />
                    </div>
                    <div className="slot-pos slot-offhand">
                      <SlotChip
                        slot="off_hand"
                        equippedItem={equippedItemsBySlot.off_hand}
                        onClick={() => setActiveSlot("off_hand")}
                      />
                    </div>
                  </div>
                </div>

                {/* Right panel: quick list (inventory summary) */}
                <div
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                  data-testid="inventory-summary"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div
                        className="text-xs uppercase tracking-[0.28em] text-zinc-400"
                        data-testid="inventory-title"
                      >
                        Inventory
                      </div>
                      <div
                        className="mt-1 text-sm text-zinc-200"
                        data-testid="inventory-subtitle"
                      >
                        Select a slot to filter items.
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      className="rounded-full border border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
                      onClick={() => setActiveSlot("head")}
                      data-testid="inventory-open-default-slot-button"
                    >
                      Browse
                    </Button>
                  </div>

                  <Separator className="my-4 bg-white/10" />

                  <ScrollArea className="h-[360px] pr-3" data-testid="inventory-scroll">
                    <div className="space-y-3" data-testid="inventory-list">
                      {(activeSlot
                        ? itemsForActiveSlot
                        : (profile?.inventory || []).slice(0, 8)
                      ).map((it) => (
                        <ItemRow
                          key={it.item_id}
                          item={it}
                          onEquip={() => {
                            setActiveSlot(it.slot);
                            equipItem(it.slot, it.item_id);
                          }}
                        />
                      ))}
                      {(profile?.inventory || []).length === 0 ? (
                        <div
                          className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-300"
                          data-testid="inventory-empty"
                        >
                          No items yet.
                        </div>
                      ) : null}
                    </div>
                  </ScrollArea>
                </div>
              </div>

              {/* Bottom actions */}
              <div
                className="mt-6 flex flex-wrap items-center justify-between gap-3"
                data-testid="bottom-action-bar"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    onClick={autoEquip}
                    className="rounded-full bg-cyan-400/15 text-cyan-200 border border-cyan-400/20 hover:bg-cyan-400/20"
                    data-testid="auto-equip-button"
                  >
                    Auto‑Equip
                  </Button>
                  <Button
                    onClick={unequipAll}
                    variant="outline"
                    className="rounded-full border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
                    data-testid="unequip-all-button"
                  >
                    Unequip All
                  </Button>
                </div>

                <Button
                  onClick={shareLoadout}
                  className="rounded-full bg-fuchsia-500/15 text-fuchsia-200 border border-fuchsia-400/20 hover:bg-fuchsia-500/20"
                  data-testid="share-loadout-button"
                >
                  Share Loadout
                </Button>
              </div>

              {/* Slide-in panel */}
              <AnimatePresence>
                {activeSlot ? (
                  <motion.div
                    initial={{ x: 24, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 24, opacity: 0 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="absolute right-4 top-4 bottom-4 w-[360px] max-w-[92vw]"
                    data-testid="slot-panel"
                  >
                    <div className="h-full rounded-2xl border border-white/10 bg-black/40 backdrop-blur p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div
                            className="text-xs uppercase tracking-[0.28em] text-zinc-400"
                            data-testid="slot-panel-label"
                          >
                            Slot
                          </div>
                          <div
                            className="mt-1 text-lg font-semibold"
                            data-testid="slot-panel-title"
                          >
                            {SLOT_LABEL[activeSlot]}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          className="rounded-full border border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
                          onClick={() => setActiveSlot(null)}
                          data-testid="slot-panel-close-button"
                        >
                          Close
                        </Button>
                      </div>

                      <Separator className="my-4 bg-white/10" />

                      <ScrollArea className="h-[420px] pr-3" data-testid="slot-panel-scroll">
                        <div className="space-y-3" data-testid="slot-panel-items">
                          {itemsForActiveSlot.map((it) => (
                            <ItemRow
                              key={it.item_id}
                              item={it}
                              onEquip={() => equipItem(activeSlot, it.item_id)}
                            />
                          ))}

                          {itemsForActiveSlot.length === 0 ? (
                            <div
                              className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-300"
                              data-testid="slot-panel-empty"
                            >
                              No items for this slot.
                            </div>
                          ) : null}
                        </div>
                      </ScrollArea>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div
      className="min-h-screen bg-[#07090b] text-white"
      data-testid="not-found-page"
    >
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1
          className="text-4xl sm:text-5xl lg:text-6xl font-semibold"
          data-testid="not-found-title"
        >
          Page not found
        </h1>
        <p className="mt-6 text-base text-zinc-300" data-testid="not-found-body">
          The page you requested doesn’t exist.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <div className="App" data-testid="app-root">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<EquipDetailScreen />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </div>
    </ThemeProvider>
  );
}
