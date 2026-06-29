# Dodge Rush — Backlog Colaborativo

> **Propietario:** PM Session (`Product Owner`)
> **Actualizado por última vez:** 2026-06-29
> **Audiencia:** TODOS los chats del proyecto. Lean antes de empezar a trabajar. Reporten progreso aquí.

---

## Cómo usar este archivo

Este backlog es el **único punto de verdad** compartido entre todos los chats del proyecto.

### Protocolo para cada chat

1. **Al empezar trabajo** → cambiar el status del item de `PENDING` a `IN PROGRESS` y poner tu nombre de sesión en `Sesión`.
2. **Al terminar** → cambiar a `DONE` y dejar una línea de notas en la sección **Log de Progreso**.
3. **Si encontrás un bug** → agregarlo a la sección **Bugs Conocidos**.
4. **Si detectás un requerimiento faltante** → agregarlo a **Requerimientos Faltantes Detectados**.
5. **Si tomás una decisión de diseño importante** → registrarla en **Decisiones Pendientes o Tomadas**.
6. **Nunca borrar items completados** — cambiarlos a `DONE` con la fecha.

### Leyenda de status

| Status | Significado |
|---|---|
| `PENDING` | No iniciado |
| `IN PROGRESS` | Alguien lo está haciendo ahora |
| `DONE` | Completado y verificado |
| `BLOCKED` | Esperando algo externo |
| `SKIP` | Descartado con justificación |

### Prioridades

- `P0` — Bloqueante de lanzamiento. Sin esto no se puede publicar.
- `P1` — Alta. Sin esto el producto está incompleto.
- `P2` — Media. Mejora importante pero no bloquea.
- `P3` — Baja. Nice-to-have, puede ir post-launch.

---

## 🎯 VISIÓN MVP — Decisión del Product Owner (2026-06-29)

**El MVP es: lanzar Dodge Rush en Google Play (Android) SIN ads y SIN IAP, validar retención, y recién en V1.1 prender monetización.**

Decisión 2026-06-29: V1.0 sale ads-free e IAP-free. Esto saca AdMob + COPPA + parental gate + CMP de la ruta crítica (eran el mayor bloqueante). Sin retención, los ads valen $0; primero se valida D1R/D7R en soft launch, después se prende `MONETIZATION` (flag ya existe en `FeatureFlags.ts`).

No es MVP: ads/IAP, iOS, nuevos tipos de obstáculos, nuevos skins, achievements, pantalla de perfil, analytics, haptics. Todo eso es post-launch.

### 🔒 BACKLOG PRE-STORE — SOLO 3 PUNTOS (nada más bloquea)

Antes de salir al store el trabajo de producto/polish es exactamente esto:

1. **Character — revertir a la versión anterior más simple que se veía bien** (SKN-007). 🔁 REABIERTO (no se ve del todo bien aún)
2. **Mecánica riesgo↔recompensa: obstáculos con dos gaps (fácil vs difícil), el difícil paga más** (GME-017). ✅ DONE
3. **Fondo visible en device físico — que se vean estrellas/skyboxes** (BG-005/BUG-008). 🔴 Único pendiente — necesita logcat de device.

Todo lo demás (ads, IAP, achievements, iOS, nuevos obstáculos/skins) es post-launch. La logística de release (firmar, subir, screenshots) NO es "backlog" — es checklist de ops, abajo.

### Decisiones tomadas por el PO

| ID | Decisión | Resolución |
|---|---|---|
| `DEC-001` | Nombre oficial | ✅ **"Dodge Rush"** — El GDD es el único archivo con "Fallcade". Costo de alinear el GDD es mínimo vs. renombrar todo el repo. BRN-002 + DOC-001 deben ejecutarse. |
| `DEC-003` | iOS | ✅ **Diferir post-launch Android** — Toda la épica iOS pasa a P3. Foco total en Google Play primero. |
| `DEC-004` | Dog sprite | ✅ **Post-MVP** — 12 skins es más que suficiente para lanzar. Si Dog sprite está listo, se incluye; si no, no bloquea nada. |
| `DEC-005` | Fuentes offline | ✅ **Aceptar riesgo por ahora** — Fallback a monospace ya existe en el código. Resolver post-launch si hay reportes. |
| `DEC-006` | Simplificación del core loop (vidas, continue, double coins, combo) | ✅ **REVISADO 2026-06-26** — Versión final aprobada por PO + Game Designer: (1) **3 vidas — MANTENER** (kindness mechanic para kids, sessions 5-10min ≠ Flappy Bird); (2) **ContinueScene — REMOVER** (prohibida explícitamente en `monetization.md`, corrompe score); (3) **Double Coins en game over — REMOVER** (no está en el GDD, corrompe coins por habilidad); (4) **Único rewarded ad → ruleta post-run** (modelo original GDD, Crossy Road style); (5) **Combo — pendiente discusión sobre x1000** (diferido). Ver tickets GME-009 ~~cancelado~~, GME-010, GME-012. |
| `DEC-007` | Scoring fairness Relax vs Classic | ✅ **Opción B — Separar high score por modo (2026-06-27).** `bestClassic` y `bestRelax` como campos independientes en ProfileManager. HUD y GameOverScene leen el récord del modo activo. Razón: Relax y Classic son experiencias distintas; un penalizador haría sentir castigado al jugador que elige el modo más fácil (viola principio 5 del GDD). Ver GME-012 para implementación. |

### Ruta crítica al lanzamiento (en orden)

Primero los 3 puntos de producto, después el release ops (puro trámite, no construir features):

```
PRODUCTO (los 3 únicos blockers):
1. [SKN-007] Revertir character a la versión anterior simple que se veía bien
2. [GME-017] Mecánica riesgo↔recompensa (gap chico/lejos = más puntos)
3. [BG-005]  Fondo visible en device físico (estrellas/skyboxes)

RELEASE OPS (trámite, sin desarrollo de producto):
4. [AND-002]              Keystore de producción (firma)
5. [QA-003/005/007]       Smoke en device físico + offline + perfil persiste
6. [AND-003]              Google Play Console (ficha, age rating, policy)
7. [ASO-003]              Screenshots de store
8. [AND-005→006]          Internal Testing → Open Testing → Production
```

**Backlog de producto pre-store (P0):** SKN-007, GME-017, BG-005. **Nada más.**

**Todo lo demás:** P2/P3 post-launch. Ads (MON-*), IAP, COPPA/parental gate y CMP → diferidos a V1.1 por la decisión ads-free.

---

## Estado General del Proyecto

| Fase | Descripción | Estado |
|---|---|---|
| **Fase 1** | Adicción + polish web (retención, game feel) | ✅ DONE |
| **Fase 2** | Port React Native / Expo + APK offline Android | ✅ DONE |
| **Fase 3** | Google Play publish (closed → open → prod) | 🔴 PENDING |
| **Fase 4** | Monetización real (AdMob rewarded + IAP) | 🔴 PENDING |
| **Fase 5** | Iteración sobre métricas | 🔴 PENDING |

---

## 🚨 ÉPICA 0 — Decisiones de Diseño Urgentes (resolver ANTES de implementar)

> Estos tickets no son de implementación. Son discusiones que el **Product Owner** y el **Mobile Game Design Expert** deben resolver urgentemente porque sus respuestas cambian qué hay que construir o remover.

| ID | Ticket | Prioridad | Status | Responsables |
|---|---|---|---|---|
| `DIS-001` | **Revisar y decidir sobre simplificación del core loop** — RESUELTO. Decisión: versión simplificada completa. Ver DEC-006 y tickets GME-009/010/011. | ~~P0 URGENTE~~ | ✅ DONE | Product Owner |
| `DIS-002` | **MVP Minimal vs Feature-Rich (2026-06-27).** ✅ **APROBADO PO.** Propuesta: apagar 5 features para V1.0 (shop, monedas, misiones, combo-labels, relax-mode) → mantener SOLO core loop (tap, dodge, combo, best). Razón: D1R en kids — reduce cognitive load, aumenta focus en replayability. Todas las features quedan en código, se reactivan en V1.1 con feature flags. **Implementation brief:** `docs/archive/implementation-brief.md` — 9 pasos claros, commit-ready para otro LLM. Ver análisis en `docs/archive/mvp-minimal-proposal.md`. **[Impl 2026-06-27]** Implementado vía `src/config/FeatureFlags.ts` (5 flags OFF: SHOP/DAILY/COMBO_LABELS/MONETIZATION/RELAX_MODE). UI gated en MainMenu/GameOver/HUD; lógica gated en DifficultyManager/DailyManager/GameScene. Reversible en V1.1 flipeando 5 booleanos. Verificado: `tsc` + `vite build` limpios; unit 86/89 (3 rojos = BUG-010 ajeno); E2E 28 pass / 4 skip (flag-aware) / 6 pre-existentes. Screenshots confirman MainMenu solo PLAY+HOW?, GameOver solo SCORE/BEST/RETRY/MENU. | **P0 URGENTE** | ✅ DONE (2026-06-27) | Dodge Rush Dev (LLM Agent) |

---

## ÉPICA 1 — Nombre y Branding del Juego

| ID | Item | Prioridad | Status | Sesión |
|---|---|---|---|---|
| `BRN-001` | Resolver naming definitivo: "Dodge Rush" vs "Fallcade" | P0 | ✅ DONE (2026-06-27) | Product Owner |
| `BRN-002` | Actualizar GDD (`docs/gdd.md`) reemplazando "Fallcade" por "Dodge Rush" (3 ocurrencias) + actualizar `docs/` donde corresponda | P0 | DONE (2026-06-27) | Dodge Rush Dev |
| `BRN-003` | Verificar disponibilidad del nombre en Play Store y App Store | P0 | PENDING | — |
| `BRN-004` | Crear icon final (512×512, adaptive icon, splash screen) | P0 | ✅ DONE (2026-06-27) | Character Design |

---

## ÉPICA 2 — Arte: Personajes y Skins

Estado actual: **12 skins en el catálogo + 5 achievement skins (palette-swaps)**. Todos los sheets existen en `/public/assets/`.

| ID | Item | Prioridad | Status | Sesión |
|---|---|---|---|---|
| `SKN-001` | Revisar calidad final de `character_hound.png` (sesión Dog character) | **P2** *(no bloquea MVP)* | **DONE** *(ver QA SKN-001 abajo)* | Dog character sprite |
| `SKN-002` | Verificar que todos los sheets tengan frames correctos para todas las poses (idle, move, boost, celebrate, dizzy, sad, trophy, crown) | P1 | DONE | QA Tech Lead |
| `SKN-003` | Side-by-side diff contact sheet de todos los skins vs. original (per `docs/skin-process.md`) | **P3** *(post-MVP)* | PENDING | Character Design |
| `SKN-004` | Agregar skin DOG como nuevo personaje (separado de Hound) si la sesión lo decidió así | **P3** *(post-MVP — DEC-004)* | PENDING | Dog character sprite |
| `SKN-005` | Validar que el achievement skin GOLD no se confunde visualmente con el GOLD KING (mismo tint) | **P3** *(post-MVP)* | PENDING | — |
| `SKN-006` | Revisar que `pilot_kit.py` genere output consistente en todas las plataformas (Python versión) | P3 | PENDING | — |
| `SKN-007` | **[PRE-STORE #1] Revertir el character a la versión anterior más simple que se veía bien.** El sprite Tier-3 actual "lee más cargado"; volver al look previo más limpio. Recuperar el sheet/commit anterior (`git log -- public/assets/character.png`), reemplazar el actual y validar facing (`PlayerFacing.ts`) + las 12 poses. | **P0** *(pre-store)* | **REABIERTO** (2026-06-29) — el look limpio se commiteó (`64edfa8`) pero "todavía no se ve del todo bien"; falta otra pasada de arte. | SKN-007 character sprite adjustment |

### QA SKN-001 — `character_hound.png` (sesión Dog character, 2026-06-27) → **APROBADO con notas menores**

Generado vía Tier-3 procedural: `scripts/build-hound.py` (kit compartido `pilot_kit.py`). Perrito viejito tipo sabueso (orejas largas caídas, hocico canoso + nariz, cejas grises, colita peluda con punta blanca).

**Invariantes medibles del house-style (todas ✓):**
- Formato **720×840** (grid 6×7 @ 120px) — idéntico a los demás sheets. ✓
- **37 colores opacos** (rango de la casa: cat=39, dragon=36, target ≈40). ✓
- Outline oscuro unificado presente (`finish()` lo aplica). ✓
- Proporciones chibi: cabeza grande, cuerpo robusto, miembros cortos/redondos. ✓
- DNA propeller-pilot completo: hélice, capucha de aviador (caramelo), gogles sobre los ojos (no segundo par de ojos), pods teal laterales, traje acolchado con ribete teal, botas-cohete. ✓
- Las 42 celdas tienen contenido (3–4k px opacos c/u); **ningún frame vacío/roto**. ✓
- Specials correctos: frame 38 = perro sosteniendo trofeo, frame 39 = perro con corona. ✓ Filas completas: hover/move/move_hard/boost/cheer/combo/specials(dizzy,sadcloud,trophy,crown,star,sad).

**Notas menores (no bloqueantes, polish opcional):**
1. Tier-3 → lee "un punto más simple" que los originales AI-painted (caveat conocido en `docs/skin-process.md`). Cara algo cargada: el hocico gris grande + cejas + gogles aprietan un poco los ojos vs. los ojos bien abiertos de los originales. Para fidelidad máxima, regenerar vía Tier-2 (prompt en skin-process.md) con perfil "old hound".
2. El **blush** queda casi tapado por el hocico canoso (el house-style lo quiere visible). Fix barato: reducir el hocico ~1px o subir el blush.

**Estado de integración (gobernado por DEC-004 — Dog post-MVP):** queda **asset-only**, decidido en esta sesión. El sheet se carga en `PreloadScene.ts` como *parked asset* (misma convención que `dragon`/`ghost`/`king`/`frost`: se cargan pero NO están en `SKINS`), por lo que **NO es seleccionable en la tienda**. Existe `scripts/build-hound.py` para regenerarlo. Para activarlo cuando el PO lo apruebe (DEC-004): agregar una entrada a `SKINS` en `src/config/Skins.ts` con su `tier`/`cost`. *(Nota: una entrada en el catálogo agregada antes en esta sesión fue eliminada por la refactorización de `Skins.ts` a tiers; el estado final asset-only es el correcto.)*

---

## ÉPICA 3 — Arte: Obstáculos

Obstáculos actuales en código: Straight, Wide, Narrow, Moving, Danger, Broken, Glowing, Golden (8 tipos).

| ID | Item | Prioridad | Status | Sesión |
|---|---|---|---|---|
| `OBS-001` | Definir y documentar nuevos patrones/tipos de obstáculos propuestos | **P3** *(post-MVP)* | PENDING | Obstacle Design |
| `OBS-002` | Implementar nuevos tipos de obstáculos en `ObstacleTypes.ts` | **P3** *(post-MVP)* | PENDING | Obstacle Design |
| `OBS-003` | Actualizar `obstacles.png` atlas si hay nuevos tiles | **P3** *(post-MVP)* | PENDING | Obstacle Design |
| `OBS-004` | Validar que nuevos obstáculos respetan principio 3 del GDD: "la muerte siempre es culpa del jugador" (reacción legible) | **P3** *(post-MVP)* | PENDING | QA Tech Lead |
| `OBS-005` | Balance de spawn weights con nuevos tipos (no saturar niveles tempranos) | **P3** *(post-MVP)* | PENDING | Obstacle Design |
| `OBS-006` | [DONE 2026-06-26] Auditoría y polish de los 8 tipos existentes (sprites, animación, diferenciación visual) | P2 | DONE | Obstacle Design |
| `OBS-007` | **Feature flag para el glow de los bordes de los obstáculos + veredicto A/B.** (1) Agregar `OBSTACLE_GLOW_ENABLED` a `src/config/FeatureFlags.ts` (default `true`). (2) Gatear con ese flag el render del glow en `Barrier.ts` — los halos de los gap markers (`GapMarker.glow`, blend ADD) y el pulse de obstáculos `glowing`/`danger`/`golden` (`showGlow`/`Wall.glow`): si el flag está OFF, no crear/ocultar esas capas (los posts de gap y el fill del obstáculo siguen visibles para no perder legibilidad). (3) **Evaluar con y sin glow** capturando ambos estados en las 6 zonas (day/dusk/sunset/twilight/night/aurora) y sobre los 3 tipos que hoy lo usan. (4) **Dar un veredicto** de cuál se ve mejor. **Comparación a hacer (criterios):** (a) legibilidad del gap seguro a velocidad alta, (b) diferenciación entre tipos (glowing/danger/golden) sin el glow, (c) contraste contra fondos claros (día/aurora) vs oscuros (noche), (d) ruido visual / fatiga en runs largos, (e) consistencia con el look limpio del character revertido (SKN-007), (f) rendimiento en device (capas ADD extra). Entregar: screenshots lado a lado por zona + recomendación final (ON / OFF / ON-solo-para-danger) con justificación. | P2 | PENDING | — |

---

## ÉPICA 4 — Arte: Backgrounds

Background actual: "Sky City" con 6 zonas (day/dusk/sunset/twilight/night/aurora) + 5 capas de parallax.

| ID | Item | Prioridad | Status | Sesión |
|---|---|---|---|---|
| `BG-001` | Definir y comunicar qué cambios están en progreso en la sesión Background Image Design | P1 | IN PROGRESS | Background Image Design |
| `BG-002` | Si se agregan nuevas zonas: actualizar `Constants.ts` y `Background.ts` con zone config | P1 | PENDING | — |
| `BG-003` | Verificar fondo en device (APK): cross-dissolve entre zonas + **skyboxes visibles (BG-005/BUG-008)**. Checklist paso a paso en `QA-MANUAL-CHECKLIST.md` → sección "Fondo Sky City" (BG-01..BG-07), incluye cómo capturar la línea `bg-audit` del logcat (evidencia decisiva) | P1 | PENDING | QA Tech Lead |
| `BG-004` | Asegurar que layers nuevos siguen la guía de parallax speeds existentes | P2 | PENDING | Background Image Design |
| `BG-005` | **[PRE-STORE #3 / BUG-004/BUG-008]** Investigar y corregir skyboxes (`bg_sky_*.png`) invisibles en device Android físico — nubes y naves se ven, solo las skyboxes fallan. **REABIERTO (2026-06-27):** el fix del grade (Rectangle→Image) SÍ llegó al APK pero el bug persiste → el grade NO era la causa. Re-diagnóstico en curso: instrumentación (audit a logcat) + self-heal enviados al bundle; falta evidencia de device (screenshot + logcat) para confirmar decode-failure vs GPU-render. Ver Log de Progreso 2026-06-27. | **P0** *(pre-store)* | IN PROGRESS | Background Image Design |

---

## ÉPICA 5 — Audio

Estado actual: `bgmusic.mp3/.ogg` y `menu.mp3/.ogg` funcionando. SFX es Web Audio procedural (sin archivos). Bug de música en Android: RESUELTO (HTML5 Audio con `<audio>` elements).

| ID | Item | Prioridad | Status | Sesión |
|---|---|---|---|---|
| `SND-001` | Documentar qué SFX adicionales están planeados (sesión Sound Effects & Music) | P1 | DONE (2026-06-27) — 9 SFX nuevos, todos procedurales; ver bitácora | Sound Effects & Music |
| `SND-002` | Si se agregan archivos de SFX: asegurar que `SoundManager.ts` los carga y `sync-web.mjs` los incluye | P1 | N/A (2026-06-27) — no se agregaron archivos; todos los SFX nuevos son procedurales (Web Audio, sin assets) → nada que cargar ni sincronizar. Música existente intacta. Nota: `sync-web.mjs` no existe en este árbol | Sound Effects & Music |
| `SND-003` | Implementar haptics via `navigator.vibrate` (listado como follow-up en roadmap) | **P3** *(post-MVP)* | PENDING | — |
| `SND-004` | Reemplazar Google Fonts CDN con fuentes bundleadas offline (evitar dependency de red en el APK) | **P3** *(post-MVP — DEC-005)* | PENDING | — |
| `SND-005` | Verificar que el loop seam del music change (HTML5 Audio vs. buffer crossfade) es aceptable en device | P2 | PENDING | QA Tech Lead |

---

## ÉPICA 6 — Gameplay y Game Feel

| ID | Item | Prioridad | Status | Sesión |
|---|---|---|---|---|
| `GME-001` | Validar que dificultad Classic y Relax están bien balanceadas (curva de 30s steps) | P1 | DONE | QA Tech Lead |
| `GME-002` | Verificar daily missions y login streak en builds fresh (nuevo device, sin localStorage) | P1 | PENDING | QA Tech Lead |
| `GME-003` | ~~Testear ContinueScene: el timer de 6s auto-declina correctamente + revisar legibilidad para kids~~ — **SKIP**: ContinueScene removida (GME-010 DONE). Feature inexistente, test no aplica. | ~~P1~~ | SKIP | QA Tech Lead (2026-06-27) |
| `GME-004` | Verificar combo reset en pérdida de vida | P2 | DONE | QA Tech Lead |
| `GME-005` | Probar la ruleta de skins (spin) fluye correctamente — free spin primera run, ad-spin runs subsiguientes, consolation coins cuando todo está desbloqueado | P1 | DONE (2026-06-27) | QA Tech Lead |
| `GME-006` | Testear ShopScene: comprar, equipar, desequipar skins | P1 | DONE (2026-06-27) | QA Tech Lead |
| `GME-007` | **Onboarding first-run:** mostrar hint de tap ← → en el primer run (fade-out en primer input). Sin tutorial explícito. Implementar en `GameScene.create()` usando `Profile.totalRuns === 0` como gate. Ver análisis en REQUERIMIENTOS FALTANTES (REQ-007). | **P1** | DONE (2026-06-26) | Mobile Game Designer |
| `GME-009` | ~~**[CANCELADO — DEC-006 revisado]** Simplificar a 1 vida. Game Designer confirmó: mantener 3 vidas como kindness mechanic para sessions largas (5-10 min). Ver DEC-006.~~ | ~~P0~~ | SKIP | — |
| `GME-010` | **[DEC-006] Eliminar ContinueScene completamente.** Al agotar 3 vidas → ir directo a `GameOverScene`, sin pantalla intermedia ni ad. Pasos: (1) borrar `src/scenes/ContinueScene.ts`; (2) remover su registro en `GameConfig.ts`; (3) remover el trigger post-muerte en `GameScene.ts`; (4) verificar flujo limpio muerte → GameOver. | **P0** *(MVP — DEC-006)* | DONE (2026-06-26) | Dodge Rush Dev |
| `GME-011` | **[DIFERIDO — pendiente discusión combo x1000]** No implementar hasta resolver con PO + Game Designer. | — | BLOCKED | Product Owner |
| `GME-014` | **[DEC-006] Remover Double Coins de GameOverScene y dejar un solo placement rewarded: la ruleta post-run.** Pasos: (1) `src/scenes/GameOverScene.ts` — eliminar botón "DOUBLE COINS" y su lógica; (2) `src/systems/Rewarded.ts` — remover placement `'double_coins'`, conservar solo el de la ruleta/spin; (3) verificar que `GameOverScene` queda sin referencias a rewarded. La ruleta post-run es el único ad del juego. | **P0** *(MVP — DEC-006)* | DONE (2026-06-26) | Dodge Rush Dev |
| `GME-008` | **Remover smash-power (romper obstáculos)** — el GDD (`core-loop.md`) documenta la decisión de descartarla (viola principio 2: "un solo tipo de input"), pero el código aún la tiene. Eliminar: meter de cooldown en `HUD.ts`, lógica de smash en `GameScene.ts`, y detección de doble-tap en `InputController.ts`. Verificar que no queden referencias muertas. | **P0** *(MVP — funcionalidad confusa que no debe llegar a producción)* | DONE (2026-06-26) | Dodge Rush Dev |
| `GME-015` | **[DEC-007] Vidas por modo + cambio de default.** Tres cambios en un ticket: (1) `Constants.ts` — `DEFAULT_DIFFICULTY: 'relax'` (una línea); (2) lógica de vidas en `GameScene.ts` — si `difficulty === 'classic'` → 1 vida, si `difficulty === 'relax'` → 3 vidas; (3) `HUD.ts` — mostrar iconos de vida solo en Relax (en Classic no hay iconos, el juego es one-hit). Verificar que el selector de dificultad en `MainMenuScene` refleja el nuevo default visual. **[Impl 2026-06-27]** (1) `DEFAULT_DIFFICULTY: 'relax'`. (2) Vidas por modo via CONFIG (GameScene ya lee `mode.lives`, sin condicionales nuevos): `classic.lives = 1` (one-hit — `loseLife()` va directo a game over sin invencibilidad porque lives llega a 0), `relax.lives = 3`. (3) `HUD.setLives` oculta los corazones cuando `max <= 1`. MainMenu ya lee `DifficultyManager.mode` → muestra Relax por el nuevo default. **Nota:** DEC-007 dice "Relax = 3 vidas" pero el ticket decía "(comportamiento actual)"; el actual era **5**, no 3 → seguí la decisión formal (3) y actualicé el test de QA que tenía `toBe(5)` hardcoded (ahora deriva de config). Si el PO quería mantener 5, es 1 línea. `tsc` OK; `ScoreManager`/`DifficultyManager` tests verdes; `vite build` OK. | **P0** *(MVP — DEC-007)* | DONE (2026-06-27) | Dodge Rush Dev |
| `GME-012` | **Fairness de scoring entre modos (Relax vs Classic)** — **DECISIÓN TOMADA (DEC-007 2026-06-27): Opción B.** Implementar `bestClassic` y `bestRelax` como campos separados en `ProfileManager`. Pasos: (1) En `ProfileManager`: renombrar `best`→`bestClassic`, agregar `bestRelax`, ambos persistidos en `STORAGE_KEYS`; (2) En `ScoreManager.commit()`: leer/escribir el campo correcto según `DifficultyManager.mode.id`; (3) En `GameScene.create()`: pasar el récord del modo activo a `HUD` y `startingHigh`; (4) En `GameOverScene`: mostrar el récord del modo activo. **Sin cambios al score base** — solo el high score se bifurca. **[Impl 2026-06-27]** El high score vive en `ScoreManager` (no en `ProfileManager`) → implementado ahí: nueva key `STORAGE_KEYS.HIGH_SCORE_RELAX` (CLASSIC mantiene `HIGH_SCORE` legacy → datos existentes = classic), `ScoreManager` resuelve la key por `DifficultyManager.mode.id` en load/save, y `GameOverScene` muestra `BEST · <MODO>`. GameScene/HUD ya leían `score.high` (ahora por-modo) sin cambios. Test nuevo en `ScoreManager.test`. | P1 | DONE (2026-06-27) | Dodge Rush Dev |
| `GME-013` | **Playtest de game feel — validación manual**: sesión de juego enfocada en verificar que velocidad, incremento gradual y tamaño de gaps se sienten justos y divertidos para el target kids/families. Checklist mínimo: ¿los primeros 30s son accesibles para un jugador nuevo?, ¿la dificultad escala sin picos injustos?, ¿los gaps en fase 4-5 son navegables con reflejos normales?, ¿el combo speed bonus se siente como recompensa y no trampa?, ¿Relax se percibe notablemente más fácil que Classic? Registrar findings con timestamps de run y ajustar `SCROLL_CFG`, `OBSTACLE_CFG` o `DIFFICULTY_MODES` según resultados. | P1 | PENDING | — |
| `GME-017` | **[PRE-STORE #2] Mecánica riesgo↔recompensa: obstáculos con dos gaps (fácil vs difícil), el difícil paga más.** **Definición refinada (2026-06-29, reemplaza la v1):** algunos obstáculos presentan **dos** pasos — uno **fácil** (gap ancho, cerca de la trayectoria del personaje) y uno **difícil** (gap angosto, lejos). La dificultad depende del **tamaño** (más grande = más fácil) y la **distancia** (más cerca = más fácil); el gap difícil (más chico y/o más lejos) **paga más score** (no velocidad — desacoplada por GME-GD-004). El gap fácil siempre es el alcanzable/justo (sin muertes inevitables) → Relax queda accesible. **[Impl v1 2026-06-29]** Eje *ancho del gap*: `SCORE_CFG.riskGapBonus/Wide/Narrow/riskFeedbackMin` + `ScoreManager.narrowGapBonus()` (pura, escala lineal, clamp ≥0) + sección de riesgo en `handlePass` (near-miss + gap angosto). Reusado por la v2. **[Impl v2 fork 2026-06-29]** (1) `FORK_CFG` (Constants): `spawnChance=0.45`, `minLevel=1`, `minEasyGap=160`, `hardRatio=0.62`, `minHardGap=100`, `minPillar=44`, `minOuterWall=20`, `telegraphColor=0xffb020` (ámbar). `SCORE_CFG`: `forkChoiceBonus=35`, `forkSeparationRef=200`. (2) `ScoreManager.forkBonus(separation, mult)` — pura: piso 60% por comprometerse, escala a 100% según separación entre gaps, ×combo, clamp ≥0. (3) `GapPlanner`: `PlannedGap.fork?`; `maybeFork()` mantiene el gap normal como **fácil** (preserva el contrato de fairness) y talla el **difícil** angosto al lado más lejano, con pilar ≥`minPillar` y pared externa ≥`minOuterWall`; elegible solo en muros estáticos no-golden con gap ≥`minEasyGap`. (4) `Barrier`: pilar central + segundo par de postes (gap2) telegrafiados en ámbar; `layout()`/`layoutFork()`/`placePillar()`; `safeGaps()` devuelve 1 o 2 gaps; `recycle/destroy` extendidos. (5) `ObstacleGenerator` pasa `plan.fork` a `spawn()`. (6) `CollisionSystem` es seguro si el jugador entra en **cualquiera** de los gaps (`safeGaps()`). (7) `GameScene.handlePass` detecta el gap elegido (`chosenGap`), suma `narrowGapBonus(chosen.width) + (chosen.hard ? forkBonus(separación) : 0)` + near-miss relativo al gap elegido; feedback `¡ARRIESGADO! +N` ámbar + shake al tomar el difícil. **Verificado:** 32 tests (forkBonus ×5, fork de GapPlanner ×2, fork de CollisionSystem ×1 + previos); `tsc` + `vite build` OK; smoke en navegador. | **P0** *(pre-store)* | DONE (2026-06-29) | Dodge Rush Dev |

### Versionado e identificación de build

| ID | Item | Prioridad | Status | Sesión |
|---|---|---|---|---|
| `GME-016` | **Sistema de versionado visible en el juego.** Fuente de verdad: `package.json` → inyectado en el build de Vite como `import.meta.env.VITE_APP_VERSION`. En `vite.config.ts` agregar `define: { 'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version) }`. Mostrar en `MainMenuScene` como texto pequeño en esquina inferior derecha: `"v1.0.0 (build 1)"` — donde `1.0.0` viene de `package.json` y `build 1` de `mobile/app.json → versionCode`. En producción: siempre visible. En QA: invaluable para saber qué versión se está probando. **Protocolo de bump de versión:** antes de cada build para QA o release → incrementar `version` en `package.json` + `versionCode` en `mobile/app.json` (entero creciente). Dejar documentado en `mobile/README.md`. **[Impl 2026-06-27]** (1) `vite.config.ts`: `import pkg` + `define` con `VITE_APP_VERSION` (resolveJsonModule ya estaba; `moduleResolution: bundler` habilita el default-import de JSON). (2) `src/vite-env.d.ts`: augment `ImportMetaEnv` con `VITE_APP_VERSION: string` (tipado bajo strict). (3) `Constants.ts`: `BUILD_NUMBER = 1`. (4) `MainMenuScene`: texto `v${version} (build ${BUILD_NUMBER})` abajo-derecha, alpha 0.5, en `uiGroup`. (5) `mobile/README.md`: sección "Version bump protocol" (bump de los 3 en lockstep). **Verificado en navegador:** el menú muestra "v1.0.0 (build 1)"; el bundle contiene `1.0.0` inyectado y ya NO contiene `VITE_APP_VERSION` (reemplazado por el define). `tsc` + `vite build` OK. | **P1** *(QA crítico — sin esto no se sabe qué version se prueba)* | DONE (2026-06-27) | Dodge Rush Dev |

### Revisión Game Designer — items aprobados por PO (2026-06-26)

| ID | Item | Prioridad | Status | Sesión |
|---|---|---|---|---|
| `GME-GD-001` | **Ruleta: eliminar skins ya desbloqueadas del pool.** Filtrar `SKINS` por `!Profile.isOwned(s.id)` antes del draw. Si el jugador tiene todo → coins. Garantía de skin nueva en cada spin. ~10 líneas en el sistema de ruleta. **Impacto directo en el único ad placement que queda.** | **P1** *(pre-launch, costo bajo)* | DONE (2026-06-27) | Mobile Game Designer |
| `GME-GD-002` | **Primer spin gratis garantizado en run #1.** Cuando `Profile.totalRuns === 1`, ofrecer spin de ruleta gratis sin ver ad — "Tu primera recompensa de piloto." El jugador sale del run #1 con un skin específico. Condición en `GameOverScene`, draw directo sin `Rewarded.show()`. | **P1** *(pre-launch, costo bajo)* | DONE (2026-06-27) | Mobile Game Designer |
| `GME-GD-003` | **Reemplazar misiones diarias con restricción de input.** En `DailyManager` eliminar las variantes "viajá N metros sin moverte a la izquierda" y "completá un run sin tocar el borde" — violan el principio de diseño de missions del GDD. Reemplazar por: "alcanzá Fase 3 dos veces en el día" y "completá 10 runs con combo > x5 en algún punto del run". | **P1** *(pre-launch, costo bajo)* | PENDING | Mobile Game Design Expert |
| `GME-GD-004` | **Desacoplar velocidad del combo multiplier.** El combo escala el multiplicador de SCORE únicamente. La velocidad solo escala con el tiempo via `DifficultyManager`. Desacoplar `comboBonus` de la variable `speed` en `GameScene.update()`. | **P1** *(pre-launch, costo medio)* | DONE (2026-06-27) | Mobile Game Designer | El combo escala el multiplicador de SCORE únicamente. La velocidad solo escala con el tiempo via `DifficultyManager`. Desacoplar `comboBonus` de la variable `speed` en `GameScene.update()`. **Nota PO:** este cambio también desbloquea la discusión del combo x1000 (GME-011) — si combo no afecta velocidad, x1000 es solo score, menos riesgoso. | **P1** *(pre-launch, costo medio)* | PENDING | Mobile Game Design Expert |
| `GME-GD-005` | **"Primer wow" — near-miss especial en run #1.** Cuando el jugador pasa muy cerca de un obstáculo por primera vez (`totalRuns === 0`, distancia < umbral en `CollisionSystem`): texto flotante "¡CASI!" + flash de viento + camera shake más pronunciado. Solo en el primer run. Convierte el near miss en el gancho emocional del juego. | **P1** *(pre-launch, costo medio)* | DONE (2026-06-27) | Dodge Rush Dev |
| `GME-GD-006` | **Hitos de zona con nombre al alcanzarlos.** Banner no intrusivo de 1.5s al cruzar umbrales: "¡Las Nubes!" (50m), "¡Tormenta!" (150m), "¡Estratosfera!" (300m), "¡Órbita!" (500m+). Detectar threshold en `ScoreManager`, emitir evento a `HUD`. Alineados con nombres de BG_ZONES. **[Impl 2026-06-27]** `Constants.ZONE_MILESTONES` (tabla `{at,name}` con los 4 nombres dados). `ScoreManager.pollMilestone()` devuelve el nombre la primera vez que el score cruza cada umbral (idx incremental; se rearma en `reset()`). `GameScene.update()` llama `pollMilestone()` y, si hay, `hud.showZoneBanner(name)`. `HUD.showZoneBanner` = título dorado centrado (~30% alto) que entra con Back.out, sostiene y flota/desvanece en ~1.5s y se auto-destruye. **Nota de diseño:** no hay métrica "metros" — uso el SCORE como distancia (la decisión "alineado con BG_ZONES" del ticket no aplica: los BG_ZONES son atmosféricos día/noche, no de altitud; usé los nombres de altitud explícitos del ticket). **Verificación:** test nuevo en `ScoreManager.test` (cada hito 1 vez, en orden, rearme en reset) → ScoreManager 9/9; `tsc` + `vite build` OK; en navegador confirmado que `showZoneBanner` crea el Text (depth 101, centro) y que `update()` consume los hitos en vivo. | **P2** | DONE (2026-06-27) | Dodge Rush Dev |
| `GME-GD-007` | **Sistema de achievements completo** — ver también REQ-001. 5 achievements que desbloquean las skins GOLD/SHADOW/AQUA/VIOLET/LIME. `AchievementManager` que lee data ya existente en `ProfileManager`/`DailyManager`. Notificación al desbloquear. Pantalla desde menú. **[Impl 2026-06-27]** Nuevo `AchievementManager` (singleton, persistido en `STORAGE_KEYS.ACHIEVEMENTS`): `evaluate()` chequea las 5 condiciones contra data existente (reach_1000m/reach_phase5 → `ScoreManager.bestOverall()` nuevo helper cross-modo; runs_50 → `Profile.totalRuns`; streak_7 → `Daily.currentStreak`; collect_all_common → todas las skins tier `common` owned), desbloquea + concede la skin (`Profile.unlock`) + encola notificación; `takePending()` la drena. `GameScene.finishGameOver()` llama `evaluate()` tras `recordRun()`. `GameOverScene` drena pending → toast dorado "🏆 X unlocked!". Nueva `AchievementsScene` (lista las 5 con preview tinteado, label y estado ✓/🔒) registrada en `GameConfig`; botón 🏆 top-right en `MainMenuScene`. **Verificación:** `AchievementManager.test` 7/7 (unlock+grant, idempotencia, persistencia cross-reload, takePending, cross-mode score, collect-all-common); `tsc` + `vite build` OK; en navegador la pantalla muestra "2/5 unlocked" con estados correctos y el botón 🏆 está en el menú. | **P2** *(post-launch si no hay tiempo)* | DONE (2026-06-27) | Dodge Rush Dev |
| `GME-GD-008` | **Screenshot compartible en game over.** Botón "Compartir" en `GameOverScene`: genera imagen con skin + score + nombre del juego. `navigator.share` en web, `expo-sharing` en mobile. Sin account, sin login. Viral coefficient orgánico. | **P3** *(post-launch)* | PENDING | — |

> **Nota PO sobre GME-011 (combo x1000):** una vez que GME-GD-004 esté implementado (combo desacoplado de velocidad), retomamos la discusión. Con combo puramente de score, x1000 es menos arriesgado.

---

## ÉPICA 7 — Mobile: Android (APK)

Estado actual: APK debug-signed funcionando. Menu + Daily hub OK. Gameplay 60fps con ANR solo en emulador software GPU (device real OK). Música corregida.

| ID | Item | Prioridad | Status | Sesión |
|---|---|---|---|---|
| `AND-001` | Probar APK en device real físico (no emulador) y confirmar 60fps estables | P0 | PENDING | — |
| `AND-002` | Crear keystore de producción y configurar `signingConfigs` en `build.gradle` | P0 | PENDING | — |
| `AND-003` | Configurar Google Play Console: crear app, completar ficha, policy compliance | P0 | PENDING | — |
| `AND-004` | Configurar Families Policy (COPPA): non-personalized ads, parental gate para IAP | P0 | PENDING | — |
| `AND-005` | Upload a track cerrado (Internal Testing) en Play Console | P0 | PENDING | — |
| `AND-006` | Subir a Open Testing y luego Production | P1 | PENDING | — |
| `AND-007` | Verificar `withWebAssets.js` plugin: que `expo prebuild` siempre sincroniza assets actualizados | P1 | PENDING | — |
| `AND-008` | Bundle fuentes offline para evitar request a Google Fonts CDN | P2 | PENDING | — |
| `AND-009` | Configurar íconos y splash screen reales (actualmente placeholder en `mobile/assets/`) | P0 | PENDING | — |

---

## ÉPICA 8 — Mobile: iOS

Estado actual: No iniciado. El WebView wrapper debería funcionar sin cambios mayores.

| ID | Item | Prioridad | Status | Sesión |
|---|---|---|---|---|
| `IOS-001` | Prebuild y build iOS via EAS (`eas build -p ios`) | **P3** *(post-MVP — DEC-003)* | PENDING | — |
| `IOS-002` | Testear en simulador iOS + device real | **P3** *(post-MVP)* | PENDING | — |
| `IOS-003` | Verificar audio en iOS (Safari WebView tiene restricciones distintas) | **P3** *(post-MVP)* | PENDING | — |
| `IOS-004` | Configurar App Store Connect: crear app, completar ficha | **P3** *(post-MVP)* | PENDING | — |
| `IOS-005` | Revisar política de Apple para kids apps (más restrictiva que Google Play Families) | **P3** *(post-MVP)* | PENDING | — |

---

## ÉPICA 9 — Monetización (Fase 4)

Estado actual: `Rewarded.ts` es un **stub** que simula éxito. Sin integración real. **DIFERIDO A V1.1 (2026-06-29):** V1.0 sale ads-free e IAP-free. Toda esta épica se reactiva cuando D1R/D7R del soft launch justifiquen prender la flag `MONETIZATION`.

| ID | Item | Prioridad | Status | Sesión |
|---|---|---|---|---|
| `MON-001` | Seleccionar e integrar AdMob SDK certificado para Families Policy | ~~P0~~ V1.1 | DEFERRED | — |
| `MON-002` | Reemplazar `Rewarded.ts` stub con implementación real (AdMob rewarded) | ~~P0~~ V1.1 | DEFERRED | — |
| `MON-003` | Configurar ad units: placement Continue + placement Double Coins | ~~P0~~ V1.1 | DEFERRED | — |
| `MON-004` | Verificar que los ads son non-personalized (COPPA compliance) | ~~P0~~ V1.1 | DEFERRED | — |
| `MON-005` | Implementar Starter Pack IAP (opcional, una sola compra) | ~~P1~~ V1.1 | DEFERRED | — |
| `MON-006` | Configurar parental gate para IAP (obligatorio para Families Policy) | ~~P0~~ V1.1 | DEFERRED | — |
| `MON-007` | Testear que el flujo rewarded no bloquea retry (principio 1 del GDD: sin fricción en retry) | ~~P1~~ V1.1 | DEFERRED | QA Tech Lead |

---

## ÉPICA 10 — ASO y Store Listing

| ID | Item | Prioridad | Status | Sesión |
|---|---|---|---|---|
| `ASO-001` | Definir nombre oficial del juego (ver BRN-001) | P0 | DONE (2026-06-26) | Product Owner |
| `ASO-002` | Redactar descripción corta y larga para Play Store | P0 | DONE (2026-06-26) | Mobile Game Designer — ver `docs/store-listing.md` |
| `ASO-003` | Crear screenshots de store (al menos 4, portrait) | P0 | PENDING | — |
| `ASO-004` | Crear preview video (15-30s gameplay) | **P2** *(deseable pero no bloquea upload)* | PENDING | — |
| `ASO-005` | Definir categoría, age rating y tags | P0 | DONE (2026-06-26) | Mobile Game Designer — ver `docs/store-listing.md` (Arcade/Action, Everyone/6+, Families Policy) |
| `ASO-006` | Traducir store listing al inglés (mercado principal) | **P0** *(MVP — mercado principal en inglés)* | DONE (2026-06-26) | Mobile Game Designer — inglés + español en `docs/store-listing.md` |

---

## ÉPICA 11 — QA y Testing

> 📋 **Catálogo de casos de uso a testear:** [`USE-CASES.md`](USE-CASES.md) — inventario único de QUÉ se testea (~70 casos en 15 dominios), con cobertura actual y una **columna de decisión del PO** (Mantener / Modificar / Quitar / Agregar).

| ID | Item | Prioridad | Status | Sesión |
|---|---|---|---|---|
| `QA-001` | Crear plan de pruebas completo (feliz path + edge cases) | P1 | DONE | QA Tech Lead |
| `QA-002` | Ejecutar Vitest unit tests (requiere Node 18+, no corre en sandbox Node 16) | P1 | DONE | QA Tech Lead |
| `QA-003` | Smoke test del APK en al menos 3 devices físicos distintos | P0 | PENDING | QA Tech Lead |
| `QA-004` | Verificar graceful fallback a texturas procedurales cuando assets no cargan | **P3** *(post-MVP)* | DONE | QA Tech Lead |
| `QA-005` | Testear modo offline completo (avión mode en device) | **P0** *(MVP — el APK es offline-first)* | PENDING | QA Tech Lead |
| `QA-006` | Verificar que Diagnostics.ts captura errores correctamente en device | **P3** *(post-MVP)* | PENDING | QA Tech Lead |
| `QA-007` | Validar que `ProfileManager` sobrevive a app kill + restart (localStorage persiste) | **P0** *(MVP — coins y skins deben persistir)* | PENDING | QA Tech Lead |
| `QA-008` | Testear daily missions con fecha simulada (verificar rotación) | P2 | PENDING | QA Tech Lead |

---

## ÉPICA 12 — Documentación

| ID | Item | Prioridad | Status | Sesión |
|---|---|---|---|---|
| `DOC-001` | Resolver naming "Fallcade" vs "Dodge Rush" en `docs/gdd.md` | P0 | DONE (2026-06-27) | Dodge Rush Dev | — duplicado de BRN-002. `docs/gdd.md` ya usa "Dodge Rush" (0 ocurrencias de "Fallcade"); el resto de `docs/` alineado en BRN-002. |
| `DOC-002` | Documentar proceso completo de build APK en `mobile/README.md` (ya parcialmente documentado en memoria) | **P2** *(no bloquea lanzamiento)* | PENDING | — |
| `DOC-003` | Crear runbook de release: cómo hacer una release firmada para Play Store | **P0** *(MVP — sin esto el release es artesanal)* | PENDING | — |
| `DOC-004` | Documentar qué nuevos skins/obstacles se agregaron y actualizar `docs/progression-skins.md` | **P3** *(post-MVP)* | PENDING | — |

---

## Bugs Conocidos

| ID | Bug | Severidad | Status | Reportado por |
|---|---|---|---|---|
| `BUG-001` | Gameplay ANR en emulador Android con software GPU (`-gpu swiftshader_indirect`) | LOW | KNOWN | Dodge Rush General |
| `BUG-002` | Loop seam en música al cambiar de menú a gameplay (HTML5 Audio vs. buffer crossfade original). **[QA 2026-06-26]** El loop *intra-track* (la música repitiéndose) era el peor offender: tenía gap mudo + fade-out — **RESUELTO** (assets re-procesados a OGG Vorbis gapless + fallback MP3 recortado; loop por crossfade de 2 voces `<audio>` en `SoundManager`). Falta aún crossfade en el *cambio* de track menú↔gameplay (hoy corta seco) → ver REQ-005. Pendiente validar en device (SND-005). | LOW | PARTIAL | Dodge Rush General |
| `BUG-003` | Live preview en web es inconsistente con HMR (tab throttling + concurrent edits) — validar siempre en device | INFO | KNOWN | — |
| `BUG-004` | En device físico Android las skyboxes (zonas día/atardecer/noche/aurora) no se ven correctamente. Las capas de parallax (nubes, naves) sí funcionan. Sospecha: problema de decode/render de las `bg_sky_*.png` en WebView Android (posible issue de formato, color space, o alpha premultiplicado). En web se ve bien. **[BG Image Design 2026-06-26]** Causa real NO era el PNG (formato idéntico a las nubes que sí funcionan). Era el **grade wash**: un Phaser `Rectangle` (Shape) que tapaba el cielo en WebView. **FIXED** en `Background.ts` (grade ahora es `Image` tinteada). Build + sync hechos. Pendiente confirmar en APK (BG-003). **[CORRECCIÓN 2026-06-27]** Esta hipótesis del grade fue DESCARTADA: el fix llegó al APK (00:44) pero el bug persiste (ver BUG-008). El cambio grade→Image se mantiene (es más robusto igual) pero no era la causa. Re-investigación activa en BUG-008. | HIGH | SUPERSEDED por BUG-008 | Product Owner / Background Image Design |
| `BUG-005` | `ComboManager.test.ts` falla (1 test): espera `mult=35` en combo 50 y cap `200`, pero `COMBO_TIERS` (Constants.ts) fue cambiado por otra sesión a `mult=40` en 50 y nuevo tope `at:1000→350`. El test quedó desactualizado respecto a los tiers. **[QA Tech Lead 2026-06-27 — FIXED]** Test rediseñado: ya no hardcodea valores — itera `COMBO_TIERS` completo para verificar que cada `at`→`mult` es exacto, más test de monotonía sobre el rango estático. **91 tests / 12 suites verdes**. | LOW | ✅ FIXED (2026-06-27) | QA Tech Lead |
| `BUG-006` | **Sprite mira al lado contrario al moverse — VALIDADO + CORREGIDO.** ⚠️ Premisa del reporte corregida: el default NO es "facing left". Según `PlayerFacing.ts` (`POSE_FACES_RIGHT`), las poses `hover/boost/cheer/celebrate/dizzy` son natural-**RIGHT** y `move/move_hard` natural-**LEFT** (el flip las orienta al sentido de viaje). Criterio de validación: **hover→derecha, move→izquierda**. No existe `scripts/build-wizard.py`; la lógica vive en `PlayerFacing.ts`. Validé los 12 sheets (hover+move; en wizard/witch revisé las 7 filas). **Afectados (2):** (1) **WIZARD** — filas `move` (frames 6-11) y `move_hard` (12-17) estaban espejadas (miraban DERECHA, debían IZQUIERDA) → causa raíz del reporte de device. (2) **WITCH** — filas `hover` (0-5), `boost` (18-23), `cheer` (24-29), `combo` (30-35) y `specials` (36-41) estaban espejadas (miraban IZQUIERDA, debían DERECHA); misma clase de bug, **no reportada antes**. **OK (10):** classic, cat, hound, dragon, unicorn, phoenix, frost, ghost, king, evil. **Fix aplicado:** flip horizontal por-celda de las filas invertidas (wizard `{1,2}`; witch `{0,3,4,5,6}`) — verificado que las 12 poses de ambos cumplen la convención. Las fuentes IA de witch/wizard ya no están en `Downloads`, así que el PNG es la fuente de verdad (no se puede regenerar vía build-skins). | HIGH | ✅ FIXED (2026-06-27) | Character Design |
| `BUG-007` | **3 vidas siguen activas en modo CLASSIC en device.** Post-DEC-006 el diseño acordado mantiene 3 vidas como kindness mechanic, PERO el usuario reporta que en Classic debería ser 1 vida (muerte más exigente). Esto puede indicar que DEC-006 necesita revisarse para diferenciar vidas por modo (1 vida en Classic, 3 en Relax). Además, el scoring separado por modo (GME-012) sigue sin implementarse — ambos bugs están relacionados. **Acción requerida: decisión de diseño DEC-007 antes de implementar.** | MEDIUM | OPEN — NEEDS DESIGN DECISION | Product Owner (2026-06-27) |
| `BUG-008` | **Skyboxes siguen sin verse en device físico.** BUG-004 fue marcado FIXED pero persiste. Nubes y naves sí se ven. **[BG Image Design 2026-06-27] Q1 (¿llegó el fix?): SÍ.** `app-release.apk` es de Jun 27 00:44, posterior al fix (00:42); el bundle dentro del APK contiene `bg_grade_px` (el fix) y los 6 `bg_sky_*.png` están empaquetados en `src/main/assets/web` e `intermediates/release`. Pipeline OK (build→sync→assembleRelease corrió). **Conclusión: el grade NO era la causa** (fix correcto en el APK, bug persiste). **Re-diagnóstico:** descartado tint (no-tint == white-tint, mismo path WebGL), formato (idéntico a nubes), dimensiones (spaceship 540×4800 funciona), y oclusión/alpha (el vignette es la capa full-screen más alta a alpha 0.22 y las nubes debajo se ven → el alpha SÍ se respeta → nada opaco tapa el cielo). **Hipótesis líder:** fallo silencioso de decode/upload de los `bg_sky_*.png` (los más pesados: 81–200KB) en el WebView; TODAS las capas que funcionan pesan ≤38KB. **Enviado al bundle:** audit a logcat (`[DodgeRush:bg-audit]` con estado real+dimensiones de cada textura) + self-heal (regenera gradiente si una sky decodifica 0×0, para que nunca quede en negro). **[QA Tech Lead 2026-06-27 — NUEVA EVIDENCIA DE DEVICE]** APK más reciente (App Builder session) probado en device físico: zonas día/atardecer/noche siguen sin verse (fondo negro). Nubes y parallax sí visibles (sin cambio). Confirmado que el self-heal y la instrumentación deben estar en este APK. **Evidencia faltante CRÍTICA para diagnóstico:** (1) screenshot del device mostrando el negro, (2) logcat filtrado por `[DodgeRush:bg-audit]` — esas líneas confirman si las skyboxes deciden 0×0 (→ JPEG fix) o si tienen dimensiones correctas pero no renderizan (→ GPU/WebGL path). Sin logcat no se puede avanzar en el diagnóstico. **Acción requerida del usuario:** conectar device + `adb logcat \| grep "bg-audit"` mientras corre el juego, compartir output. | HIGH | IN PROGRESS — NEEDS LOGCAT | Background Image Design / QA Tech Lead |
| `BUG-009` | **Loop seam audible en música in-game y de menú en device.** Loop in-game: el crossfade de 2 voces sigue siendo perceptible en device físico. **Propuesta de mejora:** (a) in-game: aumentar duración del crossfade o usar fade más natural; (b) menú: cambiar comportamiento — dejar que la pista termine naturalmente, esperar ~5 segundos de silencio, y reiniciar. Esto da respiro y elimina la percepción de loop mecánico. Requiere cambios en `SoundManager.ts`. | MEDIUM | FIXED en código (2026-06-27) — pendiente verificación perceptual en device. Ver bitácora | Sound Effects & Music |
| `BUG-010` | **`Skins.test` rojo (3 tests) — catálogo de skins fuera de sus invariantes.** Otra sesión amplió el catálogo y rompió 3 asserts de `src/config/Skins.test.ts`: (1) "exactly one free skin and default CLASSIC" → hay **3 skins free**; (2) "sorted by strictly ascending cost" → el orden de `cost` no es estrictamente ascendente (un salto a 0 después de 820); (3) "no purchasable skin uses a tint" → la skin **`iron`** tiene `tint` no-null siendo comprable. **No es regresión de GME-015** (lo detecté al correr la suite completa; mis cambios de vidas/score están verdes). Hay que decidir: actualizar el catálogo `SKINS` para respetar las invariantes, o actualizar el test si las reglas cambiaron a propósito (dueño: sesión de skins/SpinManager). **Aparte:** el runner de Vitest tira `ERR_WORKER_OUT_OF_MEMORY` intermitente (heap del sandbox) que enmascara ~13 tests — correr con `--no-file-parallelism` ayuda. | MEDIUM | OPEN | Dodge Rush Dev (2026-06-27) |

*Agregar bugs nuevos aquí con el formato: `BUG-NNN \| descripción \| severidad (CRITICAL/HIGH/MEDIUM/LOW) \| status \| sesión que lo reporta`*

---

## Requerimientos Faltantes Detectados

*Sección para que cualquier sesión agregue algo que descubre que falta y no está en el backlog.*

| ID | Descripción | Detectado por | Fecha |
|---|---|---|---|
| `REQ-004` | `orange_block` e `ice_block` existen como sprites en el atlas PNG (coords conocidas en `build-obstacles.py`) pero fueron retirados de código por no tener ObstacleType. Son candidatos directos para dos tipos nuevos sin necesidad de arte adicional. Ver OBS-001. | Obstacle Design | 2026-06-26 |
| `REQ-001` | No hay sistema de achievements implementado en código (solo definidos en `Skins.ts` como `achievementId`) — `DailyManager` no cubre esto | — | 2026-06-26 |
| `REQ-002` | No hay pantalla de perfil del jugador (estadísticas totales: runs, monedas ganadas, mejor streak) | — | 2026-06-26 |
| `REQ-003` | No hay analytics / telemetría real (solo `Diagnostics.ts` local) — para Fase 5 se necesita un proveedor | — | 2026-06-26 |
| `REQ-005` | El cambio de track menú↔gameplay corta seco (no hay crossfade entre tracks distintos). El loop intra-track ya es gapless por crossfade; falta extender ese crossfade al *switch* de pista en `playMusic`. Bajo impacto. | QA Tech Lead | 2026-06-26 |
| `REQ-006` | Los overlays de oscurecimiento de Daily/Info/Shop usan Phaser `Rectangle` (Shape) con alpha 0.78 (`scene.add.rectangle(...)`). BG-005 mostró que el pipeline de Shapes puede no respetar el alpha en WebView Android. Si el síntoma fuese del pipeline de Shapes en general (no solo de `setFillStyle`), esos menús se verían casi negros en device. Verificar en APK; si falla, reemplazar por `Image` tinteada (mismo patrón que el fix del grade). | Background Image Design | 2026-06-26 |
| `REQ-007` | **Onboarding first-run ausente (brecha crítica de D1R).** No existe ningún mecanismo de first-run hint. `ProfileManager` no tiene contador de runs. El GDD ya lo tenía en su backlog interno. Propuesta: (1) Agregar `totalRuns` a `ProfileManager` (incrementar en `GameOver`). (2) En `GameScene.create()`, si `Profile.totalRuns === 0`, crear un overlay con dos flechas `← TAP    TAP →` (tweens de pulse suave, alpha fade-out en `controls.onFirstInput`). Costo: ~50 líneas. Impacto: directo en Day-1 Retention para kids 6–12. | Mobile Game Designer | 2026-06-26 |
| `REQ-008` | **ContinueScene: countdown sin urgencia visual para kids.** El `Arc` ring tiene trazo fijo (blanco) durante todo el countdown. Propuesta: interpolarlo blanco→naranja→rojo a medida que `secondsLeft` baja (ej. >3 = blanco, 2 = naranja, 1 = rojo). Costo: 5 líneas en `tick()`. | Mobile Game Designer | 2026-06-26 |
| `REQ-009` | **ContinueScene: transparencia del ad no es visible antes de aceptar.** La etiqueta "Watch a short ad" es texto secundario suelto debajo del botón — desconectado visualmente de la acción. Para Families Policy y para kids, el contrato del ad debe estar en el botón mismo. Propuesta: cambiar label del botón a `▶ WATCH AD TO CONTINUE` y eliminar la línea de texto separada. Costo: 1 línea. | Mobile Game Designer | 2026-06-26 |
| `REQ-010` | **GameOverScene (double-coins): falta microcopy del ad.** El botón `▶ DOUBLE COINS` no informa que requiere ver un video. Un jugador de 8 años o un padre no lo deduce del ▶. Propuesta: agregar subtítulo de 1 línea debajo del botón: `"Watch a short video"` (mismo estilo que el hint de ContinueScene). Costo: 1 línea. | Mobile Game Designer | 2026-06-26 |

*Agregar con el formato: `REQ-NNN \| descripción \| sesión \| fecha`*

---

## Decisiones Pendientes o Tomadas

| ID | Decisión | Status | Notas |
|---|---|---|---|
| `DEC-001` | Nombre oficial del juego: "Dodge Rush" o "Fallcade" | **PENDIENTE** | GDD dice "Fallcade", todo lo demás dice "Dodge Rush". **[QA 2026-06-26]** Evidencia: `docs/gdd.md` es el ÚNICO archivo con "Fallcade" (3 ocurrencias, 0 de "Dodge Rush"); el resto del repo (código, `package.json`, assets, memoria del proyecto) usa "Dodge Rush" de forma consistente. Costo de cambio asimétrico: alinear el GDD = 1 doc; renombrar a "Fallcade" = código + assets + store + memoria. Sin contexto de negocio que favorezca "Fallcade" (¿conflicto de marca/ASO?), **recomendación QA: oficializar "Dodge Rush"** y actualizar el GDD (BRN-002/DOC-001). Decisión final del PM. |
| `DEC-002` | Proveedor de AdMob para Families Policy | DIFERIDO V1.1 | V1.0 sale sin ads. Reevaluar tras soft launch. Debe ser certificado Families. |
| `DEC-003` | iOS: lanzar simultáneamente con Android o diferir | PENDIENTE | |
| `DEC-004` | Dog sprite: ¿es un skin adicional nuevo (> 12) o reemplaza a Hound? | PENDIENTE | Sesión "Dog character sprite" en progreso |
| `DEC-005` | Fuentes: reemplazar Google Fonts CDN por fallback monospace o bundle | PENDIENTE | CDN falla en mode avión |
| `DEC-007` | **Vidas por modo + default de dificultad** | ✅ **RESUELTO 2026-06-27** | Classic = 1 vida (pureza arcade). Relax = 3 vidas (kindness mechanic). **`DEFAULT_DIFFICULTY` cambia de `'classic'` a `'relax'`** — el primer run de cualquier jugador nuevo es siempre en Relax. Aprobado por PO + Game Designer. Ver ticket GME-015. |
| `DEC-008` | ¿Borrar definitivamente los PNGs de skins `character_frost/ghost/king/dragon/hound`? | **PENDIENTE — BLOQUEA limpieza de assets** | **[Dodge Rush Dev 2026-06-27]** El PO pidió borrarlos como "residuos sin referencia", pero **NO es seguro borrarlos tal cual** por dos motivos: (1) **Premisa incorrecta** — los 5 SÍ se cargan en `PreloadScene.ts` (`load.spritesheet`) y tienen color en `SHEET_FALLBACK` (`TextureFactory.ts`); además hay build scripts (`build-hound.py`, `build-dragon.py`, `build-ghost.py`, `build-variants.py`). Están fuera del catálogo (`Skins.ts`) pero borrar el PNG sin quitar el `load()` deja 404 en cada arranque. Para borrarlos hay que primero quitar los 5 `load()` + las 5 entradas de `SHEET_FALLBACK` (verificado: NO rompe `TextureFactory.test`, que itera `SKIN_SHEETS`). (2) **Conflicto con tickets abiertos** — `character_hound.png` es el asset de **SKN-001 (PENDING, revisar calidad)** y **DEC-004 (Dog como candidato post-MVP)**; borrarlo los contradice. Los otros 4 tienen build scripts propios → confirmar si están cortados definitivamente o "aparcados". **Acción requerida del PO:** confirmar cuáles de los 5 se cortan de verdad. Una vez confirmado, el cleanup seguro es: quitar `load()` + `SHEET_FALLBACK` + borrar PNG (+ opcional borrar el build script). Tarea en pausa por decisión del usuario hasta que el PO lo aclare. |

---

## Log de Progreso

*Cada sesión debe agregar una línea aquí cuando completa algo, con fecha.*

| Fecha | Sesión | Item(s) | Notas |
|---|---|---|---|
| 2026-06-29 | Dodge Rush Dev | SKN-007 ✅, GME-017 ✅ | **SKN-007:** `character.png` revertido al sprite limpio de `v0.0.7` (`d5ec45e`) vía `64edfa8`. **GME-017:** obstáculo `fork` riesgo↔recompensa vía `08c8836` (gap EASY alcanzable + gap HARD angosto amber; `forkBonus`/`narrowGapBonus`/near-miss; popup `RISKY!`; tests en `GapPlanner.test.ts`). Feedback localizado a inglés (`9fc0d9c`). **Pre-store: queda solo BG-005** (espera logcat de device).
| 2026-06-29 | SKN-007 character sprite adjustment | SKN-007 | **DONE.** Revertido el héroe del sheet "cargado" (`c011bdb` — traje carmín oscuro + goggles verdes sobre la cara) al look limpio previo (`d5ec45e` — traje rosa, cara crema visible, guantes blancos). Mismo grid 6×8 (720×960) → drop-in del PNG. El cambio al sheet cargado habían sido **2 commits**: `c011bdb` (PNG) + `2e38bab` ("Remap character frames"); este último tocó `CharacterSprite.ts` + `Player.ts` porque los dos sheets difieren en filas 5-6 (combo/specials). Se revirtió también ese remap (`git checkout 2e38bab^ -- src/config/CharacterSprite.ts src/objects/Player.ts`) → el frame-map vuelve a la versión `3fc43be` que matchea el sheet limpio (combo x2..x20 = 31-35, crown=39/starHead=40/sadHead=41, impact=43). **Validación:** `tsc` + `vite build` OK (48 módulos); `PlayerFacing.test` verde; contact-sheet etiquetado de las 48 celdas confirma cada pose↔índice (hover/move/moveHard/boost/cheer/combo/dizzy/sadCloud/trophy/crown/starHead/sadHead/death); in-game (web) menú (hover) + gameplay + game-over (pose triste) renderizan el héroe limpio correctamente. `Skins.test` tiene 3 rojos PRE-EXISTENTES (catálogo: free-count, cost-sort, tint `iron`) ajenos a este cambio. Solo `public/assets/character.png` está git-tracked (copias dist/mobile son gitignored, se regeneran en build+sync). |
| 2026-06-29 | Product Owner | DEC-009, BACKLOG reenfocado pre-store | V1.0 ads-free/IAP-free. Backlog pre-store reducido a 3 puntos: SKN-007 (revert character), GME-017 (riesgo↔recompensa), BG-005 (fondo en device). Épica 9 (MON-*) diferida a V1.1. Ruta crítica = 3 puntos de producto + release ops de trámite. |
| 2026-06-27 | Dodge Rush Dev (LLM Agent) | DIS-002 (MVP Minimal v1.0) | Implementado el sistema de feature flags del `docs/archive/implementation-brief.md`. Nuevo `src/config/FeatureFlags.ts` con 5 flags en OFF (SHOP/DAILY/COMBO_LABELS/MONETIZATION/RELAX_MODE) + core loop en ON. UI ocultada (SHOP, DAILY, achievements, toggle de dificultad, monedas, spin slot, zone banners) y lógica gateada en `MainMenuScene`/`GameOverScene`/`GameScene`/`HUD`/`DifficultyManager`/`DailyManager`. Todo el código queda dormido (no borrado) → reactivar en V1.1 = flipear 5 booleanos. Tests adaptados (unit force-enable RELAX donde aplica; E2E `test.skip` flag-aware en daily/spin/persistence). Verificación: `tsc --noEmit` limpio, `vite build` OK (47 módulos), unit 86/89 (3 rojos = BUG-010 ajeno, probado pre-existente vía git stash), E2E 28 pass / 4 skip / 6 pre-existentes (DEC-007 lives + skins catalogue). Screenshots Playwright confirman UI simplificada. 10 commits. |
| 2026-06-27 | Character Design | BUG-006 (validación + fix) | Validados los 12 sheets de facing (criterio real de `PlayerFacing.ts`: hover/boost/cheer/celebrate/dizzy→derecha, move/move_hard→izquierda; la premisa "idle mira a la izquierda" del reporte era incorrecta). **2 afectados, ambos corregidos** flipeando filas por-celda en el PNG: **WIZARD** move+move_hard (6-17) estaban espejados (causa raíz del reporte); **WITCH** hover+boost+cheer+combo+specials (0-5, 18-41) también espejados (no estaba reportado). Los otros 10 OK. Fuentes IA de ambos ya no están en Downloads → el PNG es la fuente de verdad. No existe `build-wizard.py`. Detalle completo en Bugs Conocidos / BUG-006. |
| 2026-06-25 | Dodge Rush General | Fase 1, Fase 2 completa | APK funcional, música corregida, daily missions, dificultad Relax/Classic |
| 2026-06-27 | Character Design | BRN-004 | Icon/branding finales generados desde el héroe pintado (`character.png` hover) vía `scripts/build-app-icons.py` — reproducible. `mobile/assets/icon.png` (1024², héroe + glow rosa de marca sobre púrpura radial, legible a 60px), `adaptive-icon.png` (1024², foreground transparente, héroe dentro de la safe zone ~66%, bg `#1a1030` ya en `app.json`), `splash.png` (1242×2436, retrato, logo "DODGE/RUSH" blanco/rosa en monospace bold + héroe + tagline, fondo `#1a1030`). Validado con máscaras circular/squircle. Sin cambios de código (app.json ya apuntaba a esas rutas). Nota: icon a 1024 (downscalea al 512 de Play Store). |
| 2026-06-27 | Mobile Game Designer | Classic mode rewards differentiation | **Nueva mecánica de diferenciación Classic vs Relax:** (1) **1.5× monedas en Classic** — `GameScene.finishGameOver()` multiplica el coin count por 1.5 cuando `DifficultyManager.mode.id === 'classic'`. (2) **2 skins Classic-exclusive** — `IRON` (epic, tint acero 0x8ab4e0) y `EMBER` (epic, tint rojo 0xe85c2d) agregadas a `Skins.ts` con `classicOnly: true`; `SkinDef` tiene nuevo campo `classicOnly?: boolean`. (3) **SpinManager filtra por modo** — el pool solo incluye skins `classicOnly` si el run anterior fue Classic; Relax players nunca las ven en el draw. (4) **GameOverScene refleja el bonus** — label de monedas muestra `×1.5` en Classic; subtítulo del spin en Relax dice "Play Classic to unlock more pilots" (gold cuando es Classic, azul cuando es Relax). Build TypeScript limpio, 0 errores. |
| 2026-06-27 | Mobile Game Designer | GME-GD-001, GME-GD-002, GME-GD-004 | **GME-GD-004:** `comboBonus` removido del cálculo de `speed` en `GameScene.update()` — velocidad ahora solo escala por tiempo vía `DifficultyManager`. Combo sigue multiplicando score. **GME-GD-001 + GME-GD-002:** creado `SpinManager.ts` con draw tier-weighted sobre skins NO desbloqueadas (garantía de skin nueva, sin repetidos); si el jugador tiene todo → consolation coins. `Profile.unlock()` agregado a `ProfileManager`. `GameOverScene` reescrita con: (a) botón `🎁 YOUR FIRST PILOT — FREE!` en `totalRuns === 1` — draw directo sin ad; (b) botón `🎰 SPIN FOR A PILOT` + `Rewarded.show('spin')` cuando `Spin.canSpin()`. `DailyScene` conectada: CLAIM SPIN ahora llama `Spin.addBonus()`. Build TypeScript limpio (44 módulos, 0 errores). |
| 2026-06-26 | Mobile Game Designer | ASO-002, ASO-005, ASO-006, BRN-002/DOC-001, GME-012, GME-013 | Store listing completo en `docs/store-listing.md` (EN + ES). GDD renombrado a "Dodge Rush". GDD tabla de pilotos sincronizada a 7 skins actuales. Dos items de backlog agregados (scoring fairness + playtest game feel). |
| 2026-06-26 | Product Owner | Creación de este backlog | Relevamiento completo del código y sesiones activas |
| 2026-06-26 | Product Owner | Priorización MVP | Definida visión MVP: Android-first, juego existente + monetización real + Families Policy. Decisiones tomadas: nombre="Dodge Rush" (DEC-001 ✅), iOS diferido (DEC-003 ✅), Dog post-MVP (DEC-004 ✅), fuentes online aceptado (DEC-005 ✅). Toda la épica iOS + nuevos obstáculos + nuevos skins bajados a P3. Ruta crítica de 11 pasos documentada en sección VISIÓN MVP. |
| 2026-06-26 | Obstacle Design | OBS-006 (auditoría existentes) | **Lo que se hizo:** (1) Eliminados `orange_block` e `ice_block` de `OBSTACLE_FRAMES` y `build-obstacles.py` — eran tiles sin ObstacleType asignado (assets huérfanos). Sus pixels siguen en el atlas PNG pero no se registran ni usan. (2) Verificado que el escalado vertical (atlas 50px → bandHeight 88px) es uniforme en ambos ejes — sin distorsión. (3) Verificado que `purple_pillar` se tilea correctamente como barra horizontal. (4) `blue_tile` (Glowing) diferenciado de `blue_bar` (Straight): fill cambiado a violeta `0x7722ee`, glow pulse a `0x9933ff`. (5) Sistema de animación de sprites implementado: `ObstacleTypeDef` extendido con `animFrames`/`animMs`, `OBSTACLE_ANIM_FRAMES` en Constants.ts, registro de frames `_f1` en TextureFactory, ciclo de frames en `Barrier.advance()`. (6) Atlas extendido a 545×92 con row 1 de animación: `red_arrow_f1` (shift 2px right, 150ms), `red_spike_f1` (shift 2px up, 400ms), `gold_block_f1` (shift 1px diagonal, 600ms). (7) Fill colors documentados en `ObstacleTypes.ts`. (8) `build-obstacles.py` preparado para fuente 2048 (instrucciones en el script). **Lo que NO se hizo:** OBS-001 (nuevos tipos) — ver nota abajo. |
| 2026-06-26 | QA Tech Lead | QA-001, QA-002, SKN-002, GME-004 | **QA-001:** plan de pruebas completo en `QA-PLAN.md` (estrategia, casos GP/SC/EC/PE/LD/NF, métricas, DoD) + `QA-MANUAL-CHECKLIST.md` (GP-01..GP-10, audio SND-01..10, skins SK-01..08 — lo perceptual que no se automatiza). **QA-002:** suite Vitest montada y verde — **90 tests / 12 suites** en Node 20 (`@types/node` agregado; `engines: node>=20` en package.json). Cubre lógica pura: scoring, combo, colisión, dificultad+modos, generador (fairness con seed), persistencia/saneo, diagnostics, sonido (crossfade+formato), orientación, higiene de audio. **SKN-002:** verificado por test — los 12 character sheets son exactamente 720×840 (grid 6×7 de 120px) → toda pose (0..41) mapea a celda real; rangos de animación dentro del grid. (La calidad *visual* del arte por frame queda como check manual SK-01..08.) **GME-004:** `loseLife()` llama `combo.reset()` (GameScene.ts:338) + cubierto por ComboManager.test. **Audio (pedido del usuario, fuera de épica):** loop intra-track ahora gapless (OGG + crossfade 2 voces) — ver BUG-002/REQ-005. |
| 2026-06-26 | Background Image Design | BG-005 / BUG-004 | **Diagnóstico:** El bug NO estaba en los `bg_sky_*.png`. Verifiqué que skyboxes y capas de parallax (las que funcionan) son PNG **idénticos en formato**: 8-bit, colortype 6 (RGBA), no interlazado, sin ICC profile, mismo loader y misma ruta. El spaceship (540×4800) renderiza, así que no hay límite de `MAX_TEXTURE_SIZE` por debajo de eso. Descarté formato/alpha-premult/tamaño/sync (assets presentes en `mobile/web` y `dist`). **Causa raíz:** el **grade wash** (tinte atmosférico por zona) era el único elemento del fondo que (a) está en el orden de dibujo *por encima* del cielo+capas lejanas pero *por debajo* de nubes cercanas+luces, y (b) se renderizaba con un Phaser **`Rectangle` (Shape)**, no un `Image`. Se construía opaco (`0xffffff,1`) y se atenuaba con `setFillStyle(color,alpha)` cada frame; en WebGL de WebView Android ese alpha del pipeline de Shapes no se aplicaba bien → el wash quedaba casi opaco y **tapaba el cielo**, dejando ver solo las nubes cercanas y las luces aditivas de las naves (exactamente el síntoma reportado). En Chrome el Shape sí respeta el alpha → por eso en web se veía bien. Esto explica por qué unas Images (nubes) se ven y otras (cielo) no: no es la Image, es lo que la tapa. **Solución:** en `Background.ts` el grade ahora es un `Image` (pixel blanco `bg_grade_px` estirado a pantalla) con `setTint(color)`+`setAlpha(alpha)` — mismo pipeline de textured-quad que TODAS las capas que ya funcionan, render idéntico en web y device. Verificado en web (grade sutil, tint/alpha correctos por zona, orden de dibujo y crossfade intactos). `tsc` limpio; `vite build` + `npm run sync:web` hechos (fix presente en bundle android). **Pendiente:** confirmar en APK físico (BG-003). **Follow-up detectado:** los overlays de oscurecimiento de Daily/Info/Shop también son `Rectangle` Shapes (alpha 0.78) — si el problema fuese del pipeline de Shapes en general (y no solo del `setFillStyle`), podrían verse demasiado oscuros en device; QA debería revisarlo (anotado como REQ-006). |
| 2026-06-26 | QA Tech Lead | GME-001, QA-004 | **98 tests / 13 suites verdes.** **GME-001:** contrato de balance objetivo verificado en `DifficultyManager.test` sobre toda la rampa (0..300s): RELAX nunca más difícil que CLASSIC en velocidad/gap/spacing y con más vidas; ambas rampas monótonas sin saltos; ventana de reacción ≥ `reactionMinMs` (600ms) en todo punto y en ambos modos (principio "muerte = culpa del jugador"); plateau en el `maxStep` de cada modo (sin runaway). El "¿es divertido?" sigue siendo playtest manual (checklist GME-001). **QA-004:** `TextureFactory.test` (Phaser + escena mockeados) ejecuta `ensureFallbacks` real y verifica que regenera un stand-in para CADA asset cargable (12 sheets + 6 skyboxes + 6 capas parallax + obstáculos), que solo regenera lo reportado como `failed`, que detecta el placeholder `__MISSING`, y que `ensureCoin`/`ensureParticleTexture` funcionan. **Nota (corregido):** `SHEET_FALLBACK` solo definía color propio para 3 de 12 sheets (los otros 9 caían al rosa por defecto). Ahora los 12 tienen color de identidad (hound marrón, dragon verde, witch púrpura, etc.) y hay un test que falla si un skin futuro queda sin color. |
| 2026-06-26 | Mobile Game Designer | MON-007, GME-003, GME-007 implementados | **MON-007:** microcopy "Watch a short video" bajo el botón ▶ DOUBLE COINS en `GameOverScene.ts`. **GME-003:** botón ContinueScene cambiado a "▶ WATCH AD TO CONTINUE" (el ad es parte del label, no texto suelto); ring countdown cambia blanco→naranja(≤3s)→rojo(≤1s). **GME-007:** onboarding first-run — `Profile.totalRuns` + `Profile.recordRun()` agregados a `ProfileManager.ts`; `STORAGE_KEYS.TOTAL_RUNS` en `Constants.ts`; hint `◀ TAP  TAP ▶` con pulse tween en `GameScene.ts` que desaparece en el primer input, activado solo cuando `totalRuns === 0`; `recordRun()` llamado en `finishGameOver()`. Build TypeScript limpio (44 módulos, 0 errores). |
| 2026-06-26 | Dodge Rush Dev | GME-008 (remover smash-power) | **Eliminado el smash-power (doble-tap para romper obstáculos) por completo**, alineando el código con el GDD (input único). Quitado: (1) `InputController.ts` — toda la detección de doble-tap (`onBreak`, `lastTapSide/Time`, lógica en `handleDown`); ahora `handleDown` solo registra el lado del puntero. (2) `GameScene.ts` — método `tryBreak()`, campos `breakCdUntilMs`/`trailColor`/`smashCount` (este último se incrementaba pero nunca se leía), wiring `onBreak`, llamadas `hud.setPower()` y el bloque del meter de cooldown en `update()`, import de `POWER_CFG`. (3) `HUD.ts` — `powerIcon`/`powerFill` (ícono 💥 + barra), el rect de track, método `setPower()`, y refs en arrays de visibilidad/destroy. (4) `ObstacleGenerator.ts` — método `breakNext()`. (5) `SoundManager.ts` — método `smash()`. (6) `Constants.ts` — `export POWER_CFG` (queda comentario documentando la baja); comentario de MissionKind actualizado. (7) `InfoScene.ts` — línea de ayuda "SMASH" quitada. **Tests:** borrado `ObstacleGenerator.test.ts` (era exclusivo de `breakNext`); quitadas refs a `Sound.smash()` en `SoundManager.test.ts`. **Verificación:** grep sin referencias vivas (solo comentarios que documentan la remoción), `tsc --noEmit` limpio, `vite build` OK. La verificación en navegador quedó bloqueada por el server de otra sesión activa en el puerto fijo 5188 (no toqué `launch.json` compartido). **Contexto:** el usuario había pedido construir esta feature antes en la misma sesión; confirmó explícitamente la remoción al ver GME-008. **Detectado BUG-005:** `ComboManager.test` quedó rojo por un cambio de `COMBO_TIERS` de otra sesión (no relacionado con esta tarea) — registrado en Bugs Conocidos. |
| 2026-06-26 | Mobile Game Designer | GME-007, REQ-007→REQ-010 | **Revisión de GME-003 (ContinueScene), MON-007 (double-coins UX) y brecha de onboarding.** Hallazgos: (1) ContinueScene funciona pero el countdown ring no tiene urgencia visual para kids → REQ-008; etiqueta del ad desconectada del botón → REQ-009. (2) Double-coins en GameOverScene no tiene microcopy del video → REQ-010. (3) No existe onboarding de ningún tipo — brecha crítica para D1R en kids 6–12 → REQ-007 + GME-007 (P1). Todos los items son de bajo costo de implementación (5–50 líneas). Propuesta de diseño completa en REQ-007 a REQ-010. |
| 2026-06-26 | QA Tech Lead | E2E test suite (Playwright) | Creada infraestructura E2E completa: `playwright.config.ts`, `e2e/helpers.ts` y **8 spec files** con **37 tests** cubriendo boot, navegación de escenas, persistencia localStorage, inicialización de GameScene (CLASSIC/RELAX lives), flujos de Shop (equip/buy/coin-guard), Daily hub (auto-open, claim de streak), ContinueScene (countdown auto-decline, decline manual) y smoke test de sesión completa. Instrucciones de instalación: `npm install && npm run playwright:install`. Scripts: `test:e2e`, `test:e2e:ui`, `test:e2e:debug`. |
| 2026-06-27 | QA Tech Lead | GME-003 SKIP, GME-005/006 DONE, BUG-005 fix, E2E actualizada | **GME-003 → SKIP:** ContinueScene removida (GME-010), feature inexistente, test no aplica. **BUG-005 fix:** `ComboManager.test` rediseñado para derivar expectativas directamente de `COMBO_TIERS` (tabla balance redesigned: tier x40 en at:50, tabla extendida a x350). Ahora auto-valida toda la tabla + monotonía + curva de speedBonus. **91 tests / 12 suites verdes** (de 90/89 previo). **GME-005 (Spin roulette) → DONE:** creado `e2e/spin.spec.ts` (4 tests: free spin primer run, ad-spin corridas subsiguientes, consolation coins todo desbloqueado, GameOver sin crash). **GME-006 (Shop) → DONE:** cubierto por `e2e/shop.spec.ts` (5 tests ya existentes: equip, buy, coin-guard, BACK). **E2E actualizada:** `e2e/continue.spec.ts` ya eliminado por otra sesión; `e2e/spin.spec.ts` agregado. Suite total: **8 spec files / 37 E2E tests** (sin ContinueScene, con Spin). |
| 2026-06-26 | QA Tech Lead | Catálogo de casos de uso | Creado `USE-CASES.md`: inventario único de los 73 casos de uso a testear en 15 dominios (carga, navegación, gameplay, scoring/combo, dificultad, obstáculos, skins, economía/tienda, daily/streak, continue/rewarded, audio, persistencia, backgrounds, observabilidad, no-funcionales). Cada caso mapea su cobertura actual (✅ auto / ⚙️ código / 🧪 manual / ⬜ sin cubrir) al test o ítem de checklist, y tiene una **columna de decisión del PO** (Mantener/Modificar/Quitar) + sección "Casos nuevos" para que el PO dirija el alcance. Incluye brechas de automatización detectadas (DailyManager, Rewarded stub, coins-by-score, countdown 6s son automatizables sin device). Enlazado desde la ÉPICA 11. **Acción requerida del PO:** revisar y marcar decisiones. |
| 2026-06-26 | Dodge Rush Dev | GME-010 + GME-014 (simplificación core loop, DEC-006) | **GME-010 — ContinueScene eliminada.** Borrado `src/scenes/ContinueScene.ts`; removido import + registro en `GameConfig.ts`; en `GameScene.ts` quitados `continueUsed` (campo + reset), `offerContinue()` y `continueRun()`; `loseLife()` ahora va directo a `finishGameOver()` al agotar las 3 vidas (sin pantalla intermedia ni ad). **3 vidas intactas** (GME-009 está SKIP). **GME-014 — Double Coins eliminado.** En `GameOverScene.ts` quitados el botón "▶ DOUBLE COINS", su microcopy, los campos `coinsEarned/coinsDoubled/coinRow/doubleBtn`, y los métodos `renderCoinRow()`/`doubleCoins()`; el coin row ahora es estático (`+N TOTAL …`); removido import de `Rewarded`; RETRY/MENU reposicionados (760/858). En `Rewarded.ts` `RewardPlacement` pasó a `'spin'` (único placement = ruleta post-run; doc actualizado). **Tests:** borrado `e2e/continue.spec.ts` (4 tests, exclusivo de ContinueScene, feature removida); `e2e/gameplay.spec.ts`/`helpers.ts` intactos (solo leen `lives`, que se mantiene). **Verificación:** `tsc` limpio; `vite build` OK; vitest 89/90 (el único rojo es BUG-005, ajeno). En navegador confirmado: `Continue` ya no existe como escena y GameOver no tiene labels DOUBLE/"Watch a short video". Captura con texturas reales bloqueada por throttling del tab de preview (BUG-003) — el boot loop no avanza fiable headless; verificación estructural + funcional completa. **Nota:** la suite E2E queda en 7 spec files / 33 tests (de 8/37). |
| 2026-06-27 | Sound Effects & Music | SND-001 DONE, SND-002 N/A | **9 SFX nuevos, todos procedurales (Web Audio, sin archivos)** en `SoundManager.ts`. Agregado helper `noise()` (white-noise filtrado — antes solo había osciladores, habilita SFX percusivos). **Mejorados:** `hit()` (crash) → 3 capas (ruido filtrado + cuerpo sawtooth descendente + sub-thump), suena a "bonk" cartoon apto kids; `pass()` → swish+ping ascendente. **Nuevos:** `nearMiss()` (whoosh, wireado al near-miss que ya detectaba GameScene sin sonido — ahora `GameScene.handlePass`); `combo(level)` (pitch escala con la racha; reemplaza el `newBest()` reusado en el tier-up); `countdown(n)`; `skinUnlock()` (fanfarria al comprar skin en `ShopScene`, antes era `coin()`); `danger()` (pulso de tensión throttled cuando speed ≥ 82% del máx, en `GameScene.update`); `pause()`/`unpause()` (en `GameScene.pauseGame` + `PauseScene`). **PauseScene:** countdown VISIBLE 3-2-1-GO al despausar (juego congelado durante la cuenta, corre en la escena overlay activa). `coinSpend()` definido pero **sin wirear** (único sink de coins hoy = comprar skins → usa `skinUnlock`; queda listo para un futuro sink no-skin). **Infra:** `.nvmrc`=20 + `engines.node>=20` (este shell defaulteaba a Node v10 y rompía tsc/vite). **SND-002 = N/A:** cero archivos de audio nuevos → nada que cargar/sincronizar; `bgmusic`/`menu` (.mp3+.ogg) intactos; `scripts/sync-web.mjs` no existe en este árbol. **⚠️ Conflictos con otras sesiones:** (1) construí un SFX de "metal roto" para el smash-power → **feature removida (GME-008)**, sonido moot/borrado; (2) wireé el countdown 3-2-1 en `ContinueScene.tick()` → **escena removida (GME-010)**, superado por el countdown de PauseScene. **⚠️ BLOQUEANTE de build (AJENO al audio):** `tsc` falla en `GameOverScene.ts:10` por import `SPIN_CONSOLATION_COINS` sin usar (trabajo de Spin de otra sesión) — mi código de audio está limpio, el único error del build es ése. |
| 2026-06-27 | Sound Effects & Music | BUG-009 (loop seam de música) | **FIX en `SoundManager.ts` (sin archivos nuevos).** **In-game (crossfade):** el ramp lineal causaba un bache de loudness en el punto medio (potencia ≈ suma de cuadrados → ~−3 dB en r=0.5) = el seam "mecánico". Cambiado a **curva equal-power (sin/cos)** → loudness percibido constante; además subí `CROSSFADE_SEC` 0.9→1.8 s para un fundido más suave. **Menú:** sacado del loop por crossfade → ahora reproduce una vez, en `ended` espera `MENU_REST_MS`=5000 ms de silencio y reinicia desde el principio (`armRestLoop()` con listener `ended` + `setTimeout`); `clearMenuRest()` limpia timer+listener al cambiar de pista o en `stopMusic`; el guard de `startDesired` no reinicia durante el rest. El menú usa 1 sola voz (la 2da nunca se toca). **Tests (`SoundManager.test.ts`):** el test de crossfade ahora corre sobre la pista `game` (menu ya no crossfadea) + advance de 2000 ms para el fundido de 1.8 s; nuevo test del rest-loop del menú (no crossfade + reinicia desde 0 en `ended`). **Verificación:** `tsc` limpio, `vite build` OK, SoundManager 13/13 verde, suite completa exit 0. **⚠️ Pendiente:** el bug se reportó desde DEVICE FÍSICO y la mejora del seam es PERCEPTUAL → necesito que QA recompile el APK y valide en device (SND-005) que el seam in-game ya no se escucha y que el respiro de 5 s del menú se siente bien. |
| 2026-06-27 | Dodge Rush Dev | BRN-002 + GME-GD-005 | **BRN-002 (nombre oficial "Dodge Rush" en docs):** `docs/gdd.md` ya estaba en "Dodge Rush" (otra sesión lo actualizó; la premisa "3 ocurrencias en gdd.md" estaba obsoleta). "Fallcade" vivía en otros 3 docs: `launch-strategy.md` (título de checklist → "Dodge Rush") y `visual-art-direction.md` (prosa → "Dodge Rush") reemplazados directo; `aso-naming.md` es el **análisis de nombres candidatos** (Fallcade era una opción evaluada) → NO hice reemplazo ciego: agregué banner "DECISIÓN FINAL: Dodge Rush (DEC-001)", reformulé la sección de recomendación para que el oficial sea Dodge Rush conservando el análisis comparativo como registro histórico, y actualicé los títulos ASO de ejemplo (App/Play Store) a "Dodge Rush". Las "Fallcade" restantes son solo el registro histórico del análisis. Sin cambios de código. **GME-GD-005 ("primer wow"):** en `GameScene.handlePass()`, dentro de la rama de near-miss ya existente, cuando `Profile.totalRuns === 0` y es el primer near-miss del run (flag one-shot `firstWowShown`, reseteado en `create()`): popup "¡CASI!" sobre el jugador + burst de "viento" celeste + `cameras.flash` (whoosh) + `shake` más fuerte que un pase normal. Solo dispara en el run #1; corridas siguientes usan el feedback "CLOSE!" normal. **Build:** destrabé un bloqueante AJENO — quité el import sin usar `SPIN_CONSOLATION_COINS` en `GameOverScene.ts:10` (lo dejó la sesión de Spin; reportado por la sesión de Sound). **Verificación:** `tsc` limpio, **91/91 tests** (BUG-005 ya resuelto por QA), `vite build` OK. La verificación del "¡CASI!" en navegador no es reproducible de forma fiable (requiere perfil nuevo + run #1 + near-miss real; el preview throttlea el game loop, BUG-003) → verificado estáticamente. |
| 2026-06-27 | Dodge Rush Dev | GME-012 + DOC-001 | **GME-012 (high score por modo — DEC-007 Opción B):** la premisa del ticket apuntaba a `ProfileManager`, pero el high score vive en `ScoreManager` (vía `STORAGE_KEYS.HIGH_SCORE`) → lo implementé ahí. (1) `Constants`: nueva key `HIGH_SCORE_RELAX`; CLASSIC conserva la key legacy `HIGH_SCORE` para no perder los récords existentes (se interpretan como classic). (2) `ScoreManager`: `highScoreKey()` resuelve la key según `DifficultyManager.mode.id`; `load()`/`save()` la usan → records independientes por modo. (3) `GameScene`/`HUD`: sin cambios — ya leían `score.high` (ahora por-modo) para `startingHigh`, el HUD y el record-chase. (4) `GameOverScene`: el `BEST` ahora muestra el modo activo (`BEST · CLASSIC/RELAX  N`). Test nuevo en `ScoreManager.test` (classic y relax usan keys distintas, no se pisan). **DOC-001:** cerrado como duplicado de BRN-002 — `docs/gdd.md` ya está 100% en "Dodge Rush". **Verificación:** `tsc` limpio, **92/92 tests**, `vite build` OK. |
| 2026-06-27 | Background Image Design | BG-005 / BUG-008 (skyboxes persisten) | **Mi fix anterior (grade Rectangle→Image) era INCORRECTO — lo reconozco.** **Q1 del PM (¿el fix llegó al APK?): SÍ, verificado.** `app-release.apk` = Jun 27 00:44 > fix 00:42; el `index-*.js` dentro del APK tiene `bg_grade_px` y los 6 `bg_sky_*.png` están en `src/main/assets/web/assets` y en `build/intermediates/assets/release`. El pipeline (vite build → sync:web → assembleRelease) corrió. ⇒ **el grade NO era la causa.** **Re-diagnóstico (descartes con razonamiento):** (a) **tint** — no llamar `setTint` equivale a tint blanco por defecto; el path WebGL es idéntico, así que "el sky no tiene tint" no explica nada. (b) **formato** — skyboxes y nubes son PNG byte-idénticos en encoding (8-bit RGBA, no interlazado, sin ICC). (c) **dimensiones/píxeles** — el spaceship es 540×4800 (2.6M px) y funciona ⇒ no hay tope de tamaño relevante. (d) **oclusión/alpha** — MENOS probable (no descartado del todo): si el `setAlpha` se ignorara en device, el grade (alpha 0.1–0.18) quedaría opaco y taparía el cielo dejando ver nubes+luces (encajaría con el síntoma Y con que mi fix grade→Image no ayudara, porque sigue usando `setAlpha`). PERO los overlays de oscurecimiento de Daily/Info/Shop (`Rectangle` alpha 0.78) se verían casi negros y eso NO se reportó ⇒ el alpha probablemente SÍ se respeta. Un screenshot del device lo confirma de inmediato (menús oscuros = alpha roto; menús OK = el cielo simplemente no se dibuja). **Hipótesis líder (sin confirmar):** fallo silencioso de decode/upload de los `bg_sky_*.png`, que son los archivos MÁS PESADOS (81–200KB) mientras que TODAS las capas que funcionan pesan ≤38KB — un umbral entre 38 y 81KB separaría exactamente sky (falla) de todo lo demás (clase conocida de bug de WebView con imágenes `file://` grandes). **Enviado al bundle (build+sync hechos):** (1) **audit a logcat** en `PreloadScene` — loguea `[DodgeRush:bg-audit]` con `key=WxH` real o `=FB` (fallback) por cada textura de fondo; (2) **self-heal** — si una sky decodifica 0×0 (carga rota sin disparar `loaderror`), regenera el gradiente procedural para que el cielo NUNCA quede en negro. **Cambié de enfoque a propósito: en vez de enviar otro fix a ciegas, instrumenté para CONFIRMAR la causa.** **NECESITO de QA/device (BG-003):** recompilar APK desde el árbol actual y compartir (1) screenshot de gameplay y (2) las líneas de logcat `bg-audit`. Esto decide: si dice `sky_*=FB`/`0x0` → decode-failure confirmado → fix = encoger los `bg_sky_*` a JPEG (~25–43KB, sin banding por ser opacos) — listo para aplicar en <10 min; si dice `sky_*=540x960` real → es GPU-render → investigar pipeline WebGL (p.ej. `maxTextures`/batching, o el swap por `setTexture`). **Nota:** con el self-heal, aunque el decode falle, el próximo build mostrará un cielo en gradiente (zonas aún distinguibles) en vez de negro. `tsc` limpio (Node 20; ⚠️ el Node 16 del shell ya no corre el toolchain tras el bump a TS 5.9). |
| 2026-06-27 | Dodge Rush Dev | GME-015 (vidas por modo + default Relax) | **Implementado via config (sin condicionales nuevos en GameScene, que ya consume `mode.lives`):** `Constants.ts` → `DEFAULT_DIFFICULTY: 'relax'`, `classic.lives: 1` (one-hit; `loseLife()` llega a 0 y va directo a game over, sin invencibilidad), `relax.lives: 3`. `HUD.setLives` oculta corazones cuando `max <= 1` (one-hit no muestra nada). MainMenu sin cambios (ya lee `DifficultyManager.mode` → muestra Relax por el nuevo default). **Decisión vs ticket:** DEC-007 dice "Relax = 3 vidas" pero el ticket anotaba "(comportamiento actual)" siendo que el actual era **5** → seguí la decisión formal (3); si el PO quería 5, es 1 línea. **Tests:** `DifficultyManager.test` actualizado (relax lives derivado de config, no hardcoded 5; + test del nuevo default Relax); `ScoreManager.test` reforzado con `beforeEach` que fija CLASSIC (mis cambios de default rompían 2 tests que asumían la key classic → corregido, ScoreManager 8/8 verde). **Verificación:** `tsc` limpio, `vite build` OK; `ScoreManager`+`DifficultyManager` verdes. **⚠️ Detectado BUG-010 (ajeno):** `Skins.test` tiene 3 fallas por el catálogo de skins de otra sesión (skin `iron` con tint, 3 free skins, orden de costo) + OOM intermitente del worker de Vitest. Registrado en Bugs Conocidos. |
| 2026-06-27 | Dodge Rush Dev | GME-016 (versión visible) | **Sello de versión in-game para QA.** (1) `vite.config.ts`: `import pkg from './package.json'` + `define` que reemplaza `import.meta.env.VITE_APP_VERSION` por `pkg.version` en build (y dev). (2) `src/vite-env.d.ts`: augment de `ImportMetaEnv` con `VITE_APP_VERSION: string` (necesario bajo `strict`). (3) `Constants.ts`: `BUILD_NUMBER = 1` (bump manual, espejo de `versionCode`). (4) `MainMenuScene`: texto `v<version> (build <N>)` abajo-derecha, alpha 0.5, agregado a `uiGroup`. (5) `mobile/README.md`: sección "Version bump protocol" (subir los 3 en lockstep antes de cada build QA/release). **Verificado:** `tsc` + `vite build` OK; el bundle contiene `1.0.0` inyectado y `VITE_APP_VERSION` desaparece (reemplazado); en navegador el menú muestra "v1.0.0 (build 1)" (alpha 0.5, esquina inf-der). De paso, la captura confirmó GME-015 en vivo (toggle muestra "RELAX" por default). |
| 2026-06-27 | Dodge Rush Dev | GME-GD-006 (banners de hito de zona) | **Banner no intrusivo al cruzar umbrales de score.** `Constants.ZONE_MILESTONES` (50/150/300/500 → ¡Las Nubes!/¡Tormenta!/¡Estratosfera!/¡Órbita!). `ScoreManager.pollMilestone()` (idx incremental, 1 vez c/u, rearma en `reset()`); `GameScene.update()` lo llama y dispara `HUD.showZoneBanner()` (título dorado centrado ~30% alto, in/hold/out ~1.5s, auto-destruye). **Decisión:** no existe métrica "metros" → usé el SCORE como distancia; los nombres son los de altitud del ticket (los BG_ZONES reales son atmosféricos, no de altitud, así que "alineado con BG_ZONES" no aplicaba). **Verificación:** `ScoreManager.test` +1 test (cada hito 1 vez, en orden, rearme) → 9/9; `tsc` + `vite build` OK; en navegador `showZoneBanner` crea Text depth 101 centrado y el loop consume los hitos en vivo. **Sin tocar nada de device.** El screenshot del banner en vivo se frustró por el loop (lo anima/destruye o el run termina), pero quedó confirmado por eval + unit test. |
| 2026-06-27 | Dodge Rush Dev | GME-GD-007 (sistema de achievements) | **Nuevo `AchievementManager`** (singleton persistido en `STORAGE_KEYS.ACHIEVEMENTS`): `evaluate()` chequea 5 condiciones contra data existente, desbloquea + concede la skin (`Profile.unlock`) + encola notificación; `takePending()` la drena; `all()` para la UI. Helper nuevo `ScoreManager.bestOverall()` (mejor score cross-modo, para reach_1000m/reach_phase5). Wiring: `GameScene.finishGameOver()` → `evaluate()` tras `recordRun()`; `GameOverScene` drena → toast "🏆 X unlocked!". Nueva `AchievementsScene` (las 5 con preview tinteado + label + ✓/🔒) en `GameConfig`; botón 🏆 top-right en `MainMenuScene`. **Verificación:** `AchievementManager.test` 7/7; `tsc` + `vite build` OK; en navegador pantalla "2/5 unlocked" con estados correctos, previews tinteados (SHADOW/VIOLET desbloqueados con borde dorado, resto con candado), y botón 🏆 presente en el menú. **Sin device.** |

---

## Resumen de Sesiones Activas

| Sesión | Enfoque actual | Items relacionados |
|---|---|---|
| `Product Owner` | PM, backlog, coordinación | Todos |
| `QA Tech Lead` | Plan de pruebas, detección de bugs | QA-001 a QA-008, todos los BUG-* |
| `Obstacle Design` | Nuevos obstáculos | OBS-001 a OBS-005 |
| `Background Image Design` | Mejoras de fondos | BG-001 a BG-004 |
| `Sound Effects & Music` | SFX y música | SND-001 a SND-005 |
| `Character Design` | Arte de personajes | SKN-001 a SKN-006 |
| `Dog character sprite` | Nuevo skin perro | SKN-001, SKN-004, DEC-004 |
