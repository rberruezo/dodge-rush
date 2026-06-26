# Sky City — Fondo infinito (assets)

Fondo vertical infinito para juego pixel-art retro (descenso aéreo).
El **cielo es fijo** (solo hace crossfade entre zonas); las **nubes y dirigibles**
hacen loop vertical sin costura con parallax.

## Archivos

| Archivo | Tamaño | Uso |
|---|---|---|
| `sky_day.png` `sky_dusk.png` `sky_sunset.png` `sky_twilight.png` `sky_night.png` `sky_aurora.png` | 720×1280 | Skybox por zona (estrellas, vía láctea, auroras, sol/astros). NO se desplaza; se hace crossfade entre uno y el siguiente. |
| `clouds.png` | 720×900 | Nubes cercanas (tile loopeable). Neutras → se tiñen por zona. parallax ≈ 0.52 |
| `clouds_far.png` | 720×900 | Nubes lejanas tenues (tile loopeable). parallax ≈ 0.18 |
| `airships.png` | 720×2400 | Dirigibles steampunk, silueta (tile loopeable). Tile alto = baja frecuencia. parallax ≈ 0.34 |
| `airships_lights.png` | 720×2400 | Luces neón de los dirigibles. Blend ADITIVO ("lighter"/ADD), NO teñir. |
| `spaceship.png` | 720×6400 | Nave espacial (crucero sci-fi), silueta. Tile MUY alto = aparición rara. parallax ≈ 0.28 |
| `spaceship_lights.png` | 720×6400 | Luces neón de la nave. Blend ADITIVO, NO teñir. |
| `palettes.json` | — | Orden de zonas + color de tinte (`grade`/`gradeA`) y color de acento por zona. |

## Cómo loopea (sin costura)

Cada tile fue generado envolviendo su contenido en los bordes, así que se repite
vertical sin junta visible:

```js
scroll += speed * dt;                 // el contenido sube (personaje cae)
const o = ((scroll*L.speed) % L.tileH + L.tileH) % L.tileH;
for (let y = -o - L.tileH; y < H; y += L.tileH)
    ctx.drawImage(L.img, 0, Math.round(y), W, L.tileH);
```

## Orden de dibujo por frame

1. `sky_<zonaActual>` (alpha 1) + `sky_<zonaSiguiente>` (alpha t) — crossfade
2. `clouds_far` → `spaceship` → `airships` (siluetas, estructura)
3. graduado atmosférico de la zona (rect color translúcido) — tiñe nubes/vehículos
4. `spaceship_lights` + `airships_lights` con blend aditivo (no se tiñen)
5. `clouds`
6. viñeta opcional

> **Frecuencia** = altura del tile. Cuanto más alto el tile, más espaciada la aparición:
> nubes 900 (frecuente) · dirigibles 2400 (ocasional) · nave 6400 (rara).
> Para hacerlos aún más raros, regenera con un tile más alto.

## Ciclo de zonas

`day → dusk → sunset → twilight → night → aurora → (repite)`
Cambia cada `zoneLength` metros con crossfade. Ver `palettes.json`.

Tile size de nubes = 900, dirigibles = 1280 — cualquier alto sirve mientras uses
el mismo valor en el loop. Las 3 capas a velocidades distintas dan profundidad.
