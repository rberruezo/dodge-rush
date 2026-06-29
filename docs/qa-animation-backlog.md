# Dodge Rush — QA de Animaciones (Backlog priorizado)

> **Propósito:** auditoría exhaustiva de TODAS las animaciones del juego (foco en el personaje principal) y backlog accionable de mejoras. No busca animación AAA: prioriza claridad, fluidez, respuesta inmediata y simplicidad de producción para un arcade hypercasual mobile.
>
> **Autor:** QA Session (Senior QA / Game Designer / Technical Animator / UX)
> **Fecha:** 2026-06-28
> **Método:** auditoría de código + sprite sheet (`public/assets/character.png`) + tuning (`src/config/Constants.ts`) contrastado contra la spec del propio proyecto (`docs/visual-art-direction.md`). La lógica de animación es 100% determinista en código/config, así que los hallazgos son concluyentes; el *feel* subjetivo de timing conviene validarlo además con captura en dispositivo (el emulador da artefactos de perf por GL software).

---

## Leyenda

**Severidad:** Crítico · Alto · Medio · Bajo · Cosmético
**Prioridad:** P0 (bloqueante) · P1 (alta) · P2 (media) · P3 (baja)
**Esfuerzo:** XS · S · M · L · XL
**Status:** `PENDING` · `IN PROGRESS` · `DONE` · `BLOCKED` (requiere arte/asset propio) · `SKIP`

---

## 1. Resumen ejecutivo

El arte **estático** del piloto es bueno (vector flat, expresivo, sheet de 48 frames). Pero el juego **usa solo una fracción de la animación que tiene autorizada**, y deja sin animar precisamente los tres momentos que más importan en un arcade de reflejos: **la caída, el golpe y la muerte**. El personaje se lee como *"flotando tranquilo"* mientras el mundo hace todo el trabajo de comunicar velocidad y peligro. Funciona, pero se siente *amateur* en los picos emocionales.

**¿Parece realmente estar cayendo?** No. Lee como **hover/flotar** (propeller + pose frontal calma), no como descenso. Y como la animación del cuerpo no escala con la velocidad (la misma a 0.2 y a 0.6 px/ms, un rango 3×), a alta velocidad el mundo se dispara pero el personaje sigue idéntico de tranquilo. La caída la cuenta el fondo, no el piloto.

### Puntos fuertes
- Sprite sheet sólido y con personalidad (el propeller como identidad funciona).
- Movimiento horizontal **responsive** (input limpio, sin lag perceptible).
- Tilt/bank suave y discreto; buena base.
- Celebración de récord en Game Over ya tiene "juice" (hop + squash/stretch).
- Robustez: fallbacks de pose para skins parciales, nunca crashea por frame faltante.

### Debilidades principales
1. **El propeller se detiene** (`this.stop()`) en golpe, combo y muerte → viola el principio #1 del propio doc ("si el propeler se detiene, el personaje parece muerto antes de morir"). Ocurre cada vez que te golpean, durante 1.5 s.
2. **La muerte es un único frame estático**, no una animación. La spec pide 2 beats (bonk + salida en arco). Los frames para hacerlo (43–47) están dibujados y sin usar.
3. **Sin squash & stretch** en el movimiento lateral, pese a estar exigido explícitamente en la dirección de arte.
4. **Sin feedback de velocidad/aceleración** en el personaje; sin reacción de *near miss*; sin animación de spawn.
5. **Inconsistencias:** la muerte difiere entre base y skins (y en skins es idéntica a la pose de golpe); el bob del idle difiere menú vs gameplay; el tilt depende de FPS.

---

## 2. Score general (1–10)

| Dimensión | Score | Comentario |
|---|---:|---|
| Calidad visual | 6 | Arte estático bueno; uso animado parcial. |
| Fluidez | 5 | Loops ok, pero cortes duros, cheer de 2 frames, dependencia de FPS. |
| Game Feel | 4 | Sin squash/stretch, sin spawn, propeller congelado al golpe, sin cue de velocidad. |
| Claridad | 6 | Poses claras por separado. |
| Legibilidad | 5 | Gameplay legible, pero golpe/dizzy/muerte ambiguos y congelados. |
| Consistencia | 4 | Muerte base≠skin; bob menú≠juego; timing variable; FPS-dependiente. |
| Timing | 5 | Muerte demasiado corta, combo estático largo, cheer "buzz". |
| Transiciones | 3 | Cortes duros en todo; corte de escena seco; desync flip/tilt. |
| Respuesta del personaje | 6 | Input muy responsive; falta "jugo". |
| Nivel de polish | 4 | Muchos frames autorizados sin usar; principios propios incumplidos. |
| **Global** | **≈4.8** | Funcional pero sin pulir en los momentos que importan. |

---

## 3. Top 10 problemas (por impacto)

1. **DR-13** — El propeller se congela 1.5 s en cada golpe ("parece muerto en vida").
2. **DR-17** — La muerte es un solo frame estático, no una animación (sin 2 beats).
3. **DR-19** — La muerte en skins cae a `dizzy` → inconsistente e idéntica a la pose de golpe.
4. **DR-05** — Sin squash & stretch en el movimiento lateral (exigido por la spec).
5. **DR-01** — El personaje lee como "flotar", no como "caer" (sin orientación/cue de descenso).
6. **DR-02** — La animación no escala con la velocidad de caída (sin feedback de aceleración).
7. **DR-06** — `faceFlipDelayMs:0` hace *strobe* del espejo del sprite en taps rápidos.
8. **DR-20** — Sin FX de muerte / el propeller no se dobla (desaparición seca).
9. **DR-12** — Sin pose de impacto propia (salta directo a `dizzy` estático).
10. **DR-15** — Sin reacción de *near miss* en el personaje (la spec pide ~200 ms de susto).

---

## 4. Backlog completo

> Cada ítem: Severidad · Categoría · Prioridad · Esfuerzo · Status, más Descripción / Impacto / Recomendación. Referencias de código en `archivo:línea`.

### A. Caída / Idle / Orientación

#### DR-01 — El personaje no comunica "caída"; lee como hover
- **Severidad:** Alto · **Categoría:** Estado / Legibilidad · **Prioridad:** P1 · **Esfuerzo:** M · **Status:** `DONE` (2026-06-28)
- **Descripción:** El estado base es `hover` (frames 0–5, frontal y calmo) + bob de ±4px. Toda la sensación de descenso la aporta el scroll del fondo y los obstáculos subiendo; el cuerpo del piloto no tiene orientación, inclinación ni cue de descenso.
- **Impacto:** La fantasía central ("caer esquivando") no la sostiene el protagonista. Reduce inmersión y claridad de la mecánica.
- **Recomendación:** No hace falta una pose "cabeza abajo". Basta con un leve cabeceo hacia adelante en idle, estelas de viento sutiles detrás, y/o que el propeller gire algo más rápido. Simple, no AAA.

#### DR-02 — La animación no escala con la velocidad de caída
- **Severidad:** Alto · **Categoría:** Game Feel · **Prioridad:** P1 · **Esfuerzo:** S · **Status:** `DONE` (2026-06-28)
- **Descripción:** `hover` corre a 7fps fijos y el bob a velocidad fija desde `SCROLL_CFG.startSpeed` 0.2 hasta ~0.6 px/ms (3×). El único cue de velocidad es el sonido `danger` y el fondo.
- **Impacto:** A máxima dificultad el personaje se ve tan tranquilo como al inicio; se pierde la curva de tensión en el actor principal.
- **Recomendación:** Mapear `frameRate` del propeller y/o amplitud del bob a `speed` (p. ej. 7→11fps). Opcional: activar estelas por encima de cierto umbral.

#### DR-03 — Bob idle demasiado sutil
- **Severidad:** Bajo · **Categoría:** Animación · **Prioridad:** P2 · **Esfuerzo:** XS · **Status:** `DONE` (2026-06-28)
- **Descripción:** `PLAYER_CFG.bobAmp:4` ≈ 3% del sprite (122px). Apenas se percibe "vida"; el loop de 6 frames carga casi todo el movimiento.
- **Impacto:** Idle algo rígido/estático en reposo.
- **Recomendación:** Subir bob a ~7–8px y, opcional, añadir ±1° de balanceo en `aliveTick` (`src/objects/Player.ts:93`).

#### DR-04 — Bob idle inconsistente menú vs gameplay
- **Severidad:** Cosmético · **Categoría:** Consistencia · **Prioridad:** P3 · **Esfuerzo:** XS · **Status:** `DONE` (2026-06-28)
- **Descripción:** El héroe del menú bobea 16px por tween (`src/scenes/MainMenuScene.ts:66`) mientras el jugador in-game bobea 4px por seno. Dos "respiraciones" distintas para el mismo personaje.
- **Impacto:** Rompe sutilmente la sensación de que es el mismo actor.
- **Recomendación:** Unificar amplitud/curva (igualar valores o reutilizar la misma amplitud que `aliveTick`).

### B. Movimiento lateral / cambio de dirección

#### DR-05 — Sin squash & stretch en el movimiento lateral
- **Severidad:** Alto · **Categoría:** Game Feel · **Prioridad:** P1 · **Esfuerzo:** S · **Status:** `DONE` (2026-06-28)
- **Descripción:** La dirección de arte lo pide literalmente ("El movimiento lateral tiene squash & stretch suave"), pero en `steer` solo hay desplazamiento + tilt; no hay `setScale` dinámico en juego.
- **Impacto:** El movimiento se siente "mecánico" en vez de "vivo"; máximo valor/esfuerzo para game feel.
- **Recomendación:** Estirar ~1.05 en X y comprimir ~0.97 en Y al moverse, y volver a 1.0 con easing al soltar. Pocas líneas en `steer`. El hitbox no se ve afectado (es fijo, calculado en el constructor).

#### DR-06 — `faceFlipDelayMs:0` hace strobe del espejo en taps rápidos
- **Severidad:** Alto · **Categoría:** Animación / Bug · **Prioridad:** P1 · **Esfuerzo:** XS · **Status:** `DONE` (2026-06-28)
- **Descripción:** El comentario en `src/objects/Player.ts:70` dice que el debounce evita el "strobing" en dodges rápidos, pero `PLAYER_CFG.faceFlipDelayMs:0` desactiva ese debounce: el sprite se espeja en el mismo frame del cambio.
- **Impacto:** Alternar izquierda/derecha rápido (lo habitual al esquivar) hace parpadear/voltear el sprite — se ve nervioso/glitchy.
- **Recomendación:** Poner `faceFlipDelayMs` en ~90–120 ms (el código ya está preparado para hacerlo). Cambio de 1 valor.

#### DR-07 — Flip instantáneo vs tilt gradual → desync al cambiar de dirección
- **Severidad:** Medio · **Categoría:** Transición · **Prioridad:** P2 · **Esfuerzo:** S · **Status:** `PENDING`
- **Descripción:** Al cambiar de dirección, el `flipX` es instantáneo pero el `angle` interpola hacia el nuevo tilt (`src/objects/Player.ts:87`). Durante unos frames el sprite ya está espejado pero aún inclinado al lado anterior → parece "inclinarse hacia atrás".
- **Impacto:** Micro-pose incorrecta en cada cambio de dirección; sensación de pop.
- **Recomendación:** Acompañar el flip con un reseteo rápido del tilt (o cruzar el tilt por 0 antes de espejar). Con DR-06 aplicado ocurre menos seguido.

#### DR-08 — El tilt (bank) depende de FPS
- **Severidad:** Medio · **Categoría:** Bug / Timing · **Prioridad:** P2 · **Esfuerzo:** S · **Status:** `DONE` (2026-06-28)
- **Descripción:** `this.angle = Phaser.Math.Linear(this.angle, target, 0.18)` (`src/objects/Player.ts:87`) usa factor fijo por frame, sin escalar por `dt`. A 30fps el bank converge a la mitad de velocidad real que a 60fps.
- **Impacto:** El "feel" del giro cambia entre dispositivos; inconsistente con el resto (que sí usa `dt`).
- **Recomendación:** Escalar el factor por `dt` (interpolación exponencial independiente de FPS).

#### DR-09 — Corte de silueta hover(frontal)→move(lateral)
- **Severidad:** Bajo · **Categoría:** Transición · **Prioridad:** P2 · **Esfuerzo:** M · **Status:** `PENDING`
- **Descripción:** Pasar de idle frontal (0–5) a vuelo lateral (6–11) es un cambio de silueta en corte duro (Phaser no interpola frames).
- **Impacto:** Pequeño "snap" al empezar a moverse.
- **Recomendación:** Aceptable para hypercasual; si se quiere suavizar, el squash de DR-05 enmascara el corte.

#### DR-10 — Aparición brusca de `moveHard` a los 360 ms
- **Severidad:** Bajo · **Categoría:** Transición · **Prioridad:** P2 · **Esfuerzo:** XS · **Status:** `PENDING`
- **Descripción:** Al sostener una dirección > `effortHoldMs:360` se cambia a `moveHard` (líneas de velocidad + llama) de golpe.
- **Impacto:** Las estelas/llama aparecen "pop", sin escalado.
- **Recomendación:** Fade-in de las estelas o un frame intermedio. Menor.

#### DR-11 — Tilt sin overshoot/settle
- **Severidad:** Bajo · **Categoría:** Game Feel · **Prioridad:** P3 · **Esfuerzo:** XS · **Status:** `PENDING`
- **Descripción:** `tiltDegrees:9` con lerp lineal; no hay leve sobre-inclinación al iniciar ni asentamiento al frenar.
- **Impacto:** El bank se siente correcto pero "plano".
- **Recomendación:** Pequeño overshoot (p. ej. a 11° y asentar a 9°) con easing Back muy suave.

### C. Impacto / Daño / Invencibilidad

#### DR-12 — Sin pose de impacto propia (salta directo a dizzy)
- **Severidad:** Alto · **Categoría:** Animación · **Prioridad:** P1 · **Esfuerzo:** S · **Status:** `DONE` (2026-06-28)
- **Descripción:** En `loseLife` (`src/scenes/GameScene.ts:340`) hay shake + burst + popups, pero el cuerpo pasa directo a `dizzy`. No hay frame de "golpe" (la fila tiene `shout`=43 y caras de susto disponibles).
- **Impacto:** El golpe lo comunican los FX, no el actor; se siente desconectado.
- **Recomendación:** 1–2 frames de reacción (p. ej. 43 `shout`) antes de entrar en dizzy.

#### DR-13 — El propeller se congela 1.5 s en cada golpe
- **Severidad:** Crítico · **Categoría:** Animación / Game Feel · **Prioridad:** P0 · **Esfuerzo:** S (requiere capa de propeller) · **Status:** `BLOCKED` (requiere asset propio — 2026-06-28)
- **Descripción:** La pose `dizzy` hace `this.stop()` (`src/objects/Player.ts:105`) y fija el frame 36 durante `invincibleMs:1500` mientras parpadea. El propeller deja de girar. Es exactamente lo que el doc prohíbe ("si el propeler se detiene, el personaje parece muerto antes de morir").
- **Impacto:** Tras cada golpe (evento frecuente) el héroe parece muerto/colgado 1.5 s; es lo que más "amateur" se siente en juego.
- **Recomendación:** No detener la animación: mantener el loop del propeller bajo la cara de dizzy. Como `dizzy` es un único frame autorizado (no hay loop), lo correcto es una **capa de propeller separada** que nunca se detiene, o un mini-loop dizzy. No es un 1-liner por la falta de frames de dizzy.

#### DR-14 — Pérdida total de feedback direccional durante invencibilidad
- **Severidad:** Medio · **Categoría:** Legibilidad · **Prioridad:** P2 · **Esfuerzo:** S · **Status:** `PENDING`
- **Descripción:** Durante 1.5 s la pose se fuerza a `dizzy` (`src/scenes/GameScene.ts:211`) aunque el jugador sí se sigue moviendo (steer corre igual). El cuerpo no refleja la dirección.
- **Impacto:** Justo tras un golpe (momento de pánico) el jugador pierde la lectura de hacia dónde va.
- **Recomendación:** Permitir poses de movimiento durante invencibilidad (tintadas/parpadeando); reservar dizzy para los primeros ~300 ms.

#### DR-15 — Sin reacción de near miss en el personaje
- **Severidad:** Medio · **Categoría:** Game Feel · **Prioridad:** P2 · **Esfuerzo:** S · **Status:** `DONE` (2026-06-28)
- **Descripción:** El near miss da popup/partículas/flash (`src/scenes/GameScene.ts:300+`) pero el piloto no reacciona. La spec lo pide ("susto breve ~200 ms").
- **Impacto:** Se pierde el "wow" del casi-choque en el actor — el hook emocional del género.
- **Recomendación:** Flash de 1 frame de susto (43/41) o un micro-retroceso en X (~6px) y vuelta. Barato y muy rentable.

#### DR-16 — El blink de invencibilidad puede leerse como glitch
- **Severidad:** Bajo · **Categoría:** Legibilidad / FX · **Prioridad:** P2 · **Esfuerzo:** XS · **Status:** `PENDING`
- **Descripción:** Alpha alterna 0.35/1 cada `blinkMs:110` sobre un frame estático. Sin movimiento debajo, parece parpadeo/error más que invulnerabilidad.
- **Impacto:** Comunicación ambigua del estado "protegido".
- **Recomendación:** Combinar con DR-13 (animación viva) y/o usar un tint/halo en vez de alpha duro.

### D. Muerte / Desaparición / Game Over

#### DR-17 — La muerte es un único frame estático
- **Severidad:** Crítico · **Categoría:** Animación · **Prioridad:** P0 · **Esfuerzo:** S · **Status:** `DONE` (2026-06-28)
- **Descripción:** `DEATH: { frames:[42], frameRate:12, repeat:0 }` (`src/config/Constants.ts`): un solo frame. La spec pide 2 beats (bonk + salida en arco, ~400 ms).
- **Impacto:** El clímax del run (morir) no tiene animación; es lo opuesto a "satisfactorio/con peso".
- **Recomendación:** Construir un clip real con los frames ya existentes (42→43→45/46→47) + un tween de salida (ver DR-18). Es el mayor salto de calidad disponible.

#### DR-18 — Frames de knockout 43–47 autorizados pero sin usar
- **Severidad:** Alto · **Categoría:** Animación / Performance · **Prioridad:** P1 · **Esfuerzo:** S · **Status:** `DONE` (2026-06-28)
- **Descripción:** La fila 7 tiene bonk(42), shout(43), eyes-shut(44), roll(45), roll(46), head-down(47) — confirmado en el sheet y en el mapa de frames de `src/config/Constants.ts`. Solo se usa el 42.
- **Impacto:** Hay animación de muerte "gratis" (ya dibujada) desperdiciada.
- **Recomendación:** Usar 43–47 para la muerte de 2 beats. Máxima rentabilidad (no requiere arte nuevo).

#### DR-19 — La muerte en skins es idéntica a la pose de golpe
- **Severidad:** Alto · **Categoría:** Consistencia / Estado · **Prioridad:** P1 · **Esfuerzo:** S · **Status:** `DONE` (2026-06-28)
- **Descripción:** Las skins son 6×7 (sin fila 7), así que `death` cae a frame 36 (`dizzy`) — el mismo frame que el golpe. No hay distinción visual entre "me golpearon, sobrevivo" y "morí".
- **Impacto:** En la mayoría de skins, la muerte no se distingue del daño; lectura de estado rota.
- **Recomendación:** Para skins, usar al menos un frame distinto (p. ej. `sadHead` 41) + un tween de salida/caída compartido (sheet-agnóstico).

#### DR-20 — Sin FX de muerte / el propeller no se dobla
- **Severidad:** Alto · **Categoría:** FX / Game Feel · **Prioridad:** P1 · **Esfuerzo:** S · **Status:** `DONE` (2026-06-28)
- **Descripción:** En `finishGameOver` (`src/scenes/GameScene.ts:360`) hay shake, pero ninguna desaparición propia (sin fade, sin explosión, sin doblar el propeller que el doc menciona).
- **Impacto:** La muerte "se corta" en vez de resolverse; sin payoff visual.
- **Recomendación:** Tween de salida en arco + spin + fade del sprite (300–400 ms) y un burst (reusar el que ya existe).

#### DR-21 — Transición muerte→GameOver es corte de escena seco
- **Severidad:** Medio · **Categoría:** Transición · **Prioridad:** P2 · **Esfuerzo:** S · **Status:** `DONE` (2026-06-28)
- **Descripción:** Tras `delayedCall(420)` (`src/scenes/GameScene.ts:383`) hay `scene.start('GameOver')` sin fade.
- **Impacto:** Cambio abrupto que corta cualquier "beat" emocional de la muerte.
- **Recomendación:** Fade-out de cámara de ~150–200 ms antes del cambio (capa de transición reutilizable).

#### DR-22 — El beat de muerte (420 ms) es demasiado corto si se anima
- **Severidad:** Medio · **Categoría:** Timing · **Prioridad:** P2 · **Esfuerzo:** XS · **Status:** `DONE` (2026-06-28)
- **Descripción:** 420 ms apenas alcanzan para registrar el golpe; hoy "funciona" solo porque es un frame estático.
- **Impacto:** Al añadir la animación (DR-17), 420 ms cortarán la salida a la mitad.
- **Recomendación:** Subir a ~500–600 ms cuando exista el clip de 2 beats; sincronizar el cambio de escena al final del arco.

#### DR-23 — "-1 ♥" + sadHead también en el golpe fatal
- **Severidad:** Bajo · **Categoría:** Legibilidad · **Prioridad:** P2 · **Esfuerzo:** XS · **Status:** `DONE` (2026-06-28)
- **Descripción:** `loseLife` (`src/scenes/GameScene.ts:340`) muestra "-1 ♥" y `sadHead` antes de comprobar `lives<=0`; en el golpe mortal aparece igual, justo antes del Game Over.
- **Impacto:** Mensaje confuso (te dice que pierdes una vida y al instante mueres).
- **Recomendación:** Si es el golpe fatal, omitir el popup "-1 ♥" y saltar al beat de muerte.

#### DR-24 — `this.stop()` también detiene el propeller en muerte (skin) y combo
- **Severidad:** Medio · **Categoría:** Animación · **Prioridad:** P1 · **Esfuerzo:** S · **Status:** `BLOCKED` (requiere asset propio — 2026-06-28)
- **Descripción:** Hay tres `this.stop()` en `setPose` (`src/objects/Player.ts:105, 115, 121`): dizzy, death-skin y celebrate. Todos congelan el propeller.
- **Impacto:** Repite el problema de DR-13 en celebraciones y muertes de skin.
- **Recomendación:** Política única: nunca detener la animación en poses "vivas"; usar loops dedicados o capa de propeller.

### E. Spawn / Reinicio / Transiciones

#### DR-25 — Sin animación de spawn
- **Severidad:** Medio · **Categoría:** Animación / Game Feel · **Prioridad:** P2 · **Esfuerzo:** S · **Status:** `PENDING`
- **Descripción:** En `GameScene.create` (`src/scenes/GameScene.ts:86`) el `Player` aparece instantáneamente en su Y fija; igual el héroe del menú. Sin fade/scale/drop-in.
- **Impacto:** Entrada brusca; sin "arranque" que prepare al jugador (primera impresión de cada run).
- **Recomendación:** Drop-in corto desde arriba (~250 ms) o scale/fade-in de 150 ms con el propeller ya girando.

#### DR-26 — Reinicio sin transición (corte + pop-in)
- **Severidad:** Bajo · **Categoría:** Transición · **Prioridad:** P2 · **Esfuerzo:** S · **Status:** `PENDING`
- **Descripción:** RETRY/RESTART hacen `scene.start('Game')` directo; combinado con DR-25, el run nuevo "aparece de golpe".
- **Impacto:** El loop muerte→retry se siente entrecortado (clave porque es el bucle más repetido).
- **Recomendación:** Fade-in corto + spawn animado (DR-25).

#### DR-27 — Todas las transiciones de pose son cortes duros
- **Severidad:** Bajo · **Categoría:** Transición · **Prioridad:** P3 · **Esfuerzo:** M · **Status:** `PENDING`
- **Descripción:** Cada `setPose` cambia la animación al instante (Phaser no interpola). Las frontal↔lateral (DR-09) son las que más se notan.
- **Impacto:** Sensación general algo "saltada" entre estados.
- **Recomendación:** No perseguir blending real (caro); enmascarar con squash (DR-05) y mantener siluetas compatibles. Aceptar el resto.

### F. Celebración / Combo / Boost

#### DR-28 — Cheer es un loop de 2 frames (puede "vibrar")
- **Severidad:** Bajo · **Categoría:** Animación · **Prioridad:** P2 · **Esfuerzo:** XS · **Status:** `PENDING`
- **Descripción:** `CHEER: { frames:[24,25], frameRate:8 }`: ciclo de 250 ms (4 Hz) entre 2 poses; hay 4 frames de cheer más (26–29) sin usar. El código eligió 24/25 deliberadamente (propeller en movimiento + brazos arriba), así que extender requiere verificar que 26–29 loopean limpio.
- **Impacto:** El festejo puede leerse como tembleque en vez de animación fluida.
- **Recomendación:** Verificar 26–29; si loopean, extender a 4 frames; si no, bajar a 6fps. Solo config.

#### DR-29 — Pose de combo estática 850 ms con propeller detenido
- **Severidad:** Bajo · **Categoría:** Animación · **Prioridad:** P2 · **Esfuerzo:** XS · **Status:** `DONE` (2026-06-28, parcial: timing 850→550 ms; falta el loop de propeller, ver DR-24)
- **Descripción:** `celebrate` hace `stop()`+`setFrame` y se sostiene `celebrateMs:850`.
- **Impacto:** Congelamiento visible cuando se ve (al planear); 850 ms es largo para un flash.
- **Recomendación:** Mantener el loop del propeller debajo del badge (ver DR-24) y reducir a ~500 ms (recorte del 40% sin perder lectura).

#### DR-30 — La celebración de combo casi nunca se ve en juego activo
- **Severidad:** Cosmético · **Categoría:** Game Feel · **Prioridad:** P3 · **Esfuerzo:** S · **Status:** `PENDING`
- **Descripción:** `steering` pisa la celebración por diseño (`src/scenes/GameScene.ts:205`); mientras esquivas (lo normal en combos altos) nunca aparece.
- **Impacto:** El frame de combo del personaje es trabajo casi siempre invisible.
- **Recomendación:** Aceptable (decisión consciente), pero considerar un micro-overlay/glow sobre el sprite que conviva con el steering.

#### DR-31 — Durante el boost dorado (5 s) se pierde el lean/effort
- **Severidad:** Bajo · **Categoría:** Game Feel · **Prioridad:** P3 · **Esfuerzo:** XS · **Status:** `PENDING`
- **Descripción:** Prioridad de pose: boost > steering (`src/scenes/GameScene.ts:207`); durante 5 s el cuerpo no refleja el movimiento lateral.
- **Impacto:** Pérdida de feedback de control durante un tramo largo y frecuente.
- **Recomendación:** Permitir que el tilt/squash (cosméticos) sigan activos sobre la pose boost.

#### DR-32 — Squash/stretch del GameOver con origin 0.5
- **Severidad:** Cosmético · **Categoría:** Animación · **Prioridad:** P3 · **Esfuerzo:** XS · **Status:** `PENDING`
- **Descripción:** El héroe de récord estira `scaleY:1.2` con origin centrado (`src/scenes/GameOverScene.ts:73`); estira desde el centro, no desde los pies.
- **Impacto:** El "rebote" lee algo menos natural (crece en ambos sentidos).
- **Recomendación:** Anclar origin abajo (o compensar Y) para que estire hacia arriba.

#### DR-33 — Frame 30 (combo x1 / pulgar) autorizado pero sin usar
- **Severidad:** Cosmético · **Categoría:** Performance / Limpieza · **Prioridad:** P3 · **Esfuerzo:** XS · **Status:** `PENDING`
- **Descripción:** `COMBO_TIERS` usa 31–35; el 30 no se referencia.
- **Impacto:** Frame muerto (limpieza/uso potencial).
- **Recomendación:** Usarlo como primer escalón de combo, o documentarlo como reserva.

### G. Performance / FPS

#### DR-34 — A <30fps el juego entra en cámara lenta
- **Severidad:** Bajo · **Categoría:** Performance / Timing · **Prioridad:** P2 · **Esfuerzo:** S · **Status:** `PENDING`
- **Descripción:** `dt = Math.min(delta, 1000/30)` (`src/scenes/GameScene.ts:165`) clampa el delta; por debajo de 30fps el tiempo de juego (y toda animación basada en dt) se ralentiza en vez de mantener tiempo real.
- **Impacto:** En dispositivos lentos las animaciones se arrastran (afecta el "feel" percibido), aunque protege de saltos grandes.
- **Recomendación:** Está bien como salvaguarda; combinarlo con DR-08 (easing por dt) para que al menos el bank no sume su propia dependencia de FPS.

---

## 5. Quick Wins (< 1 h, máximo aumento de calidad percibida)

Ordenados por relación impacto/esfuerzo:

1. **DR-13 / DR-24 — No detener el propeller** en poses "vivas" (requiere capa de propeller o mini-loop; no es 1-liner pero es el de mayor impacto).
2. **DR-17 + DR-18 — Muerte real de 2 beats** con los frames 42→43→45/46→47 ya dibujados + tween de salida.
3. **DR-06 — `faceFlipDelayMs` a ~100 ms** (elimina el strobe del espejo). 1 valor.
4. **DR-05 — Squash & stretch lateral** (~6 líneas en `steer`; transforma el feel del movimiento; no afecta colisión).
5. **DR-08 — Tilt independiente de FPS** (corrección de correctitud).
6. **DR-29 — Combo celebrate a ~500 ms** (recorte del 40%). 1 valor.
7. **DR-03 — Subir `bobAmp`** a ~7–8 (idle más vivo). 1 valor.
8. **DR-23 — Omitir "-1 ♥" en el golpe fatal** (un `if`). XS.
9. **DR-04 — Unificar bob menú vs gameplay.** XS.
10. **DR-28 — Cheer a 4 frames o 6fps** (quita el "buzz"). Config.

---

## 6. Recomendaciones generales (dirección, sin sumar complejidad)

1. **"El cuerpo cuenta su estado, no los popups."** Hoy las partículas, el shake y los textos hacen casi todo el trabajo emocional, y el personaje se queda quieto justo en golpe, muerte y combo. Trasladar parte de ese feedback al cuerpo (squash, micro-retroceso, salida animada) sube el polish sin tocar gameplay.
2. **Hacer "el propeller siempre gira" un invariante de código, no una buena intención.** Está en el doc pero el código lo rompe en 3 sitios. Lo robusto: separar el propeller en su propia capa/loop que nunca se detiene salvo en el frame exacto de impacto (donde se dobla).
3. **Gastar el arte que ya existe antes de pedir más.** Hay ~7 frames autorizados sin uso (26–30 y 43–47), incluida toda la secuencia de muerte. Es animación "gratis": cero costo de producción, cero riesgo de estilo.
4. **Una sola "personalidad" de timing.** Todo movimiento/easing por `dt` (eliminar dependencias de FPS como DR-08) y una curva común (cuadrática/Back suave) para lean, hop, spawn y salida de muerte.
5. **Una capa de transición de escena reutilizable** (fade 150–200 ms) para muerte→GameOver→retry. Elimina los cortes secos del bucle más repetido con un solo helper.
6. **Vincular 1–2 parámetros del personaje a la velocidad** (frameRate del propeller y/o amplitud del bob). Un único mapeo `speed → valor` da la curva de aceleración que hoy falta, sin assets nuevos.
7. **Reducir donde sobra.** El combo celebrate (850 ms) puede bajar a ~500 ms; la invencibilidad puede *verse* más corta si se anima en vez de congelarse. Menos tiempo congelado = más percepción de fluidez.
8. **Mantener el alcance acotado a 5 estados que importan:** idle/caída, move, hit, death, victory. No añadir estados nuevos; pulir estos cinco es donde está todo el retorno.

---

## 7. Log de progreso / cambios aplicados

| Fecha | Items | Sesión | Notas |
|---|---|---|---|
| 2026-06-28 | DR-03, DR-04, DR-05, DR-06, DR-08, DR-23, DR-29 | QA Session | Quick wins de bajo riesgo. **Player.ts:** squash & stretch lateral (1.05/0.97, cosmético, no afecta hitbox) + tilt y squash con easing FPS-independiente. **Constants.ts:** `faceFlipDelayMs` 0→90, `bobAmp` 4→7, `celebrateMs` 850→550. **GameScene.ts:** se omite el popup "-1 ♥"/sadHead en el golpe fatal (DR-23). **MainMenuScene.ts:** bob del héroe alineado a ~14px (DR-04). Validación: `tsc --noEmit` OK; `PlayerFacing` y `ComboManager` tests OK; los 3 fallos de `Skins.test.ts` son **preexistentes** (verificado con `git stash`) y ajenos a animación. |
| 2026-06-28 | DR-17, DR-18, DR-19, DR-20, DR-22 | QA Session | Overhaul de muerte. **Constants.ts:** `DEATH` ahora usa los 6 frames 42→47 (bonk→shout→eyes→roll→roll→head-down) @10fps. **Player.ts:** nuevo `playDeath()` con fly-out (giro 540°, caída, escala 0.55, fade) sheet-agnóstico; skins caen a `sadHead` (41) en vez de `dizzy` (36). **GameScene.ts:** `finishGameOver` llama `playDeath()` + flash de impacto, beat 420→600ms. Validación: `tsc --noEmit` OK; test de límite de frames de muerte OK; fallos de `Skins.test.ts` siguen siendo preexistentes (tint). |
| 2026-06-28 | DR-21 | QA Session | Transición muerte→GameOver con fade. **GameScene.ts:** `cameras.fadeOut(200)` a los 400ms antes de `scene.start`. **GameOverScene.ts:** `cameras.fadeIn(180)` al crear. Validación: `tsc --noEmit` OK. |
| 2026-06-28 | DR-01, DR-02 | QA Session | Sensación de caída. **Player.ts:** `aliveTick(dt, intensity)` — bob ×(1+0.6) y propeller `timeScale` ×(1+0.5) según velocidad; `playDeath` resetea timeScale. **GameScene.ts:** `fallIntensity` 0..1 por velocidad + estelas de viento sutiles al cruzar 0.6. Validación: `tsc --noEmit` OK. |
| 2026-06-28 | DR-13, DR-24 | QA Session | **BLOCKED:** sin asset de propeller separado (la hélice está pintada en cada frame), una capa que siga viva requiere arte propio. Se posponen hasta tener el sprite. |
| 2026-06-28 | DR-12, DR-15 | QA Session | Pose de impacto/susto. **Player.ts:** nueva pose `impact` (frame 43 `shout`, fallback `sadHead` 41 en skins). **GameScene.ts:** recoil ~180ms al sobrevivir un golpe + startle 160ms en near-miss antes de dizzy. **PlayerFacing(.test).ts:** `impact` agregado. Validación: `tsc --noEmit` OK; `PlayerFacing` (6) OK. |
</content>
</invoke>
