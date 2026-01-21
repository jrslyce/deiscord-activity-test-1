import { randomUUID } from "crypto";
import type { InventoryItem, Rarity, SlotKey } from "@/lib/types";

export const RARITY_WEIGHT: Record<Rarity, number> = {
  common: 1,
  epic: 2,
  legendary: 3,
};

function item(
  slot: SlotKey,
  name: string,
  rarity: Rarity,
  stat_bonus: InventoryItem["stat_bonus"],
): InventoryItem {
  return {
    item_id: randomUUID(),
    slot,
    name,
    rarity,
    stat_bonus,
  };
}

export function seedInventory(): InventoryItem[] {
  return [
    item("head", "Neural Visor Mk.I", "common", { intelligence: 1 }),
    item("head", "Cyan Halo Helm", "epic", { mind: 2 }),
    item("head", "Legend Crown Interface", "legendary", {
      intelligence: 3,
      mind: 2,
    }),
    item("shoulders", "Reactive Pauldrons", "common", { vitality: 1 }),
    item("shoulders", "Aegis Spines", "epic", { vitality: 2, strength: 1 }),
    item("shoulders", "Singularity Mantle", "legendary", {
      vitality: 3,
      strength: 2,
    }),
    item("chest", "Carbon Weave Core", "common", { vitality: 1, strength: 1 }),
    item("chest", "Vector Plating", "epic", { vitality: 2, dexterity: 1 }),
    item("chest", "Titanium Heart Engine", "legendary", {
      vitality: 4,
      strength: 2,
    }),
    item("hands", "Servo Gloves", "common", { dexterity: 1 }),
    item("hands", "Arc Gauntlets", "epic", { strength: 1, dexterity: 2 }),
    item("hands", "Chrono Hands", "legendary", { dexterity: 3, intelligence: 1 }),
    item("legs", "Kinetic Greaves", "common", { vitality: 1 }),
    item("legs", "Stride Amplifiers", "epic", { dexterity: 2, vitality: 1 }),
    item("legs", "Voidwalk Legs", "legendary", { dexterity: 3, mind: 1 }),
    item("feet", "Mag Boots", "common", { dexterity: 1 }),
    item("feet", "Phase Runners", "epic", { dexterity: 2, mind: 1 }),
    item("feet", "Stellar Treads", "legendary", { dexterity: 3, vitality: 1 }),
    item("main_hand", "Pulse Blade", "common", { strength: 1 }),
    item("main_hand", "Rail Pistol", "epic", { dexterity: 1, strength: 2 }),
    item("main_hand", "Cyan Edge Prototype", "legendary", { strength: 4 }),
    item("off_hand", "Buckler Drone", "common", { vitality: 1 }),
    item("off_hand", "Ion Shield", "epic", { vitality: 2, mind: 1 }),
    item("off_hand", "Prismatic Barrier", "legendary", {
      vitality: 3,
      intelligence: 1,
      mind: 1,
    }),
  ];
}

export function emptyEquipped(): Record<string, null> {
  return {
    head: null,
    shoulders: null,
    chest: null,
    hands: null,
    legs: null,
    feet: null,
    main_hand: null,
    off_hand: null,
  };
}
