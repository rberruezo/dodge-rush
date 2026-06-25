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
  { id: 'classic', name: 'CLASSIC', sheet: 'character', tint: null, trail: 0x46e6ff, cost: 0 },
  { id: 'aqua', name: 'AQUA', sheet: 'character', tint: 0x7fe6ff, trail: 0x7fe6ff, cost: 120 },
  { id: 'lime', name: 'LIME', sheet: 'character', tint: 0xa6ff7a, trail: 0xa6ff7a, cost: 180 },
  { id: 'violet', name: 'VIOLET', sheet: 'character', tint: 0xc183ff, trail: 0xc183ff, cost: 260 },
  { id: 'gold', name: 'GOLD', sheet: 'character', tint: 0xffd24a, trail: 0xffd24a, cost: 400 },
  { id: 'shadow', name: 'SHADOW', sheet: 'character', tint: 0x7d7da6, trail: 0xb0b0ff, cost: 600 },
  { id: 'cat', name: 'CAT', sheet: 'character_cat', tint: null, trail: 0xffa24a, cost: 350 },
  { id: 'unicorn', name: 'UNICORN', sheet: 'character_unicorn', tint: null, trail: 0x8fe6d2, cost: 500 },
  { id: 'phoenix', name: 'PHOENIX', sheet: 'character_phoenix', tint: null, trail: 0xff6a3d, cost: 520 },
  { id: 'dragon', name: 'DRAGON', sheet: 'character_dragon', tint: null, trail: 0x8be07a, cost: 460 },
  { id: 'nemesis', name: 'NEMESIS', sheet: 'character_evil', tint: null, trail: 0xb24dff, cost: 700 },
  { id: 'king', name: 'GOLD KING', sheet: 'character_king', tint: null, trail: 0xffd24a, cost: 800 },
  { id: 'frost', name: 'FROST', sheet: 'character_frost', tint: null, trail: 0x9fe0ff, cost: 620 },
  { id: 'ghost', name: 'GHOST', sheet: 'character_ghost', tint: null, trail: 0xcdd6ff, cost: 680 },
  { id: 'hound', name: 'OLD HOUND', sheet: 'character_hound', tint: null, trail: 0xd2a06e, cost: 440 },
  { id: 'witch', name: 'WITCH', sheet: 'character_witch', tint: null, trail: 0xc24dd6, cost: 560 }
];

/** Distinct sprite-sheet texture keys used by skins (loaded + animated). */
export const SKIN_SHEETS: string[] = [...new Set(SKINS.map((s) => s.sheet))];

export const getSkin = (id: string): SkinDef => SKINS.find((s) => s.id === id) ?? SKINS[0];
