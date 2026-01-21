export type StatKey = "strength" | "vitality" | "dexterity" | "intelligence" | "mind";

export type SlotKey =
  | "head"
  | "shoulders"
  | "chest"
  | "hands"
  | "legs"
  | "feet"
  | "main_hand"
  | "off_hand";

export type Rarity = "common" | "epic" | "legendary";

export type Stats = {
  strength: number;
  vitality: number;
  dexterity: number;
  intelligence: number;
  mind: number;
};

export type InventoryItem = {
  item_id: string;
  slot: SlotKey;
  name: string;
  rarity: Rarity;
  stat_bonus: Partial<Stats>;
};

export type EquippedMapping = Record<SlotKey, string | null>;

export type ProfileDoc = {
  discord_user_id: string;
  username: string;
  avatar: string | null;
  created_at: string;
  updated_at: string;
  base_stats: Stats;
  inventory: InventoryItem[];
  equipped: EquippedMapping;
};
