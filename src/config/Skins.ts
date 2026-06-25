/**
 * Unlockable skins. Since there's no alternate character art, each skin is a
 * palette-swap (a tint applied to the sprite) plus a matching trail colour.
 * `tint: null` = the original art untouched. Costs are paid in coins.
 */
export interface SkinDef {
  id: string;
  name: string;
  tint: number | null;
  trail: number; // dash / jet trail particle colour
  cost: number;
}

export const SKINS: SkinDef[] = [
  { id: 'classic', name: 'CLASSIC', tint: null, trail: 0x46e6ff, cost: 0 },
  { id: 'aqua', name: 'AQUA', tint: 0x7fe6ff, trail: 0x7fe6ff, cost: 120 },
  { id: 'lime', name: 'LIME', tint: 0xa6ff7a, trail: 0xa6ff7a, cost: 180 },
  { id: 'violet', name: 'VIOLET', tint: 0xc183ff, trail: 0xc183ff, cost: 260 },
  { id: 'gold', name: 'GOLD', tint: 0xffd24a, trail: 0xffd24a, cost: 400 },
  { id: 'shadow', name: 'SHADOW', tint: 0x7d7da6, trail: 0xb0b0ff, cost: 600 }
];

export const getSkin = (id: string): SkinDef => SKINS.find((s) => s.id === id) ?? SKINS[0];
