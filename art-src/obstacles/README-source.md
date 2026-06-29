# Obstacles — Piezas modulares (fuente de arte para OBS-008 / OBS-001)

Carpeta de **fuente** para regenerar `public/assets/obstacles.png` a partir de
**piezas limpias y separadas** (cap + centro tileable + cap), en vez de tiles
estirados o columnas derivadas del atlas actual.

> **Estado:** spec + prompt. El arte aún NO está generado. Cuando la IA entregue
> los PNG, se colocan en `pieces/` y se actualiza `scripts/build-obstacles.py`
> para empaquetarlos en el atlas (ver "Integración" abajo).

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

Copiá/pegá esto (ajustá sólo si la herramienta pide otro formato de salida):

```
Generá un set de sprites pixel-art para los obstáculos de un juego arcade
vertical "Dodge Rush" (estilo retro, paleta vibrante, fondo 100% transparente,
PNG con ALPHA DURO — sin bordes anti-aliasados ni halos semitransparentes).

Necesito piezas MODULARES para construir paredes horizontales por repetición:
para cada tipo, un CUERPO tileable + una TAPA que remata el borde de un hueco.

REGLAS GLOBALES
- Fondo transparente real (no blanco/checker pintado).
- Borde con alpha binario (pixel 100% opaco o 100% transparente).
- Pixel-art nítido, ~4-6 tonos por tipo (sombra/base/luz/brillo), con bevel.
- Identidad SOLO por color + forma de tapa. NADA de glow/blur/neón difuso.
- Mismo ALTO en todas las piezas de un tipo.

PIEZAS POR TIPO
1) CUERPO "<tipo>_center" 32x64 px, TILEABLE en horizontal SIN COSTURA
   (el borde izquierdo continúa el derecho; al pegar 3 copias no debe verse
   junta). Cuerpo brillante y uniforme, sin ventana oscura central, sin
   degradé vertical fuerte.
2) TAPA "<tipo>_cap" 24x64 px, con la cara decorada hacia la DERECHA (borde
   derecho = remate legible; borde izquierdo se funde con el cuerpo).

LOS 8 TIPOS (hue dominante + forma de tapa)
- blue_bar     #0ca8d8 celeste  — barra recta, bevel simple
- green_bar    #30cca8 menta     — barra ancha, bevel chato
- purple_pillar#903c78 magenta   — pilar vertical angosto (riel/groove doble)
- red_arrow    #f02430 rojo      — chevrón/flecha apuntando al hueco
- red_spike    #e40c24 rojo prof.— púas/sierra hacia el hueco
- stone_crack  #84849c gris frío — piedra agrietada, borde quebrado
- blue_tile    #7722ee violeta   — placa de energía, borde con runas
- gold_block   #fca800 ámbar     — lingote bevelado, brillo de borde

ANIMACIÓN (mejorar el movimiento) — sólo estos 3, como TIRA horizontal de
frames del MISMO tamaño 24x64, pegados sin separación, loop continuo
(último frame encadena con el primero):
- red_arrow_cap_anim: 4 frames — el chevrón/flecha AVANZA hacia el hueco y
  reaparece.
- red_spike_cap_anim: 4 frames — las púas se EXTIENDEN y RETRAEN (telegrafía
  peligro).
- gold_block_cap_anim: 6 frames — un BRILLO barre el bevel de un extremo al
  otro.

ENTREGABLE
- Un PNG transparente por pieza, nombrado <tipo>_center.png / <tipo>_cap.png /
  <tipo>_cap_anim.png.
- Para las tiras de animación, todos los frames en una sola fila, mismo tamaño
  y alineados.
```
