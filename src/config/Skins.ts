/**
 * Unlockable skins. A skin is either a palette-swap (a tint on the main sheet)
 * or a full alternate sprite sheet (its own texture, same 6x7 frame layout so
 * it's drop-in swappable). Each also has a matching trail colour. Paid in coins.
 */
export interface SkinDef {
  id: string;
  name: string;
  sheet: string; // texture key (sprite sheet)
  tint: number | null; // recolour tint, or null for the sheet's own colours
  trail: number; // smash-power / jet trail particle colour
  cost: number;
}

export const SKINS: SkinDef[] = [
  // Display order == this array. Kept sorted by ascending cost so the shop
  // grid reads as a clean progression, grouped in three value tiers.

  // Free default.
  { id: 'classic', name: 'CLASSIC', sheet: 'character', tint: null, trail: 0x46e6ff, cost: 0 },

  // Tier 1 — palette swaps of the base hero (cheap starter recolours).
  { id: 'aqua', name: 'AQUA', sheet: 'character', tint: 0x7fe6ff, trail: 0x7fe6ff, cost: 100 },
  { id: 'lime', name: 'LIME', sheet: 'character', tint: 0xa6ff7a, trail: 0xa6ff7a, cost: 150 },
  { id: 'violet', name: 'VIOLET', sheet: 'character', tint: 0xc183ff, trail: 0xc183ff, cost: 220 },
  { id: 'gold', name: 'GOLD', sheet: 'character', tint: 0xffd24a, trail: 0xffd24a, cost: 300 },
  { id: 'shadow', name: 'SHADOW', sheet: 'character', tint: 0x7d7da6, trail: 0xb0b0ff, cost: 400 },

  // Tier 2 — unique character sheets (the core roster), cheapest -> coolest.
  { id: 'cat', name: 'CAT', sheet: 'character_cat', tint: null, trail: 0xffa24a, cost: 500 },
  { id: 'hound', name: 'OLD HOUND', sheet: 'character_hound', tint: null, trail: 0xd2a06e, cost: 560 },
  { id: 'dragon', name: 'DRAGON', sheet: 'character_dragon', tint: null, trail: 0x8be07a, cost: 620 },
  { id: 'unicorn', name: 'UNICORN', sheet: 'character_unicorn', tint: null, trail: 0x8fe6d2, cost: 700 },
  { id: 'witch', name: 'WITCH', sheet: 'character_witch', tint: null, trail: 0xc24dd6, cost: 780 },
  { id: 'phoenix', name: 'PHOENIX', sheet: 'character_phoenix', tint: null, trail: 0xff6a3d, cost: 850 },
  { id: 'wizard', name: 'WIZARD', sheet: 'character_wizard', tint: null, trail: 0xffe08a, cost: 920 },

  // Tier 3 — premium / legendary (derived specials + bosses).
  { id: 'frost', name: 'FROST', sheet: 'character_frost', tint: null, trail: 0x9fe0ff, cost: 1000 },
  { id: 'ghost', name: 'GHOST', sheet: 'character_ghost', tint: null, trail: 0xcdd6ff, cost: 1100 },
  { id: 'king', name: 'GOLD KING', sheet: 'character_king', tint: null, trail: 0xffd24a, cost: 1300 },
  { id: 'nemesis', name: 'NEMESIS', sheet: 'character_evil', tint: null, trail: 0xb24dff, cost: 1500 }
];

/** Distinct sprite-sheet texture keys used by skins (loaded + animated). */
export const SKIN_SHEETS: string[] = [...new Set(SKINS.map((s) => s.sheet))];

export const getSkin = (id: string): SkinDef => SKINS.find((s) => s.id === id) ?? SKINS[0];
