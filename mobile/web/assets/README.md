# Art assets

Drop the three provided pixel-art images here with **these exact filenames**:

| File             | What it is                          | Notes                                                        |
| ---------------- | ----------------------------------- | ------------------------------------------------------------ |
| `character.png`  | The cute pink propeller-hat hero    | A 6-column sprite sheet (idle / fly / hurt / cheer rows).    |
| `background.png` | The dreamy floating-city sky        | Portrait. Tiled vertically for the infinite scroll.          |
| `obstacles.png`  | The block-with-hole obstacle pack   | One packed PNG; sub-frames are sliced by coordinates in code.|

The game runs **without** these files — it generates simple placeholder
textures so you can play immediately — but dropping the real art in gives you
the intended look with zero code changes.

## Tuning the slicing

The supplied art is hand-laid, so frame boundaries are best-effort estimates.
If a character pose or an obstacle looks cropped, adjust the tables in
[`src/config/Constants.ts`](../../src/config/Constants.ts):

- `CHARACTER_FRAME` — the cell `width`/`height` of one sprite-sheet frame.
- `CHARACTER_ANIMS` — which frame ranges map to each animation.
- `OBSTACLE_FRAMES` — the `{ x, y, width, height }` of each obstacle inside
  `obstacles.png` (coordinates assume a 1024×1024 source image).
