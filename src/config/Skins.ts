/**
 * Skin catalogue. Every skin is purely cosmetic — no gameplay advantage.
 *
 * Two lists exist:
 *   SKINS            — purchasable in the shop with coins (or unlocked via the
 *                       rewarded-ad spin). Sorted by ascending cost so the shop
 *                       grid reads as a clean progression.
 *   ACHIEVEMENT_SKINS — palette-swaps of the base hero, earned by reaching specific
 *                       in-game milestones (never sold). They reuse the 'character'
 *                       sheet with a tint, which is fine for a trophy but would look
 *                       like filler if listed alongside unique character sheets.
 *
 * Design rationale: see docs/progression-skins.md → "Catálogo de skins".
 */

export type SkinTier = 'free' | 'common' | 'rare' | 'epic' | 'legendary';

export interface SkinDef {
  id: string;
  name: string;
  tier: SkinTier;
  sheet: string; // texture key (sprite sheet)
  tint: number | null; // recolour tint, or null for the sheet's own colours
  trail: number; // jet trail particle colour
  cost: number; // 0 = always unlocked
}

export interface AchievementSkinDef {
  id: string;
  name: string;
  sheet: string;
  tint: number;
  trail: number;
  achievementId: string; // key of the achievement that unlocks this skin
  achievementLabel: string; // human-readable unlock condition shown in the UI
}

// ---------------------------------------------------------------------------
// Purchasable / spinnable skins — shown in the shop, available via the spin.
// Sorted by ascending cost; costs updated to match the GDD economy.
// ---------------------------------------------------------------------------
export const SKINS: SkinDef[] = [
  // Free default — always owned, never purchasable.
  { id: 'classic', name: 'CLASSIC', tier: 'free',      sheet: 'character',       tint: null, trail: 0x46e6ff, cost: 0    },

  // Common — unique character sheets, most accessible.
  { id: 'cat',     name: 'CAT',      tier: 'common',    sheet: 'character_cat',   tint: null, trail: 0xffa24a, cost: 400  },

  // Rare — distinct personalities, mid-range cost.
  { id: 'unicorn', name: 'UNICORN',  tier: 'rare',      sheet: 'character_unicorn',tint: null,trail: 0x8fe6d2, cost: 500  },
  { id: 'witch',   name: 'WITCH',    tier: 'rare',      sheet: 'character_witch', tint: null, trail: 0xc24dd6, cost: 680  },
  { id: 'phoenix', name: 'PHOENIX',  tier: 'rare',      sheet: 'character_phoenix',tint: null,trail: 0xff6a3d, cost: 750  },
  { id: 'wizard',  name: 'WIZARD',   tier: 'rare',      sheet: 'character_wizard',tint: null, trail: 0xffe08a, cost: 820  },

  // Legendary — status symbol, the pinnacle of the collection.
  { id: 'nemesis', name: 'NEMESIS',  tier: 'legendary', sheet: 'character_evil',  tint: null, trail: 0xb24dff, cost: 1400 },
];

// ---------------------------------------------------------------------------
// Achievement skins — palette-swaps earned by milestones, never in the shop.
// Keeping them separate prevents "why is there a blue version of the same guy?"
// confusion in the shop grid.
// ---------------------------------------------------------------------------
export const ACHIEVEMENT_SKINS: AchievementSkinDef[] = [
  { id: 'gold',   name: 'GOLD',   sheet: 'character', tint: 0xffd24a, trail: 0xffd24a, achievementId: 'reach_1000m',       achievementLabel: 'Survive 1 000 m in a single run'         },
  { id: 'shadow', name: 'SHADOW', sheet: 'character', tint: 0x7d7da6, trail: 0xb0b0ff, achievementId: 'runs_50',           achievementLabel: 'Complete 50 runs total'                   },
  { id: 'aqua',   name: 'AQUA',   sheet: 'character', tint: 0x7fe6ff, trail: 0x7fe6ff, achievementId: 'streak_7',          achievementLabel: 'Complete daily missions 7 days in a row'  },
  { id: 'violet', name: 'VIOLET', sheet: 'character', tint: 0xc183ff, trail: 0xc183ff, achievementId: 'reach_phase5',      achievementLabel: 'Reach Phase 5 (500 m+)'                   },
  { id: 'lime',   name: 'LIME',   sheet: 'character', tint: 0xa6ff7a, trail: 0xa6ff7a, achievementId: 'collect_all_common', achievementLabel: 'Unlock all Common pilots'                 },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** All distinct sprite-sheet texture keys that need to be loaded and animated. */
export const SKIN_SHEETS: string[] = [
  ...new Set([
    ...SKINS.map((s) => s.sheet),
    ...ACHIEVEMENT_SKINS.map((s) => s.sheet),
  ])
];

/** Look up a purchasable skin by id; falls back to CLASSIC if not found. */
export const getSkin = (id: string): SkinDef =>
  SKINS.find((s) => s.id === id) ?? SKINS[0];

/** Look up any skin (purchasable or achievement) by id; falls back to CLASSIC. */
export const getAnySkin = (id: string): SkinDef | AchievementSkinDef =>
  SKINS.find((s) => s.id === id) ??
  ACHIEVEMENT_SKINS.find((s) => s.id === id) ??
  SKINS[0];
