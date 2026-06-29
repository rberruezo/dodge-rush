# Dodge Rush — Catálogo de Casos de Uso a Testear

> **Dueño del documento:** QA Tech Lead · **Decisiones de alcance:** Product Owner
> **Audiencia:** todas las sesiones del proyecto. Es el inventario único de QUÉ se
> testea. Complementa `QA-PLAN.md` (estrategia), `QA-MANUAL-CHECKLIST.md` (guion
> manual) y `BACKLOG.md` (trabajo). Última actualización: 2026-06-26.

---

## Cómo usar este documento

Cada caso de uso lista su **cobertura actual** y una **decisión del PO**. El PO
revisa la columna *Decisión PO* y la marca para dirigir el alcance de QA:

| Decisión PO | Significado |
|---|---|
| `Mantener` | Caso válido, se testea como está (default). |
| `Modificar` | El caso cambia — el PO describe el cambio en *Notas PO*. |
| `Quitar` | Fuera de alcance — no se testea (con justificación en *Notas PO*). |
| `Agregar` | Caso nuevo pedido por el PO → se registra en la sección **Casos nuevos**. |

**Leyenda de cobertura:**

| | Significado |
|---|---|
| ✅ **Auto** | Cubierto por unit test (Vitest). Se referencia el archivo. |
| ⚙️ **Código** | Verificado por inspección de código / contrato (no test dedicado). |
| 🧪 **Manual** | Requiere ojo/oído/device — está en `QA-MANUAL-CHECKLIST.md`. |
| ⬜ **Sin cubrir** | Aún sin verificación. Candidato a automatizar o a checklist. |

**Estado de la suite:** 99 tests / 13 suites verdes (Node ≥20). Lo perceptual
(audio agradable, arte lindo, "feel") y lo que necesita hardware (APK, device,
fresh install) **no es automatizable** y vive en el checklist manual.

---

## Resumen por dominio

| Dominio | Casos | Auto | Manual/Device | Sin cubrir |
|---|---|---|---|---|
| 1. Arranque y carga | 6 | 3 | 2 | 1 |
| 2. Navegación / menú | 4 | 0 | 4 | 0 |
| 3. Gameplay núcleo | 8 | 4 | 4 | 0 |
| 4. Scoring y combo | 4 | 3 | 1 | 0 |
| 5. Dificultad | 4 | 2 | 2 | 0 |
| 6. Obstáculos | 4 | 2 | 2 | 0 |
| 7. Player y skins | 6 | 4 | 2 | 0 |
| 8. Economía y tienda | 6 | 4 | 2 | 0 |
| 9. Daily / streak | 5 | 0 | 2 | 3 |
| 10. Rewarded (Fase 4) | 1 | 0 | 0 | 1 |
| 11. Audio | 5 | 3 | 1 | 1 |
| 12. Persistencia | 4 | 2 | 1 | 1 |
| 13. Backgrounds | 3 | 0 | 3 | 0 |
| 14. Observabilidad | 2 | 1 | 1 | 0 |
| 15. No funcionales | 7 | 0 | 7 | 0 |

---

## 1. Arranque y carga de assets

| ID | Caso de uso | Cobertura | Ref | Pri | Decisión PO | Notas PO |
|---|---|---|---|---|---|---|
| LD-01 | Boot → Preload → MainMenu sin errores | 🧪 | checklist | P1 | `Mantener` | |
| LD-02 | PNG faltante → fallback procedural (juego jugable) | ✅ | `TextureFactory.test` | P1 | `Mantener` | |
| LD-03 | MP3/OGG no carga → `Diagnostics.warn('audio')` y sigue | ✅ | `SoundManager.test`,`Diagnostics.test` | P2 | `Mantener` | |
| LD-04 | Autoplay móvil bloqueado → audio arranca tras primer tap | 🧪 | SND-09 | P2 | `Mantener` | |
| LD-05 | Google Fonts CDN no carga → fallback monospace (1500ms) | ⬜ | SND-004/AND-008 | P2 | `Mantener` | offline en APK |
| LD-06 | Selección de formato de música OGG↔MP3 por soporte | ✅ | `SoundManager.test` | P2 | `Mantener` | |

## 2. Navegación y menú

| ID | Caso de uso | Cobertura | Ref | Pri | Decisión PO | Notas PO |
|---|---|---|---|---|---|---|
| NAV-01 | Menú → PLAY → GameScene | 🧪 | checklist | P1 | `Mantener` | |
| NAV-02 | Menú → Shop / Info / Daily y volver | 🧪 | checklist | P2 | `Mantener` | |
| NAV-03 | HUD de menú muestra best score + coins correctos | 🧪 | (saneo ✅) | P2 | `Mantener` | |
| NAV-04 | Botones con feedback visual + sonido | 🧪 | SND-06 | P3 | `Mantener` | |

## 3. Gameplay núcleo

| ID | Caso de uso | Cobertura | Ref | Pri | Decisión PO | Notas PO |
|---|---|---|---|---|---|---|
| GP-01 | Steering izq/der, clamp a bordes (0.62 px/ms) | 🧪 | GP-01 | P0 | `Mantener` | |
| GP-02 | Vidas por modo: Classic=1 (one-hit), Relax=3 | 🧪 | GP-02 | P0 | `Mantener` | DEC-007 |
| GP-03 | Colisión resta vida; 0 vidas → GameOver | ✅+🧪 | `CollisionSystem.test` | P0 | `Mantener` | |
| GP-04 | Fairness: ningún hueco es inalcanzable | ✅+🧪 | `GapPlanner.test` | P0 | `Mantener` | principio 3 GDD |
| GP-05 | AABB precisa (hitbox 30%×36%, sin ghost/phantom) | ✅ | `CollisionSystem.test` | P0 | `Mantener` | |
| GP-07 | i-frames de gracia tras golpe (~1500ms) | 🧪 | GP-07 | P1 | `Mantener` | |
| GP-09 | Pausa congela estado (posición/score/combo/velocidad) | 🧪 | GP-09 | P1 | `Mantener` | |
| GP-10 | dt clamp anti-teleport tras pérdida de foco | ⚙️+🧪 | `GameScene.ts` | P1 | `Mantener` | |

## 4. Scoring y combo

| ID | Caso de uso | Cobertura | Ref | Pri | Decisión PO | Notas PO |
|---|---|---|---|---|---|---|
| SC-01 | Score = tiempo×pps + bonos (determinista) | ✅ | `ScoreManager.test` | P1 | `Mantener` | |
| SC-02 | New best persiste solo si supera el récord | ✅ | `ScoreManager.test` | P1 | `Mantener` | |
| SC-03 | Coins ganadas proporcionales al score | ⬜ | — | P2 | `Mantener` | |
| SC-04 | Combo x2→x200 por tiers; reset al perder vida | ✅ | `ComboManager.test`,GME-004 | P1 | `Mantener` | |

## 5. Dificultad

| ID | Caso de uso | Cobertura | Ref | Pri | Decisión PO | Notas PO |
|---|---|---|---|---|---|---|
| DIF-01 | Modos Classic/Relax conmutan y persisten | ✅ | `DifficultyManager.test` | P1 | `Mantener` | |
| DIF-02 | Balance objetivo: RELAX más suave, monótono, plateau, fairness floor | ✅ | `DifficultyManager.test` (GME-001) | P1 | `Mantener` | |
| DIF-03 | Balance subjetivo ("¿es divertido?") | 🧪 | GME-001 manual | P1 | `Mantener` | playtest |
| DIF-04 | Rampa de 30s steps sin saltos bruscos | ✅+🧪 | `DifficultyManager.test`,GP-08 | P1 | `Mantener` | |

## 6. Obstáculos

| ID | Caso de uso | Cobertura | Ref | Pri | Decisión PO | Notas PO |
|---|---|---|---|---|---|---|
| OBS-01 | Spawn por peso de los 8 tipos según dificultad | ✅ | `GapPlanner.test` | P1 | `Mantener` | |
| OBS-02 | Reacción legible — "la muerte es culpa del jugador" | ✅+🧪 | `DifficultyManager.test`,OBS-004 | P1 | `Mantener` | |
| OBS-03 | Pool reciclado sin fugas de memoria | 🧪 | NF-02 | P2 | `Mantener` | |
| OBS-04 | Animación de obstáculos (frames `_f1`) | 🧪 | checklist | P3 | `Mantener` | |

## 7. Player y skins

| ID | Caso de uso | Cobertura | Ref | Pri | Decisión PO | Notas PO |
|---|---|---|---|---|---|---|
| SK-STRUCT | Todos los sheets son 720×840 (grid 6×7) — toda pose mapea | ✅ | `Skins.test` (SKN-002) | P1 | `Mantener` | |
| SK-FALLBACK | Cada sheet tiene color de identidad para el fallback | ✅ | `TextureFactory.test` | P2 | `Mantener` | |
| SK-ORIENT | El personaje mira hacia su dirección de viaje | ✅ | `PlayerFacing.test` | P1 | `Mantener` | |
| SK-01/02 | Animaciones idle/move/boost/celebrate se ven fluidas | 🧪 | SK-01..04 | P1 | `Mantener` | perceptual |
| SK-05 | Tint de palette-swaps legible sobre el fondo | 🧪 | SK-05 | P2 | `Mantener` | |
| SK-CAT | Catálogo: ids únicos, costos ascendentes, CLASSIC default | ✅ | `Skins.test` | P2 | `Mantener` | |

## 8. Economía y tienda

| ID | Caso de uso | Cobertura | Ref | Pri | Decisión PO | Notas PO |
|---|---|---|---|---|---|---|
| EC-01 | Comprar skin descuenta coins y lo agrega a owned | ✅ | `ProfileManager` (`buy`) | P1 | `Mantener` | |
| EC-02 | No se puede comprar sin saldo; balance intacto | ✅ | `ProfileManager.test` | P1 | `Mantener` | |
| EC-03 | Anti-tamper: coins/highscore negativos/NaN → 0 | ✅ | `ProfileManager.test`,`ScoreManager.test` | P1 | `Mantener` | |
| EC-04 | Equipar/desequipar skin persiste | ✅+🧪 | `ProfileManager`,GME-006 | P2 | `Mantener` | |
| SHP-01 | ShopScene: comprar, equipar, desequipar (UI) | 🧪 | GME-006 | P2 | `Mantener` | |
| SPN-01 | Ruleta de skins (spin) con coins reales | 🧪 | GME-005 | P2 | `Mantener` | |

## 9. Daily missions y login streak

| ID | Caso de uso | Cobertura | Ref | Pri | Decisión PO | Notas PO |
|---|---|---|---|---|---|---|
| DLY-01 | Login streak incrementa una vez por día | ⬜ | `DailyManager` | P1 | `Mantener` | **automatizable con fecha inyectada** |
| DLY-02 | Claim de recompensa de streak otorga coins | ⬜ | `DailyManager` | P1 | `Mantener` | automatizable |
| DLY-03 | Misiones (3 dificultades): claim → coins / spin | ⬜ | `DailyManager` | P1 | `Mantener` | automatizable |
| DLY-04 | Rotación de misiones por fecha | 🧪 | QA-008 | P2 | `Mantener` | con fecha simulada |
| DLY-05 | Build fresh (sin localStorage) inicializa bien | 🧪 | GME-002 | P1 | `Mantener` | device |

## 10. Rewarded (monetización — Fase 4)

| ID | Caso de uso | Cobertura | Ref | Pri | Decisión PO | Notas PO |
|---|---|---|---|---|---|---|
| MON-01 | `Rewarded.show()` stub resuelve true (placeholder Fase 4) | ⬜ | `Rewarded.ts` | P2 | `Mantener` | automatizable; real = Fase 4. ContinueScene/Double-Coins removidos (DEC-006); único placement = ruleta post-run |

## 11. Audio

| ID | Caso de uso | Cobertura | Ref | Pri | Decisión PO | Notas PO |
|---|---|---|---|---|---|---|
| SND-FUNC | Mute+persistencia, SFX sintetizados, música, crossfade | ✅ | `SoundManager.test` | P1 | `Mantener` | |
| SND-LOOP | Loop de música sin gap ni fade-out (higiene de asset) | ✅ | `AudioAssets.test` | P2 | `Mantener` | |
| SND-PERC | El audio "se escucha bien y agradable" | 🧪 | SND-01..10 | P2 | `Mantener` | perceptual |
| SND-DEVICE | Loop seam aceptable en device (APK) | 🧪 | SND-005 | P2 | `Mantener` | device |
| SND-SWITCH | Crossfade en cambio de track menú↔gameplay | ⬜ | REQ-005 | P3 | `Mantener` | hoy corta seco |

## 12. Persistencia

| ID | Caso de uso | Cobertura | Ref | Pri | Decisión PO | Notas PO |
|---|---|---|---|---|---|---|
| PE-01 | localStorage deshabilitado → defaults, jugable | ⚙️ | catch paths | P1 | `Mantener` | |
| PE-02 | JSON corrupto en skins/ghost → defaults, sin crash | ✅+🧪 | `ProfileManager.test` | P1 | `Mantener` | |
| PE-03 | Sobrevive app kill + restart (persiste) | 🧪 | QA-007 | P1 | `Mantener` | lógica ✅, kill = device |
| PE-04 | Ghost racing graba/reproduce (si la feature sigue) | ⬜ | — | P3 | `Mantener` | confirmar si existe |

## 13. Backgrounds

| ID | Caso de uso | Cobertura | Ref | Pri | Decisión PO | Notas PO |
|---|---|---|---|---|---|---|
| BG-01 | Cross-dissolve entre zonas funciona | 🧪 | BG-003 | P2 | `Mantener` | device |
| BG-02 | Skyboxes renderizan en device Android (BUG-004) | 🧪 | BUG-004 | P1 | `Mantener` | device |
| BG-03 | Parallax de capas a velocidades correctas | 🧪 | BG-004 | P2 | `Mantener` | |

## 14. Observabilidad

| ID | Caso de uso | Cobertura | Ref | Pri | Decisión PO | Notas PO |
|---|---|---|---|---|---|---|
| DIA-01 | Diagnostics registra fallos antes silenciados (buffer + sink) | ✅ | `Diagnostics.test` | P2 | `Mantener` | |
| DIA-02 | Diagnostics captura errores en device | 🧪 | QA-006 | P2 | `Mantener` | device |

## 15. No funcionales

| ID | Caso de uso | Cobertura | Ref | Pri | Decisión PO | Notas PO |
|---|---|---|---|---|---|---|
| NF-01 | 60 FPS sostenido en gama media | 🧪 | NF-01 | P1 | `Mantener` | |
| NF-02 | Sin fugas de memoria (pool reciclado, 10 min) | 🧪 | NF-02 | P1 | `Mantener` | |
| NF-03 | Responsive / portrait (FIT, varios DPI) | 🧪 | NF-03 | P2 | `Mantener` | |
| NF-04 | Rotación de pantalla no rompe layout/input | 🧪 | NF-04 | P2 | `Mantener` | |
| NF-05 | Accesibilidad mínima (contraste, targets ≥44px) | 🧪 | NF-05 | P3 | `Mantener` | |
| NF-06 | Modo offline completo (avión) en device | 🧪 | QA-005 | P1 | `Mantener` | |
| NF-07 | Smoke test del APK en ≥3 devices físicos | 🧪 | QA-003 | P0 | `Mantener` | |

---

## Casos nuevos / cambios pedidos por el PO

> El PO agrega acá los casos a **incluir** (Agregar), o referencia los IDs de
> arriba que marcó **Modificar/Quitar** con la justificación. QA los integra en
> la tabla correspondiente y crea el test o el ítem de checklist.

| ID | Caso de uso propuesto | Tipo (Agregar/Modificar/Quitar) | Pedido por | Notas |
|---|---|---|---|---|
| _(vacío — esperando input del PO)_ | | | | |

---

## Brechas de automatización detectadas por QA

Casos hoy `⬜` o `🧪` que **podrían automatizarse** sin device (candidatos a
próximos tests si el PO los prioriza):

- **DLY-01..04** — `DailyManager` es lógica pura con fecha; inyectando la fecha
  se pueden testear streak, claim, misiones y rotación de forma determinista.
- **MON-01** — el stub `Rewarded.show()` se puede testear (resuelve true).
- **SC-03** — fórmula de coins ganadas por score.

> Lo que **no** se puede automatizar (queda siempre manual): lo perceptual
> (audio agradable, arte lindo, game feel) y lo que necesita hardware real
> (FPS, fugas, APK, fresh install, render de skyboxes en WebView).
