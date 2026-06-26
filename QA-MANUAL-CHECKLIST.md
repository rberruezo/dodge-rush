# Dodge Rush — Checklist de QA manual (Gameplay GP-01..GP-10)

> Para ejecución **manual en navegador/dispositivo real** — el único hueco que
> no cubren los unit tests. Complementa `QA-PLAN.md`. Marca cada caso
> ✅ PASS / ❌ FAIL / ⚠️ DUDA y anota evidencia.

## Preparación

1. Arrancar el dev server: `npm run dev` (requiere Node ≥20).
2. Abrir en navegador desktop **y** en un móvil real (mismo Wi-Fi, IP que imprime Vite).
3. Tener la consola del navegador abierta. En DEV hay helpers:
   - `window.game` — instancia Phaser (escenas, loop).
   - `window.diagnostics.recent` — eventos de error registrados (debería estar **vacío** en una sesión sana).
   - `window.sound` — control de audio.
4. **Estado limpio:** en consola, `['coins','highscore','skins','ghost','skin','difficulty'].forEach(k=>localStorage.removeItem('dodgerush.'+k)); location.reload()`.

> ⚠️ El código tuvo un refactor reciente (power/smash, modos de dificultad,
> daily challenge; posible retirada de ghost/dash). Antes de empezar, **confirma
> en el menú/HUD qué mecánicas existen hoy** y ajusta GP-02/GP-07 y el anexo.

## Matriz de dispositivos

| Entorno | Navegador | Resultado |
|---|---|---|
| Desktop | Chrome | |
| Desktop | Safari/Firefox | |
| Móvil | iOS Safari | |
| Móvil | Android Chrome | |

---

## Casos

### GP-01 — Steering izquierda/derecha · **P0**
- **Precondición:** run iniciado (PLAY).
- **Pasos:** mantén pulsado el lado izquierdo; suelta; mantén el derecho. Llévalo hasta cada borde.
- **Esperado:** el personaje se mueve lateral y fluido (~0.62 px/ms), responde al instante, **se detiene en el borde** (no se sale ni "rebota"). La animación cambia a "esfuerzo" si mantienes >360 ms.
- **Resultado:** ⬜  · Notas:

### GP-02 — Dash (doble-tap) evade obstáculo · **P0**
> Confirmar primero que el dash sigue existiendo (el menú indica "Double-tap a side to DASH").
- **Pasos:** acércate a una pared y haz **doble-tap** en un lado (<300 ms entre taps) justo antes de impactar.
- **Esperado:** ráfaga de ~165 px en ~165 ms; durante ~240 ms eres invencible (atraviesas sin perder vida); hay trail/FX de dash.
- **Resultado:** ⬜  · Notas:

### GP-03 — Colisión resta vida · **P0**
- **Precondición:** vidas iniciales = 3 (CLASSIC) o 5 (RELAX) — confírmalo en el HUD.
- **Pasos:** choca deliberadamente contra una pared (fuera del hueco).
- **Esperado:** −1 vida, feedback visual (parpadeo) + sonido; **invencibilidad de gracia ~1500 ms** (parpadeo ~110 ms) tras el golpe. Al llegar a 0 vidas → pantalla **Game Over**.
- **Resultado:** ⬜  · Notas:

### GP-04 — Sin muertes inevitables (fairness) · **P0**
> Cubierto por unit test (`GapPlanner.test.ts`); aquí solo sanity manual.
- **Pasos:** juega 8–10 runs llegando lo más lejos posible (idealmente >2 min para alcanzar dificultad alta).
- **Esperado:** **nunca** un hueco aparece tan desplazado/estrecho que sea imposible alcanzarlo a tiempo. Siempre hay una trayectoria de escape. Ventana de reacción mínima perceptible (~600 ms) incluso a velocidad máxima.
- **Resultado:** ⬜  · Notas (anota el seed/score si ves una muerte sospechosa):

### GP-05 — Precisión de colisión (hitbox) · **P0**
> Hitbox ~30% ancho × ~36% alto del sprite (con padding perdonador).
- **Pasos:** roza el borde del hueco por ambos lados; pasa "justo".
- **Esperado:** **sin "ghost hits"** (morir sin tocar visualmente) ni **"phantom pass"** (atravesar una pared claramente). El margen perdonador se siente justo, no tramposo.
- **Resultado:** ⬜  · Notas:

### GP-06 — Multiplicador de combo · **P1**
> Tiers: x2(2 pases) · x3(4) · x5(7) · x10(12) · x20(20) · x35(50) · x60(100) … x200(500). Se resetea al perder vida.
- **Pasos:** encadena pases sin chocar y observa el HUD; luego choca a propósito.
- **Esperado:** el multiplicador sube por los tiers indicados con su flash/celebración; el juego **acelera** con el combo; al perder vida el combo y el multiplicador **vuelven a x1**.
- **Resultado:** ⬜  · Notas:

### GP-07 — Cooldown del dash no abusable · **P1**
- **Pasos:** intenta hacer dash repetidamente (spam de doble-tap).
- **Esperado:** tras un dash hay **recarga ~2600 ms** durante la cual no se puede volver a hacer dash (indicador en HUD si existe). No permite invencibilidad continua.
- **Resultado:** ⬜  · Notas:

### GP-08 — Rampa de dificultad suave · **P1**
- **Pasos:** juega un run largo (>2.5 min) observando velocidad, frecuencia y ancho de huecos.
- **Esperado:** todo sube de forma **continua** (cada 30 s un escalón de "mix" de obstáculos), **sin saltos/picos bruscos**. CLASSIC topa al step 8; RELAX es claramente más lento y topa antes (step 4).
- **Resultado:** ⬜  · Notas:

### GP-09 — Pausa congela el estado · **P1**
- **Pasos:** en pleno run, pausa (botón / tecla `P` o `ESC`), espera ~30 s, reanuda.
- **Esperado:** al reanudar, **posición, score, combo y velocidad intactos**; no hay "salto" ni avance de obstáculos durante la pausa; el audio se silencia/reanuda coherente.
- **Resultado:** ⬜  · Notas:

### GP-10 — Pérdida de foco / dt grande · **P1**
> El loop clampa `dt = min(delta, 1000/30)`; cambiar de pestaña no debe teletransportar obstáculos.
- **Pasos:** en pleno run, cambia a otra pestaña/app ~10 s y vuelve.
- **Esperado:** al volver **no hay "teleport"** de obstáculos ni muerte instantánea por acumulación de tiempo; el juego o bien pausó o reanuda sin salto. `window.diagnostics.recent` sin errores nuevos.
- **Resultado:** ⬜  · Notas:

---

## Anexo — mecánicas/escenas nuevas a confirmar (post-refactor)

| ID | Qué | Cómo | Esperado | Resultado |
|---|---|---|---|---|
| NX-01 | **Power / Smash** | Cargar/activar el "smash" (HUD `setPower`/`breakNext`) | Rompe el obstáculo más cercano no pasado + FX "SMASH!"; respeta su recarga | ⬜ |
| NX-02 | **Modos de dificultad** | Elegir CLASSIC vs RELAX | Persiste tras recargar; RELAX más lento/forgiving (más vidas, huecos más anchos) | ⬜ |
| NX-03 | **Daily challenge** | Entrar a la escena `Daily` | Carga sin crash; reglas/seed del día coherentes | ⬜ |
| NX-04 | **Ghost racing** (si sigue) | Tras un best, reintentar | Réplica translúcida sincronizada — **o** confirmar que se retiró | ⬜ |

## Cierre de cobertura no-funcional (complementa NF-01..NF-05)

- [ ] **FPS** estable (DevTools → Performance / `window.game.loop.actualFps` ≥ 55) en gama media.
- [ ] **Sin fugas:** 10 min de juego sin crecimiento sostenido de heap (pool reciclado).
- [ ] **Responsive/rotación:** portrait correcto; rotar no rompe layout ni input.
- [ ] **Audio:** arranca tras el primer tap (autoplay desbloqueado); mute persiste.
- [ ] **Observabilidad:** al terminar la sesión, revisar `window.diagnostics.recent` — cualquier evento `error`/`storage`/`asset`/`audio` inesperado se registra como bug.

## Sonido — percepción humana (lo que los unit tests NO pueden validar)

> La *lógica* de sonido está cubierta por `SoundManager.test.ts` (mute,
> persistencia, síntesis de SFX, control de música). Esto valida que **se
> escuche bien y sea agradable** — subjetivo, requiere oído.

| ID | Qué escuchar | Esperado | Resultado |
|---|---|---|---|
| SND-01 | Música de menú y de juego | Loop **sin click/corte** audible en el empalme; volumen agradable (~0.45), no tapa los SFX | ⬜ |
| SND-02 | SFX de pase / near-miss | "Swish+ping" satisfactorio; el near-miss se distingue del pase normal | ⬜ |
| SND-03 | SFX de golpe (`hit`) | "Bonk" cartoon, **no** estridente ni agresivo | ⬜ |
| SND-04 | SFX de smash | Lee como "metal roto" 8-bit, punchy, no molesto | ⬜ |
| SND-05 | Combo subiendo | El tono **sube** con el combo y se siente más emocionante en tiers altos | ⬜ |
| SND-06 | Coin / new-best / skin-unlock | Arpegios alegres, premian sin saturar | ⬜ |
| SND-07 | Mezcla general | Ningún SFX satura/clippea al solaparse (varios a la vez en combo alto) | ⬜ |
| SND-08 | Mute / unmute | Silencia SFX **y** música al instante; estado persiste tras recargar | ⬜ |
| SND-09 | Autoplay móvil | El audio arranca tras el primer tap (no antes); sin error en consola | ⬜ |
| SND-10 | Pausa/reanudar | El sonido se atenúa/retoma coherente con la pausa | ⬜ |

## Skins y animaciones — percepción humana

> La *integridad estructural* (todos los skins tienen su PNG, animaciones dentro
> del grid, orientación correcta por pose) está cubierta por `Skins.test.ts` y
> `PlayerFacing.test.ts`. Esto valida que se **vean bien** — subjetivo, requiere ojo.
> Recorré **cada skin** desde la tienda y equipalo.

| ID | Qué mirar (por cada skin) | Esperado | Resultado |
|---|---|---|---|
| SK-01 | Animación de vuelo idle (hover) | Fluida, en loop, sin frames "saltados" ni glitches | ⬜ |
| SK-02 | Animación de steering (move / move-hard) | Cambia a "esfuerzo" al mantener; transición limpia | ⬜ |
| SK-03 | **Orientación al moverse** | Mira **hacia donde se desplaza** (izq/der); al celebrar/boost no "gira" al revés | ⬜ |
| SK-04 | Celebración de combo / cheer / boost | Frames correctos, sin sprite roto ni recorte | ⬜ |
| SK-05 | Tint (skins paleta: aqua/lime/violet/gold/shadow) | El recoloreo se ve bien, legible sobre el fondo | ⬜ |
| SK-06 | Sheets propios (cat, dragon, unicornio, …, nemesis) | Arte correcto del personaje (no el fallback genérico ni textura faltante) | ⬜ |
| SK-07 | Trail / partículas | El color del trail combina con el skin | ⬜ |
| SK-08 | Consistencia entre menú, juego y tienda | El mismo skin se ve igual en las 3 pantallas | ⬜ |

> ⚠️ Si algún skin aparece como un **blob genérico/sin animar**, su sheet no se
> cargó: revisá `window.diagnostics.recent` (evento `asset`) y confirmá que el
> PNG está en `public/assets/` y listado en `PreloadScene`.

## Registro de bugs encontrados

| GP/NX | Severidad | Descripción | Pasos para reproducir | Evidencia |
|---|---|---|---|---|
| | | | | |
