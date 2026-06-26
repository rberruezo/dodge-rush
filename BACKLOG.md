# Dodge Rush — Backlog Colaborativo

> **Propietario:** PM Session (`Product Owner`)
> **Actualizado por última vez:** 2026-06-26
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

## Estado General del Proyecto

| Fase | Descripción | Estado |
|---|---|---|
| **Fase 1** | Adicción + polish web (retención, game feel) | ✅ DONE |
| **Fase 2** | Port React Native / Expo + APK offline Android | ✅ DONE |
| **Fase 3** | Google Play publish (closed → open → prod) | 🔴 PENDING |
| **Fase 4** | Monetización real (AdMob rewarded + IAP) | 🔴 PENDING |
| **Fase 5** | Iteración sobre métricas | 🔴 PENDING |

---

## Alerta: Discrepancia de Naming

> ⚠️ **DECISIÓN PENDIENTE** — El GDD (`docs/gdd.md`) llama al juego **"Fallcade"** pero todos los chats, memoria del proyecto y el repo usan **"Dodge Rush"**. Esto necesita resolución antes de publicar en Play Store. Ver item `DEC-001`.

---

## ÉPICA 1 — Nombre y Branding del Juego

| ID | Item | Prioridad | Status | Sesión |
|---|---|---|---|---|
| `BRN-001` | Resolver naming definitivo: "Dodge Rush" vs "Fallcade" | P0 | PENDING | — |
| `BRN-002` | Actualizar GDD si el nombre oficial es "Dodge Rush" | P0 | PENDING | — |
| `BRN-003` | Verificar disponibilidad del nombre en Play Store y App Store | P0 | PENDING | — |
| `BRN-004` | Crear icon final (512×512, adaptive icon, splash screen) | P0 | PENDING | — |

---

## ÉPICA 2 — Arte: Personajes y Skins

Estado actual: **12 skins en el catálogo + 5 achievement skins (palette-swaps)**. Todos los sheets existen en `/public/assets/`.

| ID | Item | Prioridad | Status | Sesión |
|---|---|---|---|---|
| `SKN-001` | Revisar calidad final de `character_hound.png` (sesión Dog character) | P1 | PENDING | Dog character sprite |
| `SKN-002` | Verificar que todos los sheets tengan frames correctos para todas las poses (idle, move, boost, celebrate, dizzy, sad, trophy, crown) | P1 | PENDING | QA Tech Lead |
| `SKN-003` | Side-by-side diff contact sheet de todos los skins vs. original (per `docs/skin-process.md`) | P2 | PENDING | Character Design |
| `SKN-004` | Agregar skin DOG como nuevo personaje (separado de Hound) si la sesión lo decidió así | P2 | PENDING | Dog character sprite |
| `SKN-005` | Validar que el achievement skin GOLD no se confunde visualmente con el GOLD KING (mismo tint) | P2 | PENDING | — |
| `SKN-006` | Revisar que `pilot_kit.py` genere output consistente en todas las plataformas (Python versión) | P3 | PENDING | — |

---

## ÉPICA 3 — Arte: Obstáculos

Obstáculos actuales en código: Straight, Wide, Narrow, Moving, Danger, Broken, Glowing, Golden (8 tipos).

| ID | Item | Prioridad | Status | Sesión |
|---|---|---|---|---|
| `OBS-001` | Definir y documentar nuevos patrones/tipos de obstáculos propuestos | P1 | PENDING | Obstacle Design |
| `OBS-002` | Implementar nuevos tipos de obstáculos en `ObstacleTypes.ts` | P1 | PENDING | Obstacle Design |
| `OBS-003` | Actualizar `obstacles.png` atlas si hay nuevos tiles | P1 | PENDING | Obstacle Design |
| `OBS-004` | Validar que nuevos obstáculos respetan principio 3 del GDD: "la muerte siempre es culpa del jugador" (reacción legible) | P1 | PENDING | QA Tech Lead |
| `OBS-005` | Balance de spawn weights con nuevos tipos (no saturar niveles tempranos) | P2 | PENDING | Obstacle Design |
| `OBS-006` | [DONE 2026-06-26] Auditoría y polish de los 8 tipos existentes (sprites, animación, diferenciación visual) | P2 | DONE | Obstacle Design |

---

## ÉPICA 4 — Arte: Backgrounds

Background actual: "Sky City" con 6 zonas (day/dusk/sunset/twilight/night/aurora) + 5 capas de parallax.

| ID | Item | Prioridad | Status | Sesión |
|---|---|---|---|---|
| `BG-001` | Definir y comunicar qué cambios están en progreso en la sesión Background Image Design | P1 | IN PROGRESS | Background Image Design |
| `BG-002` | Si se agregan nuevas zonas: actualizar `Constants.ts` y `Background.ts` con zone config | P1 | PENDING | — |
| `BG-003` | Verificar que cross-dissolve entre zonas funciona correctamente en device (APK) | P2 | PENDING | QA Tech Lead |
| `BG-004` | Asegurar que layers nuevos siguen la guía de parallax speeds existentes | P2 | PENDING | Background Image Design |

---

## ÉPICA 5 — Audio

Estado actual: `bgmusic.mp3/.ogg` y `menu.mp3/.ogg` funcionando. SFX es Web Audio procedural (sin archivos). Bug de música en Android: RESUELTO (HTML5 Audio con `<audio>` elements).

| ID | Item | Prioridad | Status | Sesión |
|---|---|---|---|---|
| `SND-001` | Documentar qué SFX adicionales están planeados (sesión Sound Effects & Music) | P1 | IN PROGRESS | Sound Effects & Music |
| `SND-002` | Si se agregan archivos de SFX: asegurar que `SoundManager.ts` los carga y `sync-web.mjs` los incluye | P1 | PENDING | Sound Effects & Music |
| `SND-003` | Implementar haptics via `navigator.vibrate` (listado como follow-up en roadmap) | P2 | PENDING | — |
| `SND-004` | Reemplazar Google Fonts CDN con fuentes bundleadas offline (evitar dependency de red en el APK) | P2 | PENDING | — |
| `SND-005` | Verificar que el loop seam del music change (HTML5 Audio vs. buffer crossfade) es aceptable en device | P2 | PENDING | QA Tech Lead |

---

## ÉPICA 6 — Gameplay y Game Feel

| ID | Item | Prioridad | Status | Sesión |
|---|---|---|---|---|
| `GME-001` | Validar que dificultad Classic y Relax están bien balanceadas (curva de 30s steps) | P1 | PENDING | QA Tech Lead |
| `GME-002` | Verificar daily missions y login streak en builds fresh (nuevo device, sin localStorage) | P1 | PENDING | QA Tech Lead |
| `GME-003` | Testear ContinueScene: el timer de 6s auto-declina correctamente | P1 | PENDING | QA Tech Lead |
| `GME-004` | Verificar combo reset en pérdida de vida | P2 | PENDING | QA Tech Lead |
| `GME-005` | Probar la ruleta de skins (spin) fluye correctamente con coins reales | P2 | PENDING | QA Tech Lead |
| `GME-006` | Testear ShopScene: comprar, equipar, desequipar skins | P2 | PENDING | QA Tech Lead |

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
| `IOS-001` | Prebuild y build iOS via EAS (`eas build -p ios`) | P1 | PENDING | — |
| `IOS-002` | Testear en simulador iOS + device real | P1 | PENDING | — |
| `IOS-003` | Verificar audio en iOS (Safari WebView tiene restricciones distintas) | P1 | PENDING | — |
| `IOS-004` | Configurar App Store Connect: crear app, completar ficha | P2 | PENDING | — |
| `IOS-005` | Revisar política de Apple para kids apps (más restrictiva que Google Play Families) | P1 | PENDING | — |

---

## ÉPICA 9 — Monetización (Fase 4)

Estado actual: `Rewarded.ts` es un **stub** que simula éxito. Sin integración real.

| ID | Item | Prioridad | Status | Sesión |
|---|---|---|---|---|
| `MON-001` | Seleccionar e integrar AdMob SDK certificado para Families Policy | P0 | PENDING | — |
| `MON-002` | Reemplazar `Rewarded.ts` stub con implementación real (AdMob rewarded) | P0 | PENDING | — |
| `MON-003` | Configurar ad units: placement Continue + placement Double Coins | P0 | PENDING | — |
| `MON-004` | Verificar que los ads son non-personalized (COPPA compliance) | P0 | PENDING | — |
| `MON-005` | Implementar Starter Pack IAP (opcional, una sola compra) | P1 | PENDING | — |
| `MON-006` | Configurar parental gate para IAP (obligatorio para Families Policy) | P0 | PENDING | — |
| `MON-007` | Testear que el flujo rewarded no bloquea retry (principio 1 del GDD: sin fricción en retry) | P1 | PENDING | QA Tech Lead |

---

## ÉPICA 10 — ASO y Store Listing

| ID | Item | Prioridad | Status | Sesión |
|---|---|---|---|---|
| `ASO-001` | Definir nombre oficial del juego (ver BRN-001) | P0 | PENDING | — |
| `ASO-002` | Redactar descripción corta y larga para Play Store (basarse en `docs/aso-naming.md`) | P0 | PENDING | — |
| `ASO-003` | Crear screenshots de store (al menos 4, portrait) | P0 | PENDING | — |
| `ASO-004` | Crear preview video (15-30s gameplay) | P1 | PENDING | — |
| `ASO-005` | Definir categoría, age rating y tags | P0 | PENDING | — |
| `ASO-006` | Traducir store listing al inglés (mercado principal) | P1 | PENDING | — |

---

## ÉPICA 11 — QA y Testing

| ID | Item | Prioridad | Status | Sesión |
|---|---|---|---|---|
| `QA-001` | Crear plan de pruebas completo (feliz path + edge cases) | P1 | IN PROGRESS | QA Tech Lead |
| `QA-002` | Ejecutar Vitest unit tests (requiere Node 18+, no corre en sandbox Node 16) | P1 | PENDING | QA Tech Lead |
| `QA-003` | Smoke test del APK en al menos 3 devices físicos distintos | P0 | PENDING | QA Tech Lead |
| `QA-004` | Verificar graceful fallback a texturas procedurales cuando assets no cargan | P2 | PENDING | QA Tech Lead |
| `QA-005` | Testear modo offline completo (avión mode en device) | P1 | PENDING | QA Tech Lead |
| `QA-006` | Verificar que Diagnostics.ts captura errores correctamente en device | P2 | PENDING | QA Tech Lead |
| `QA-007` | Validar que `ProfileManager` sobrevive a app kill + restart (localStorage persiste) | P1 | PENDING | QA Tech Lead |
| `QA-008` | Testear daily missions con fecha simulada (verificar rotación) | P2 | PENDING | QA Tech Lead |

---

## ÉPICA 12 — Documentación

| ID | Item | Prioridad | Status | Sesión |
|---|---|---|---|---|
| `DOC-001` | Resolver naming "Fallcade" vs "Dodge Rush" en `docs/gdd.md` | P0 | PENDING | — |
| `DOC-002` | Documentar proceso completo de build APK en `mobile/README.md` (ya parcialmente documentado en memoria) | P1 | PENDING | — |
| `DOC-003` | Crear runbook de release: cómo hacer una release firmada para Play Store | P0 | PENDING | — |
| `DOC-004` | Documentar qué nuevos skins/obstacles se agregaron y actualizar `docs/progression-skins.md` | P2 | PENDING | — |

---

## Bugs Conocidos

| ID | Bug | Severidad | Status | Reportado por |
|---|---|---|---|---|
| `BUG-001` | Gameplay ANR en emulador Android con software GPU (`-gpu swiftshader_indirect`) | LOW | KNOWN | Dodge Rush General |
| `BUG-002` | Loop seam en música al cambiar de menú a gameplay (HTML5 Audio vs. buffer crossfade original) | LOW | KNOWN | Dodge Rush General |
| `BUG-003` | Live preview en web es inconsistente con HMR (tab throttling + concurrent edits) — validar siempre en device | INFO | KNOWN | — |

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

*Agregar con el formato: `REQ-NNN \| descripción \| sesión \| fecha`*

---

## Decisiones Pendientes o Tomadas

| ID | Decisión | Status | Notas |
|---|---|---|---|
| `DEC-001` | Nombre oficial del juego: "Dodge Rush" o "Fallcade" | **PENDIENTE** | GDD dice "Fallcade", todo lo demás dice "Dodge Rush" |
| `DEC-002` | Proveedor de AdMob para Families Policy | PENDIENTE | Debe ser certificado Families. Verificar con Google antes de integrar. |
| `DEC-003` | iOS: lanzar simultáneamente con Android o diferir | PENDIENTE | |
| `DEC-004` | Dog sprite: ¿es un skin adicional nuevo (> 12) o reemplaza a Hound? | PENDIENTE | Sesión "Dog character sprite" en progreso |
| `DEC-005` | Fuentes: reemplazar Google Fonts CDN por fallback monospace o bundle | PENDIENTE | CDN falla en mode avión |

---

## Log de Progreso

*Cada sesión debe agregar una línea aquí cuando completa algo, con fecha.*

| Fecha | Sesión | Item(s) | Notas |
|---|---|---|---|
| 2026-06-25 | Dodge Rush General | Fase 1, Fase 2 completa | APK funcional, música corregida, daily missions, dificultad Relax/Classic |
| 2026-06-26 | Product Owner | Creación de este backlog | Relevamiento completo del código y sesiones activas |
| 2026-06-26 | Obstacle Design | OBS-006 (auditoría existentes) | **Lo que se hizo:** (1) Eliminados `orange_block` e `ice_block` de `OBSTACLE_FRAMES` y `build-obstacles.py` — eran tiles sin ObstacleType asignado (assets huérfanos). Sus pixels siguen en el atlas PNG pero no se registran ni usan. (2) Verificado que el escalado vertical (atlas 50px → bandHeight 88px) es uniforme en ambos ejes — sin distorsión. (3) Verificado que `purple_pillar` se tilea correctamente como barra horizontal. (4) `blue_tile` (Glowing) diferenciado de `blue_bar` (Straight): fill cambiado a violeta `0x7722ee`, glow pulse a `0x9933ff`. (5) Sistema de animación de sprites implementado: `ObstacleTypeDef` extendido con `animFrames`/`animMs`, `OBSTACLE_ANIM_FRAMES` en Constants.ts, registro de frames `_f1` en TextureFactory, ciclo de frames en `Barrier.advance()`. (6) Atlas extendido a 545×92 con row 1 de animación: `red_arrow_f1` (shift 2px right, 150ms), `red_spike_f1` (shift 2px up, 400ms), `gold_block_f1` (shift 1px diagonal, 600ms). (7) Fill colors documentados en `ObstacleTypes.ts`. (8) `build-obstacles.py` preparado para fuente 2048 (instrucciones en el script). **Lo que NO se hizo:** OBS-001 (nuevos tipos) — ver nota abajo. |

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
