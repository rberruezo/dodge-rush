/**
 * Single source of truth for the CHARACTER sprite.
 *
 * Every independent image (frame), every frame→animation mapping, and the cell
 * geometry of the character sheet live here. Nothing else in the codebase should
 * hard-code a character frame index: import the named frame / animation key from
 * this file instead.
 *
 * The base sheet is re-packed by `scripts/repack-character.py` into a clean 6x8
 * grid at `public/assets/character.png` (120px cells — rendered ~1:1 so it stays
 * crisp against the detailed background). Frame map (index = row*6 + col):
 *   row 0 (0-5)   hover (front)             -> not steering (alive float)
 *   row 1 (6-11)  side flight, calm         -> moving, low effort
 *   row 2 (12-17) side flight, straining    -> moving held, high effort
 *   row 3 (18-23) flight + sparkles         -> golden score boost
 *   row 4 (24-29) cheer (arms up)           -> celebration
 *   row 5 (30-35) combo x1,x2,x3,x5,x10,x20 -> brief combo celebration flash
 *   row 6 (36-41) dizzy, sad-cloud, trophy, crown, star head, sad head
 *   row 7 (42-47) knockout: bonk, shout, eyes-shut, roll, roll, head-down fall -> death anim
 * The fly art faces LEFT, so we mirror (flipX) when moving right — see Player +
 * PlayerFacing. Skins remain 6x7 (no row 7); the death anim is base-only and
 * falls back to the sad-head frame.
 */

/** Base sprite-sheet texture key for the default hero. */
export const CHARACTER_KEY = 'character';

/** Cell size of one sprite-sheet frame (used to slice the 6x8 grid). */
export const CHARACTER_FRAME = {
  width: 120,
  height: 120
} as const;

/** Animation keys (avoid magic strings) — see CHARACTER_ANIMS for the frames. */
export const ANIM_KEYS = {
  HOVER: 'player-hover', // not steering (alive idle float)
  MOVE: 'player-move', // steering, low effort
  MOVE_HARD: 'player-move-hard', // steering held, straining
  BOOST: 'player-boost', // golden score boost
  CHEER: 'player-cheer', // celebration
  DEATH: 'player-death' // run-over knockout (base sheet only — row 7)
} as const;

/** Single-purpose, non-animated frames (row 6). */
export const CHAR_FRAMES = {
  dizzy: 36,
  sadCloud: 37,
  trophy: 38,
  crown: 39,
  starHead: 40,
  sadHead: 41
} as const;

/** Numbered combo-badge frames flashed on the hero (row 5, x2..x20). */
export const CHARACTER_COMBO_FRAMES = {
  x2: 31,
  x3: 32,
  x5: 33,
  x10: 34,
  x20: 35
} as const;

/**
 * One character animation. Supply EITHER a contiguous `start`/`end` range, OR an
 * explicit `frames` list for a curated (possibly non-contiguous / ping-pong)
 * loop — the latter lets us cherry-pick same-silhouette poses so a clip never
 * strobes through mismatched art.
 */
export interface CharAnimDef {
  start?: number;
  end?: number;
  frames?: readonly number[];
  frameRate: number;
  repeat: number;
}

export const CHARACTER_ANIMS: Record<string, CharAnimDef> = {
  [ANIM_KEYS.HOVER]: { start: 0, end: 5, frameRate: 7, repeat: -1 },
  [ANIM_KEYS.MOVE]: { start: 6, end: 11, frameRate: 12, repeat: -1 },
  [ANIM_KEYS.MOVE_HARD]: { start: 12, end: 17, frameRate: 14, repeat: -1 },
  // Golden boost: a calmer rate so the sparkly glow shimmers instead of flickering.
  [ANIM_KEYS.BOOST]: { start: 18, end: 23, frameRate: 12, repeat: -1 },
  // Celebration (combo flash + new-best screen): a lively arms-up pump so a combo
  // reads as motion, not a frozen pose. Tune this frame list to taste — row 4
  // (24-29) holds the cheer poses: 24 rest, 26/27/28 one-or-two arms raised,
  // 29 big two-arm smile.
  [ANIM_KEYS.CHEER]: { frames: [24, 27, 29], frameRate: 8, repeat: -1 },
  // Row 7 (base sheet only): full knockout beat — bonk, shout, eyes-shut, roll, roll,
  // head-down fall — so death is a 2-beat reaction, not a static frame (DR-17/18).
  [ANIM_KEYS.DEATH]: { frames: [42, 43, 44, 45, 46, 47], frameRate: 10, repeat: 0 }
} as const;
