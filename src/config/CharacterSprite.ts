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
 * crisp against the detailed background). The source art has 6 rows (HOVER, FLY,
 * BOOST, CHEER, EMOTES, DEATH); the repack DUPLICATES the single FLY row into
 * rows 1+2 and the single CHEER row into rows 4+5 so the 6x8 layout below holds.
 * Frame map (index = row*6 + col):
 *   row 0 (0-5)   hover (front)             -> not steering (alive float)
 *   row 1 (6-11)  side flight               -> moving, low effort
 *   row 2 (12-17) side flight (dup of row 1) -> moving held, high effort
 *   row 3 (18-23) star-power boost + aura    -> golden score boost (invincible)
 *   row 4 (24-29) cheer, arms up             -> spare celebration
 *   row 5 (30-35) cheer, arms up (dup)       -> combo cheer flash
 *   row 6 (36-40) startled, sad, crown, trophy, star
 *   row 7 (42-45) knockout: stars, lying, flip, KO -> death anim (base only)
 * The fly art faces LEFT, so we mirror (flipX) when moving right — see Player +
 * PlayerFacing. Skins remain 6x7 (no row 7); the death anim is base-only and
 * falls back to the sad frame.
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

/** Single-purpose, non-animated emote frames (row 6). */
export const CHAR_FRAMES = {
  startled: 36, // surprised — hit / impact startle
  sad: 37, // crying — game-over loss & death fallback
  crown: 38, // crown — new record / win
  trophy: 39, // holding a trophy — achievement icon
  star: 40 // star-struck — high-combo icon
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

// Frame→animation mapping, aligned to the character notes sheet
// (art-src/character/character-sprite-with-notes.png):
//   row 0 -> HOVER, row 1 -> MOVE, row 2 -> MOVE HARD, row 3 -> BOOST.
// The remaining clips (cheer, death) keep their curated frame lists.
export const CHARACTER_ANIMS: Record<string, CharAnimDef> = {
  // Row 0 (0-5): floating idle.
  [ANIM_KEYS.HOVER]: { start: 0, end: 5, frameRate: 7, repeat: -1 },
  // Row 1 (6-11): normal flight.
  [ANIM_KEYS.MOVE]: { start: 6, end: 11, frameRate: 12, repeat: -1 },
  // Row 2 (12-17): high-speed / straining flight.
  [ANIM_KEYS.MOVE_HARD]: { start: 12, end: 17, frameRate: 14, repeat: -1 },
  // Row 3 (18-23): golden star-power boost — a calmer rate so the sparkly glow
  // shimmers instead of flickering.
  [ANIM_KEYS.BOOST]: { start: 18, end: 23, frameRate: 12, repeat: -1 },
  // Celebration (combo flash + new-best screen): a lively arms-up cheer so a
  // combo reads as motion, not a frozen pose. Row 5 holds the celebration
  // gestures; 31/34/35 (arms up: big grin, wide calm, fist pump) share a
  // front-facing arms-up silhouette so the loop never jitters (33 is a
  // horizontal tumble pose, deliberately skipped).
  [ANIM_KEYS.CHEER]: { frames: [31, 34, 35], frameRate: 8, repeat: -1 },
  // Row 7 (base sheet only): knockout beat — dizzy stars -> flip -> KO settle —
  // so death is a short reaction that ends on the grounded pose (DR-17/18).
  [ANIM_KEYS.DEATH]: { frames: [42, 44, 45], frameRate: 8, repeat: 0 }
} as const;