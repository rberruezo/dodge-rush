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
  { id: 'soplo', name: 'SOPLO', sheet: 'character_soplo', tint: null, trail: 0xb6f0c0, cost: 420 }
];

/** Distinct sprite-sheet texture keys used by skins (loaded + animated). */
export const SKIN_SHEETS: string[] = [...new Set(SKINS.map((s) => s.sheet))];

export const getSkin = (id: string): SkinDef => SKINS.find((s) => s.id === id) ?? SKINS[0];
