# Dodge Rush — Skin creation process

Goal: new character skins that are **extremely** consistent with the originals
(`character`, `cat`, `unicorn`) in style, format, roundness and cuteness — and
distinct from each other (not just a recolour).

## Why the first procedural attempts fell short

The originals are **AI-painted** pixel art: rich multi-band shading, soft
gradients, nuanced faces. Hand-coding shapes in PIL (Soplo, the first
Phoenix/Dragon) has a hard ceiling — it can match silhouette, palette and
outline, but not the painterly richness, so it always reads "a notch simpler."
And because the procedural `pilot_kit` reuses ONE body, kit skins look like
colour swaps of each other.

**Rule of thumb: don't redraw to match the originals — derive from them, or
generate new source art in their style. Redrawing is the fallback, not the goal.**

## The three tiers (pick by what the skin needs)

### Tier 1 — DERIVE from an original sheet  ★ highest fidelity, runnable here
Take a real painted sheet and transform only the pixels. Inherits the exact
form/roundness/cuteness/shading. Best for "variants" of an existing character.
- **Palette corruption / recolour** — per-pixel HSV region remap. Example:
  `scripts/build-evil.py` turns `character.png` into NEMESIS (evil twin):
  pink→violet, cream→sickly olive, gold→dark-gold, glints→acid sheen, alpha kept.
- **Feature grafting / shape edits** — recolour alone looks samey. Give each
  variant a **minimal shape signature**, edited per-cell using each cell's own
  bbox (frame-position-independent). Canonical example: `scripts/build-ghost.py`
  makes a true ghost via translucency (scale alpha ~0.84) + replacing the lower
  body with a wavy scalloped tail (cut at the ~58%-height "waist", redraw a
  tapering hem, outline via alpha dilation). Glowing eyes (`build-evil.py`) use
  the same idea: recolour dark pixels that are *enclosed by skin* (4-ray test).

### Tier 2 — GENERATE new source art in-style, then slice  ★ for brand-new species
Reproduce the *painting process* that made the originals, then run the existing
slicer. Needs an image model (not available in this CLI session — hand off the
prompt + a reference frame to one that has image-gen).
1. Feed an original sheet (e.g. `cat`) as a style reference.
2. Prompt for a uniform grid of the new character in the SAME poses/style — see
   the prompt template below.
3. Drop the result in `Downloads/` and add it to `scripts/build-skins.py`
   (`row_map` + `flip`), which already does white-removal + normalise + the
   shared post-process (median + 40-colour quantize + hard alpha).

Prompt template (fill the brackets):
> Pixel-art character sprite sheet, uniform 6×7 grid on a plain white
> background, matching the EXACT style of the reference: chibi propeller-pilot,
> big round shiny eyes, blush, dark outline, soft cel shading, ~40 colours.
> Character: **[species]** wearing the shared kit — propeller on the helmet,
> aviator hood in **[signature colour]**, round teal side-pods, brow goggles,
> padded teal-trim flight suit, rocket boots. Species shown via **[helmet
> ears/horn/crest + tail]**. Rows: hover ×6, side-flight ×6, straining ×6,
> boosting w/ effect ×6, cheering ×6, combo ×6, then dizzy / sad-rain-cloud /
> holding-a-trophy / wearing-a-crown / star-eyes / crying. Same proportions and
> line weight as the reference.

### Tier 3 — PROCEDURAL kit  (fallback / prototyping only)
`scripts/pilot_kit.py` + a thin builder (`build-phoenix.py`, `build-dragon.py`).
Fast and guarantees the shared uniform, but lower fidelity and samey bodies.
To make Tier-3 skins less identical, vary the **silhouette**, not just colour:
head:body ratio, body shape (egg vs pear vs round), limb thickness, posture,
face-opening size — add these as kit parameters before shipping more of them.

## QA / "work the differences" loop (do this every skin)

1. Build the sheet.
2. Render a **diff contact sheet**: the new skin's frame next to the same frame
   of `character`/`cat`/`unicorn` at 3–4× (see the one-off snippets in the build
   scripts). Compare side by side — this is how the gap gets caught.
3. Check the measurable house-style invariants:
   - opaque colour count ≈ 40 (run a quick histogram);
   - outline present and ~1–2 px, dark and unified;
   - proportions: head is big, body chunky, limbs short & round;
   - face: 2 big round eyes + single highlight, blush, simple mouth; goggles
     small and ABOVE the eyes (never a second pair of eyes);
   - specials 38/39 show the CHARACTER holding-trophy / wearing-crown.
4. Fix in the builder, rebuild, re-diff. Repeat until the new frame is hard to
   tell apart from the originals at game size.

## Wiring a finished sheet into the game

`public/assets/character_<id>.png` (6×7, 120 px) → add a `load.spritesheet` in
`src/scenes/PreloadScene.ts` → add an entry to `SKINS` in
`src/config/Skins.ts`. Animations and the shop card auto-generate.
