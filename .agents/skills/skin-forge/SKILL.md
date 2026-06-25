---
name: skin-forge
description: Create new Dodge Rush character skins that match the painted originals (character/cat/unicorn). Use when asked to "create/add a skin", "new character", "evil/gold/ice/ghost version", "recolor the hero", "another pilot", or anything about Dodge Rush character sprite sheets.
---

# Skin Forge — make Dodge Rush skins that match the originals

## Core principle (the discovery)

The originals (`character`, `cat`, `unicorn`) are **AI-painted**. To match their
roundness / cuteness / shading, **DON'T redraw from scratch — DERIVE from them**,
or **generate new source art in their style**. Redrawing procedurally is the
fallback, and it always looks "a notch simpler" + makes samey bodies.

All sheets are a **6×7 grid of 120px cells** (frame = row*6+col). Rows: hover,
side-flight calm, side-flight straining, boost, cheer, combo, then 6 single
poses (dizzy, sad-cloud, **trophy held by the character**, **crown on the
character**, star-eyes head, sad head). `move`/`move_hard` rows face LEFT; the
rest face RIGHT. House style: ~40 colours, unified dark ~1–2px outline, big
round eyes w/ single highlight, blush, teal accents, rocket-flame.

Shared characters wear ONE uniform (propeller + aviator hood + side pods +
goggles + padded teal-trim suit + rocket boots); a skin differs by species cue
(helmet ears/horns/crest), a back element (tail), and signature colour.

## Pick a tier

| Need | Tier | Tool |
| --- | --- | --- |
| A variant of an existing character (evil twin, gold, ice, ghost, elemental) | **1 — derive** | `scripts/build-evil.py`, `scripts/build-variants.py` |
| A brand-new species at full fidelity | **2 — AI source** | `docs/tier2-prompts.md` + `scripts/build-skins.py` |
| Quick prototype / guaranteed-uniform pilot | **3 — procedural** | `scripts/pilot_kit.py` + a thin builder |

## Tier 1 — derive (recommended, runnable here)

A skin = a per-pixel HSV remap of a source sheet. Add a recipe to
`scripts/build-variants.py`:

```python
def myskin(r, g, b):
    h, s, v = colorsys.rgb_to_hsv(r/255, g/255, b/255)
    if v > 0.90 and s < 0.16: return (255, 255, 255)   # glints
    if v < 0.16: return hsv(0.74, 0.4, max(0.06, v))   # outline
    # ...map suit / cream / accents by hue+sat+val buckets...
    return hsv(target_hue, target_sat, v * dark_factor)

RECIPES["myskin"] = ("character", "character_myskin", myskin)
```

Run `python scripts/build-variants.py myskin`. For facial effects (e.g. glowing
eyes) detect **dark pixels enclosed by skin** (cast 4 rays; ≥3 hit skin) — see
`build-evil.py`; this is frame-position-independent, so it works on all 42 cells.

Tips: bucket source colours by (hue, sat, value); keep `v` to preserve shading;
remap the *outline* and *glints* explicitly; recolour `teal` accents separately.

**Recolour alone looks samey** ("the paler cat" problem). Give each variant a
**minimal SHAPE signature** too, edited per-cell using each cell's own content
so it's frame-position-independent. Reusable helpers live in
`scripts/sprite_geom.py`: `head_anchor(cell)` (finds the helmet centre/width/top,
ignoring the propeller), `map_cells(sheet, fn)` (apply a per-cell fn over the
6×7 grid), and ready signatures `add_horns` (NEMESIS), `add_icicles` (FROST),
`add_cape` (GOLD KING). The GHOST tail lives in `scripts/build-ghost.py`:
translucency (scale alpha ~0.84) + replace the lower body with a bell-shaped
wavy tail (cut at the ~60% "waist", narrower-than-torso curved sides, 3-lobe
rounded hem, side+hem outline only so the top blends). Write a new signature as
a `fn(cell)->cell` and pass it through `map_cells`. Keep edits small — the
silhouette read changes fast (horns, a hem, a tail, a cape are enough).

## Tier 2 — AI source

Follow `docs/tier2-prompts.md`: attach an original sheet as a style reference,
generate a 6×7 white-bg sheet, then add a `SHEETS` entry in
`scripts/build-skins.py` (`row_map` + `flip` so rows 1–2 face LEFT) and run it.

## Tier 3 — procedural kit

`scripts/build-phoenix.py` / `build-dragon.py` are thin builders over
`scripts/pilot_kit.py`: supply a signature palette + species hooks (helmet
add-on, tail, boost effect) + pose composers. To avoid samey skins, vary the
**silhouette** (head:body ratio, body shape, limb thickness), not just colour.

## QA loop (every skin)

1. Build the sheet.
2. Render a diff contact-sheet of the same frames next to `character`/`cat`/
   `unicorn` at 3–4× (see the inline `python - <<'PY'` snippets in the build
   scripts) and compare side by side.
3. Verify invariants: ~40 colours; unified dark outline; big eyes + single
   highlight; goggles small & above the eyes; trophy/crown frames show the
   CHARACTER. Fix in the recipe/builder, rebuild, re-diff.

## Wire it in

1. `public/assets/character_<id>.png` (6×7, 120px) — produced by a script above.
2. Add `this.load.spritesheet('character_<id>', 'assets/character_<id>.png',
   { frameWidth: CHARACTER_FRAME.width, frameHeight: CHARACTER_FRAME.height })`
   in `src/scenes/PreloadScene.ts`.
3. Add `{ id, name, sheet: 'character_<id>', tint: null, trail: 0x…, cost: … }`
   to `SKINS` in `src/config/Skins.ts`.
   Animations + shop card auto-generate from `SKINS`/`SKIN_SHEETS`.

## Tools available

`python` lives at `.venv-tools/bin/python` (Pillow installed). Don't run the app
to verify — inspect the generated PNG (Read it) and the diff contact-sheet.
