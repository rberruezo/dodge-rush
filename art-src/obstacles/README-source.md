# Obstacles — Piezas modulares (fuente de arte para OBS-008 / OBS-001)

Carpeta de **fuente** para regenerar `public/assets/obstacles.png` a partir de
**piezas limpias y separadas** (cap + centro tileable + cap), en vez de tiles
estirados o columnas derivadas del atlas actual.

> **Estado:** spec + prompt. El arte aún NO está generado. Cuando la IA entregue
> los PNG, se colocan en `pieces/` y se actualiza `scripts/build-obstacles.py`
> para empaquetarlos en el atlas (ver "Integración" abajo).

> **`pieces/` (entrega 2, 2026-06-29):** extraídas de `new-obstacles2.png` (una
> hoja de preview con checkerboard + labels horneados y SIN alpha real). Se
> recortaron por celda con key-out del checker (neutralidad + flood-fill desde
> el borde + silueta sólida con relleno de huecos). Resultado: 16 estáticas
> limpias (8 `_center` + 8 `_cap`) + `red_arrow_cap_anim` (4 frames, limpio) +
> `red_spike_cap_anim` (5 frames, algo rugoso). `gold_block_cap_anim` quedó
> PENDIENTE (la fuente lo duplicó con tamaños/orientación inconsistentes). Si se
> regenera el arte, exportarlo con alpha real evita todo este recorte.

> **`pieces/` (entrega 3 — ACTUAL, 2026-06-29):** **REEMPLAZADAS** desde
> `new-obstacles-3.png` (1536×1024 RGBA, alpha real, fondo transparente — el
> sheet más limpio hasta ahora). Cuerpos (`*_center`) glossy de las columnas
> verticales grandes; caps decorados de las piezas modulares grandes (bevel
> azul, ranurado púrpura, grietas, runa-X violeta/oro, chevron `>`, púas).
> `green_bar_cap` = recolor HLS del cap azul al hue verde (no había cap verde
> modular). **Animaciones procedurales** (los strips de anim del sheet eran muy
> chicos y se distorsionaban a 40×88): `red_arrow` 3 frames (chevron marchando,
> x-offset 2/5/8), `red_spike` 4 frames (púas clavando, x-offset 0/3/6/3),
> `gold_block` 5 frames (shimmer de brillo 1.0/1.12/1.28/1.12/0.92). El packer
> (`scripts/pack-obstacles.py`) regenera el mismo layout (764×272, mismas
> coords) ⇒ `Constants.ts`/`ObstacleTypes.ts` sin cambios. Validado in-engine.

> **`pieces/` (entrega 3b — cuerpos reales, 2026-06-29):** los `*_center` se
> re-extrajeron de las **piezas modulares horizontales** del sheet (la sección
> plana izquierda de cada segmento fila2/fila3) en vez de las barras verticales,
> así el cuerpo es un **trozo real del sprite pintado** (bisel/ranuras/grietas
> del artista). `green_bar_center` = recolor HLS del cuerpo azul al hue verde (no
> hay segmento verde horizontal). El motor cambió: `TextureFactory._c` ahora es
> la **región de cuerpo real entre caps** (no una columna 1px), y `Barrier` la
> dibuja **opaca** (sin transparencia ni relleno plano). El packer toma la franja
> central horizontalmente uniforme del panel ⇒ tilea con costura mínima
> manteniendo el material real.

---

## Por qué (contexto OBS-008)

El atlas actual (`obstacles.png`, 545×92) tiene los obstáculos como **bloques-
cápsula auto-contenidos**: un bevel brillante en los extremos + una "ventana"
central oscura. NO son barras modulares, así que **no tienen un centro tileable
limpio** nativo. OBS-008 derivó el centro como una **columna de 1px** del hombro
del bevel (seamless por construcción, brillante, on-brand) — es shippeable, pero
es un workaround: el cuerpo es una sola columna repetida, no arte de cuerpo real.

Para el look modular pleno + animación rica hace falta **arte nuevo** con las
piezas separadas. Este documento especifica exactamente qué generar.

---

## Cómo se compone una pared (lo que el motor espera)

Cada pared horizontal (`Barrier.ts`) se arma con **3 piezas por lado del gap**:

```
borde de pantalla  ┌──────────────── centro (tileable →) ────────────────┐ cap ▓│  GAP  │▓ cap ┌──── centro ────┐  borde de pantalla
                   └─ se repite hacia el borde ─┘                         └ remata el gap ┘
```

- **cap** = extremo decorado que **remata el borde del gap** (la cara que el
  jugador ve al pasar). NO se estira; se dibuja 1:1.
- **centro** = cuerpo que **tilea horizontalmente sin costura** hacia el borde de
  pantalla. Debe loopear (contenido envuelto en los bordes izq/der).
- El otro lado del gap usa las mismas piezas espejadas.

Parámetros del motor (no cambiar el arte por esto, solo para que encaje):
`bandHeight ≈ 88px` (alto de la banda en juego) · `capFraction 0.32` ·
`GAME_WIDTH 540`. El arte se escala uniforme a la banda, así que **mantené el
mismo alto en todas las piezas de un tipo**.

---

## Los 8 tipos (hue + forma = identidad; SIN glow)

La diferenciación es por **color + forma de tapa**, nunca por glow (OBS-007
shippeó el glow en OFF). Hex = color dominante on-brand de cada tipo:

| Tipo (frame)        | Hue dominante | Forma / tapa                          | Animado |
|---------------------|---------------|---------------------------------------|---------|
| `blue_bar` (Straight) | `#0ca8d8` celeste | barra recta, bevel simple          | no |
| `green_bar` (Wide)    | `#30cca8` menta   | barra ancha, bevel chato           | no |
| `purple_pillar` (Narrow) | `#903c78` magenta | pilar vertical angosto (riel doble) | no |
| `red_arrow` (Moving)  | `#f02430` rojo    | chevrón/flecha que apunta al gap   | **sí** |
| `red_spike` (Danger)  | `#e40c24` rojo profundo | púas/sierra hacia el gap     | **sí** |
| `stone_crack` (Broken) | `#84849c` gris frío | piedra agrietada, borde quebrado | no |
| `blue_tile` (Glowing) | `#7722ee` violeta | placa de energía, borde con runas  | no |
| `gold_block` (Golden) | `#fca800` ámbar   | lingote bevelado, brillo de borde  | **sí** |

---

## Especificación de las piezas a generar

Pixel-art retro, **alpha duro** (sin anti-alias semitransparente en el borde →
sin halo/fringe), paleta acotada por tipo (~4-6 tonos: sombra, base, luz, brillo).

Por **cada tipo** entregar PNG separados con **fondo 100% transparente**:

1. **`<tipo>_center.png`** — cuerpo tileable.
   - Tamaño: **32 × 64 px** (ancho del módulo × alto de banda).
   - **Tileable horizontal sin costura**: el pixel del borde izquierdo debe
     continuar el del borde derecho (probar pegando 3 copias lado a lado → sin
     junta visible). Sin "ventana" central oscura: cuerpo brillante y parejo.
   - Sin degradé vertical fuerte (debe verse uniforme al repetir).

2. **`<tipo>_cap.png`** — tapa que remata el gap (orientada con la cara
   decorada a la **derecha**; el motor la espeja para el otro lado).
   - Tamaño: **24 × 64 px** (mismo alto que el centro).
   - Borde interno (derecho) = remate legible (chevrón/púa/bevel según el tipo).
   - Borde externo (izquierdo) = se funde con el centro (mismo tono base).

### Piezas animadas (mejorar la animación)

Para `red_arrow`, `red_spike` y `gold_block`, además entregar la **tapa como
tira de N frames** (sprite-strip horizontal), no solo 1 frame:

3. **`<tipo>_cap_anim.png`** — tira horizontal de frames de **24 × 64 px** c/u,
   pegados sin separación, de izquierda a derecha:
   - `red_arrow`: **4 frames** — la flecha/chevrón **avanza hacia el gap** y
     reaparece (loop continuo: frame 4 → frame 1 sin salto).
   - `red_spike`: **4 frames** — las púas **se extienden y retraen** (telegrafía
     peligro), loop ping-pong-friendly.
   - `gold_block`: **6 frames** — un **brillo (shine) barre** el bevel de un
     extremo al otro, loop continuo.
   - Todos los frames mismo tamaño, alineados, y el último encadena con el
     primero (loop seamless).

> Opcional (nice-to-have): `<tipo>_center_anim.png` con el cuerpo animado a la
> misma cadencia, si el efecto debe recorrer toda la pared y no solo la tapa.

---

## Integración (cuando llegue el arte)
1. Colocar los PNG en `art-src/obstacles/pieces/`.
2. Actualizar `scripts/build-obstacles.py` para **empaquetar** las piezas en
   `public/assets/obstacles.png` (un slot por pieza; emitir `x/y/w/h` + cantidad
   de frames de cada una).
3. Copiar los rects emitidos a `OBSTACLE_FRAMES` / `OBSTACLE_ANIM_FRAMES` en
   `src/config/Constants.ts`. Con piezas reales, el centro vuelve a ser el ancho
   completo del módulo (ya no la columna 1px de 1px del workaround OBS-008).
4. Subir `animFrames`/`animMs` en `src/config/ObstacleTypes.ts` para los 3 tipos
   animados (p. ej. `red_arrow` 4 frames @ ~120ms; `red_spike` 4 @ ~180ms;
   `gold_block` 6 @ ~110ms).
5. `npx tsc --noEmit && npx vite build`, validar en web, regenerar before/after.

---

## PROMPT para la IA generadora de sprites

> ⚠️ La primera entrega (`new-obstacles.png`, 2026-06-29) vino como **hoja de
> preview**: un solo PNG con **checkerboard y labels horneados** (alpha 100%
> opaco, sin transparencia real) y **render anti-aliased** (bordes blandos en
> 1-2px). El arte era bueno pero NO usable: hace falta alpha binario real. El
> prompt de abajo ya incluye las correcciones (sin fondo, sin texto, alpha duro,
> centros con bordes laterales planos). **Reglas que más fallaron, no omitir.**

Copiá/pegá esto:

```
Generá sprites pixel-art para los obstáculos de un juego arcade vertical
"Dodge Rush" (retro, paleta vibrante). Necesito piezas MODULARES para construir
paredes horizontales por repetición: por tipo, un CUERPO tileable + una TAPA
que remata el borde de un hueco (+ tiras de animación en 3 tipos).

FORMATO DE ENTREGA (CRÍTICO — la entrega anterior falló acá):
- Cada pieza en su PROPIO archivo PNG con CANAL ALPHA / TRANSPARENCIA REAL.
- NO pintes fondo: nada de checkerboard, ni blanco, ni color sólido detrás.
- NO incluyas texto, labels, nombres ni marcos alrededor de las piezas.
- ALPHA DURO / BINARIO: cada pixel del borde es 100% opaco o 100% transparente.
  SIN anti-alias, SIN sombras suaves, SIN halos ni desenfoque en el contorno.
- Pixel-art nítido a resolución nativa (no upscale borroso).

ESTILO
- ~4-6 tonos por tipo (sombra/base/luz/brillo), con bevel/relieve.
- Identidad SOLO por color + forma de tapa. NADA de glow/blur/neón difuso.
- Mismo ALTO exacto en todas las piezas de un mismo tipo.

PIEZAS POR TIPO
1) CUERPO "<tipo>_center" 32x64 px, TILEABLE en horizontal SIN COSTURA.
   CLAVE: los bordes IZQUIERDO y DERECHO deben ser PLANOS y verticales —
   SIN bevel, highlight ni sombra en los lados — para que al pegar 3 copias
   lado a lado NO se vea ninguna junta. El relieve/bevel va SOLO arriba y abajo.
   Cuerpo brillante y uniforme, sin ventana oscura central.
2) TAPA "<tipo>_cap" 24x64 px (mismo alto que el centro), con la cara decorada
   hacia la DERECHA (borde derecho = remate legible; borde izquierdo plano,
   mismo tono base que el centro, para fundirse con él).

LOS 8 TIPOS (hue dominante + forma de tapa)
- blue_bar     #0ca8d8 celeste  — barra recta, bevel simple
- green_bar    #30cca8 menta     — barra ancha, bevel chato
- purple_pillar#903c78 magenta   — pilar vertical angosto (riel/groove doble)
- red_arrow    #f02430 rojo      — chevrón/flecha apuntando al hueco
- red_spike    #e40c24 rojo prof.— púas/sierra hacia el hueco
- stone_crack  #84849c gris frío — piedra agrietada, borde quebrado
- blue_tile    #7722ee violeta   — placa de energía, borde con runas
- gold_block   #fca800 ámbar     — lingote bevelado, brillo de borde

ANIMACIÓN (sólo estos 3) — tira horizontal de frames del MISMO tamaño 24x64,
pegados sin separación, fondo transparente, loop continuo (último frame
encadena con el primero):
- red_arrow_cap_anim: 4 frames — el chevrón/flecha AVANZA hacia el hueco.
- red_spike_cap_anim: 4 frames — las púas se EXTIENDEN y RETRAEN.
- gold_block_cap_anim: 6 frames — un BRILLO barre el bevel de un extremo al otro.

ENTREGABLE
- 19 PNG transparentes individuales: 8 <tipo>_center, 8 <tipo>_cap,
  3 <tipo>_cap_anim. Sin labels, sin fondo, cada uno recortado a su bbox.
- Si la herramienta SÓLO puede exportar una imagen: poné las piezas en una
  grilla con SEPARACIÓN transparente entre ellas, SIN labels y SIN checkerboard
  (fondo transparente real), para poder recortarlas por bbox.
```
