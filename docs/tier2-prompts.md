# Tier-2 prompts — AI source art to replace PHOENIX & DRAGON

Use these with an image model that supports **style reference images**. Attach
`public/assets/character_cat.png` (and optionally `character.png`) as the style
reference so the model matches line weight, shading and proportions exactly.
After generating, drop the PNG in `~/Downloads/` and slice it with
`scripts/build-skins.py` (add a `SHEETS` entry: `row_map` + which rows to `flip`).

## Shared requirements (paste into both)

> A single pixel-art **character sprite sheet** on a **plain flat white
> background**, arranged as a **uniform 6-column × 7-row grid**, every cell the
> same size, character centered in each cell. Match the EXACT art style of the
> attached reference: chibi "propeller-pilot", **big head, small round body,
> short chubby limbs**, **big round shiny eyes with a single white highlight**,
> rosy blush, **soft cel shading** (highlight / mid / shadow), a **clean dark
> outline (~1–2 px), unified around the silhouette**, limited palette (~30–40
> colours), no anti-aliasing halo, no text, no drop shadow on the background.
> Every character wears the SAME kit: a little **propeller on a short shaft on
> top of the helmet**, a **snug aviator hood** framing a cream face, **round
> teal "headphone" pods** on the helmet sides, **small goggles on the brow**, a
> **padded flight suit with teal trim and a round chest panel**, and **rocket
> boots with an orange flame**.
>
> Grid rows (top to bottom), 6 frames each = one animation:
> 1. **hover** — facing the viewer, gentle float, propeller spinning;
> 2. **side-flight, calm** — leaning into a glide, facing LEFT;
> 3. **side-flight, straining** — harder lean, focused/effort face, facing LEFT;
> 4. **boosting** — excited, the signature effect at full blast (see below);
> 5. **cheering** — arms up, big happy closed-eye smile;
> 6. **combo celebration** — joyful, escalating sparkle/effect, star-eyes on the last 2;
> 7. **six single poses**: dizzy (X / swirl eyes), sad under a little rain
>    cloud, **holding up a gold trophy**, **wearing a gold crown**, close-up
>    with star-sparkle eyes + big grin, crying/sad.
> Keep the SAME proportions, outline weight and palette discipline as the
> reference across all 42 frames.

## PHOENIX (fiery orange)

> …Character: a **baby phoenix pilot**. Signature colour **fiery orange-red**
> hood and suit (highlights warm gold-orange, shadows deep red). Species cues: a
> small **flame crest** poking up from the top of the helmet (around the
> propeller) and a **flame-feather tail** trailing behind the body; tiny
> rounded wings. Boost effect (row 4): the pilot is **wrapped in a corona of
> fire** with flying embers. Trail/sparkle accents in amber. Cream face, teal
> pods/trim like the reference.

## DRAGON (friendly green)

> …Character: a **baby dragon pilot**. Signature colour **friendly leaf-green**
> hood and suit (yellow-green highlights, deep-green shadows). Species cues:
> **two small ivory horns** and a low row of **soft back-spikes** on the helmet,
> and a **chubby scaly tail with a spade tip** curling out behind. Boost effect
> (row 4): the dragon **breathes a burst of fire forward** from its mouth.
> Cream face, teal pods/trim like the reference. Keep it cute, not scary
> (kids/families audience).

## After generating

1. Save as e.g. `~/Downloads/phoenix_src.png`.
2. In `scripts/build-skins.py`, add to `SHEETS`:
   `{'src': '…/phoenix_src.png', 'out': 'public/assets/character_phoenix.png',
     'cols': 6, 'rows': 7, 'row_map': [0,1,2,3,4,5,6], 'flip': {1,2}}`
   (adjust `row_map`/`flip` if the generated rows differ — rows 1 & 2 must end
   up facing LEFT; verify with a quick render).
3. Run `python scripts/build-skins.py` → it removes the white bg, normalises,
   and applies the shared post-process. The `Skins.ts` / `PreloadScene` wiring
   already exists for these two ids.
4. Run the QA diff (see docs/skin-process.md) against `cat`/`unicorn`.
