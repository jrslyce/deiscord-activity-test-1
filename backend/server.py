from __future__ import annotations

import os
import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, Header, HTTPException, Request
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from starlette.middleware.cors import CORSMiddleware

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("equip-detail")

# MongoDB connection
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI()
api_router = APIRouter(prefix="/api")


# -----------------------------
# Models
# -----------------------------
StatKey = Literal["strength", "vitality", "dexterity", "intelligence", "mind"]
SlotKey = Literal[
    "head",
    "shoulders",
    "chest",
    "hands",
    "legs",
    "feet",
    "main_hand",
    "off_hand",
]
Rarity = Literal["common", "epic", "legendary"]


class Stats(BaseModel):
    strength: int = 0
    vitality: int = 0
    dexterity: int = 0
    intelligence: int = 0
    mind: int = 0


class InventoryItem(BaseModel):
    item_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    slot: SlotKey
    name: str
    rarity: Rarity
    stat_bonus: Stats


class EquippedMapping(BaseModel):
    head: Optional[str] = None
    shoulders: Optional[str] = None
    chest: Optional[str] = None
    hands: Optional[str] = None
    legs: Optional[str] = None
    feet: Optional[str] = None
    main_hand: Optional[str] = None
    off_hand: Optional[str] = None


class Profile(BaseModel):
    discord_user_id: str
    username: str
    avatar: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    base_stats: Stats
    inventory: List[InventoryItem]
    equipped: EquippedMapping


class ProfileUpsertRequest(BaseModel):
    discord_user_id: str
    username: str
    avatar: Optional[str] = None


class EquipUpdateRequest(BaseModel):
    equipped: Optional[EquippedMapping] = None
    slot: Optional[SlotKey] = None
    item_id: Optional[str] = None


class DiscordTokenExchangeRequest(BaseModel):
    code: str
    redirect_uri: str


# -----------------------------
# Helpers
# -----------------------------


def _now() -> datetime:
    return datetime.now(timezone.utc)


RARITY_WEIGHT: Dict[str, int] = {"common": 1, "epic": 2, "legendary": 3}


def _seed_inventory() -> List[InventoryItem]:
    # MVP seed items: 2-3 per slot, mixed rarities.
    def item(slot: SlotKey, name: str, rarity: Rarity, **bonus: int) -> InventoryItem:
        return InventoryItem(slot=slot, name=name, rarity=rarity, stat_bonus=Stats(**bonus))

    return [
        item("head", "Neural Visor Mk.I", "common", intelligence=1),
        item("head", "Cyan Halo Helm", "epic", mind=2),
        item("head", "Legend Crown Interface", "legendary", intelligence=3, mind=2),
        item("shoulders", "Reactive Pauldrons", "common", vitality=1),
        item("shoulders", "Aegis Spines", "epic", vitality=2, strength=1),
        item("shoulders", "Singularity Mantle", "legendary", vitality=3, strength=2),
        item("chest", "Carbon Weave Core", "common", vitality=1, strength=1),
        item("chest", "Vector Plating", "epic", vitality=2, dexterity=1),
        item("chest", "Titanium Heart Engine", "legendary", vitality=4, strength=2),
        item("hands", "Servo Gloves", "common", dexterity=1),
        item("hands", "Arc Gauntlets", "epic", strength=1, dexterity=2),
        item("hands", "Chrono Hands", "legendary", dexterity=3, intelligence=1),
        item("legs", "Kinetic Greaves", "common", vitality=1),
        item("legs", "Stride Amplifiers", "epic", dexterity=2, vitality=1),
        item("legs", "Voidwalk Legs", "legendary", dexterity=3, mind=1),
        item("feet", "Mag Boots", "common", dexterity=1),
        item("feet", "Phase Runners", "epic", dexterity=2, mind=1),
        item("feet", "Stellar Treads", "legendary", dexterity=3, vitality=1),
        item("main_hand", "Pulse Blade", "common", strength=1),
        item("main_hand", "Rail Pistol", "epic", dexterity=1, strength=2),
        item("main_hand", "Cyan Edge Prototype", "legendary", strength=4),
        item("off_hand", "Buckler Drone", "common", vitality=1),
        item("off_hand", "Ion Shield", "epic", vitality=2, mind=1),
        item("off_hand", "Prismatic Barrier", "legendary", vitality=3, intelligence=1, mind=1),
    ]


def _default_profile(discord_user_id: str, username: str, avatar: Optional[str]) -> Profile:
    return Profile(
        discord_user_id=discord_user_id,
        username=username,
        avatar=avatar,
        base_stats=Stats(strength=10, vitality=10, dexterity=10, intelligence=10, mind=10),
        inventory=_seed_inventory(),
        equipped=EquippedMapping(),
    )


def _serialize_profile(profile: Profile) -> Dict[str, Any]:
    doc = profile.model_dump()
    doc["created_at"] = profile.created_at.isoformat()
    doc["updated_at"] = profile.updated_at.isoformat()
    return doc


def _deserialize_profile(doc: Dict[str, Any]) -> Dict[str, Any]:
    # Convert dates back; allow missing fields.
    if isinstance(doc.get("created_at"), str):
        doc["created_at"] = datetime.fromisoformat(doc["created_at"])
    if isinstance(doc.get("updated_at"), str):
        doc["updated_at"] = datetime.fromisoformat(doc["updated_at"])
    doc.pop("_id", None)
    return doc


# -----------------------------
# Core API
# -----------------------------


@api_router.get("/")
async def root():
    return {"message": "Equip Detail API online"}


@api_router.post("/profile/upsert")
async def upsert_profile(payload: ProfileUpsertRequest):
    existing = await db.profiles.find_one({"discord_user_id": payload.discord_user_id})

    if existing:
        update = {
            "$set": {
                "username": payload.username,
                "avatar": payload.avatar,
                "updated_at": _now().isoformat(),
            }
        }
        await db.profiles.update_one({"discord_user_id": payload.discord_user_id}, update)
    else:
        profile = _default_profile(payload.discord_user_id, payload.username, payload.avatar)
        await db.profiles.insert_one(_serialize_profile(profile))

    return {"ok": True}


@api_router.get("/profile/{discord_user_id}")
async def get_profile(discord_user_id: str):
    doc = await db.profiles.find_one({"discord_user_id": discord_user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Profile not found")
    return _deserialize_profile(doc)


@api_router.put("/profile/{discord_user_id}/equipped")
async def update_equipped(discord_user_id: str, payload: EquipUpdateRequest):
    doc = await db.profiles.find_one({"discord_user_id": discord_user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Profile not found")

    profile = Profile(**_deserialize_profile(doc))

    if payload.equipped is not None:
        equipped = payload.equipped
    else:
        if not payload.slot:
            raise HTTPException(status_code=400, detail="slot is required")
        equipped = profile.equipped
        setattr(equipped, payload.slot, payload.item_id)

    await db.profiles.update_one(
        {"discord_user_id": discord_user_id},
        {
            "$set": {
                "equipped": equipped.model_dump(),
                "updated_at": _now().isoformat(),
            }
        },
    )
    updated = await db.profiles.find_one({"discord_user_id": discord_user_id})
    return _deserialize_profile(updated)


@api_router.put("/profile/{discord_user_id}/unequip-all")
async def unequip_all(discord_user_id: str):
    await db.profiles.update_one(
        {"discord_user_id": discord_user_id},
        {
            "$set": {
                "equipped": EquippedMapping().model_dump(),
                "updated_at": _now().isoformat(),
            }
        },
    )
    updated = await db.profiles.find_one({"discord_user_id": discord_user_id})
    if not updated:
        raise HTTPException(status_code=404, detail="Profile not found")
    return _deserialize_profile(updated)


@api_router.put("/profile/{discord_user_id}/auto-equip")
async def auto_equip(discord_user_id: str):
    doc = await db.profiles.find_one({"discord_user_id": discord_user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Profile not found")
    profile = Profile(**_deserialize_profile(doc))

    best: Dict[str, Optional[str]] = EquippedMapping().model_dump()
    inv_by_slot: Dict[str, List[InventoryItem]] = {}
    for item in profile.inventory:
        inv_by_slot.setdefault(item.slot, []).append(item)

    for slot, items in inv_by_slot.items():
        items_sorted = sorted(items, key=lambda i: (RARITY_WEIGHT.get(i.rarity, 0), i.name), reverse=True)
        best[slot] = items_sorted[0].item_id if items_sorted else None

    await db.profiles.update_one(
        {"discord_user_id": discord_user_id},
        {"$set": {"equipped": best, "updated_at": _now().isoformat()}},
    )
    updated = await db.profiles.find_one({"discord_user_id": discord_user_id})
    return _deserialize_profile(updated)


# -----------------------------
# Discord OAuth helpers (best-effort)
# NOTE: Requires DISCORD_CLIENT_SECRET in backend env to work.
# -----------------------------


@api_router.post("/discord/token")
async def discord_token_exchange(payload: DiscordTokenExchangeRequest):
    import httpx

    client_id = os.environ.get("DISCORD_CLIENT_ID")
    client_secret = os.environ.get("DISCORD_CLIENT_SECRET")

    if not client_id or not client_secret:
        raise HTTPException(
            status_code=400,
            detail="Missing DISCORD_CLIENT_ID / DISCORD_CLIENT_SECRET in backend env",
        )

    data = {
        "client_id": client_id,
        "client_secret": client_secret,
        "grant_type": "authorization_code",
        "code": payload.code,
        "redirect_uri": payload.redirect_uri,
    }

    headers = {"Content-Type": "application/x-www-form-urlencoded"}

    async with httpx.AsyncClient(timeout=15) as http:
        resp = await http.post("https://discord.com/api/oauth2/token", data=data, headers=headers)

    if resp.status_code >= 400:
        logger.error("Token exchange failed: %s %s", resp.status_code, resp.text)
        raise HTTPException(status_code=400, detail="Discord token exchange failed")

    return resp.json()


# -----------------------------
# Discord Portal URL Stubs
# -----------------------------

DISCORD_PUBLIC_KEY_HEX = "46472339ce2ffc0d5661b3564555910e3499c90e8816dd4d591b7d60c35b2660"


def _verify_discord_signature(
    *,
    public_key_hex: str,
    signature_hex: str,
    timestamp: str,
    body: bytes,
) -> bool:
    try:
        pk = Ed25519PublicKey.from_public_bytes(bytes.fromhex(public_key_hex))
        pk.verify(bytes.fromhex(signature_hex), timestamp.encode("utf-8") + body)
        return True
    except Exception:
        return False


@api_router.post("/interactions")
async def interactions(
    request: Request,
    x_signature_ed25519: Optional[str] = Header(default=None),
    x_signature_timestamp: Optional[str] = Header(default=None),
):
    body = await request.body()

    # Verify signature if headers are present; otherwise allow (dev convenience)
    if x_signature_ed25519 and x_signature_timestamp:
        ok = _verify_discord_signature(
            public_key_hex=DISCORD_PUBLIC_KEY_HEX,
            signature_hex=x_signature_ed25519,
            timestamp=x_signature_timestamp,
            body=body,
        )
        if not ok:
            raise HTTPException(status_code=401, detail="Invalid request signature")

    payload = await request.json()

    # Minimal Discord Interactions support: respond to PING
    if payload.get("type") == 1:
        return JSONResponse({"type": 1})

    # For MVP: acknowledge anything else
    return JSONResponse({"type": 4, "data": {"content": "MVP: interaction received"}})


@api_router.get("/verify")
async def verify_linked_roles():
    # MVP stub: The Linked Roles verification endpoint needs to exist.
    return {"ok": True}


# -----------------------------
# App wiring
# -----------------------------

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
