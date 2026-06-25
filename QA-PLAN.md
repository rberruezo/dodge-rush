# Dodge Rush — Plan de QA

> Estrategia de calidad, casos de prueba y hallazgos. Mantener vivo: actualizar
> al añadir mecánicas o sistemas.

## 1. Resumen de la aplicación

- **Qué es:** juego arcade *infinite-faller*, mobile-first, 100% frontend.
- **Stack:** Phaser 3 (runtime **v3.90.0**) + TypeScript (strict) + Vite.
- **Sin backend, sin auth, sin datos sensibles.** Persistencia en `localStorage`
  (claves `dodgerush.*`): `highscore`, `coins`, `muted`, `skins`, `skin`, `ghost`.
- **Actor único:** jugador anónimo.
- **Resolución lógica:** 540×960 (portrait), escalado FIT.

### Flujos / escenas

| Flujo | Escena | Prioridad |
|---|---|---|
| Boot + carga de assets | Boot → Preload | P1 |
| Menú y navegación | MainMenu | P2 |
| **Gameplay (núcleo)** | GameScene | **P0** |
| Pausa / reanudar | Pause | P2 |
| Game Over + recompensas | GameOver | P1 |
| Tienda / skins | Shop | P1 |
| Tutorial scoring | Info | P3 |

## 2. Casos de uso y de prueba

Tipos: **F** funcional · **B** borde · **N** negativo · **NF** no funcional.
Prioridad: P0 (crítico) … P3 (cosmético). ✅ verificado · ⬜ pendiente.

### Gameplay (P0)

| ID | Caso | Tipo | Resultado esperado | Pri | Estado |
|---|---|---|---|---|---|
| GP-01 | Steering izq/der | F | Mueve a 0.62 px/ms, clampado a bordes | P0 | ⬜ |
| GP-02 | Dash evade obstáculo | F | 165px/165ms + 240ms i-frames; no colisiona | P0 | ⬜ |
| GP-03 | Colisión resta vida | F | -1 vida; con 0 → GameOver | P0 | ⬜ |
| GP-04 | **No-muertes-inevitables** | B | Todo gap alcanzable a velocidad máx | P0 | 🟡 contrato cubierto por test de colisión |
| GP-05 | AABB precisa (hitbox 30%×36%) | B | Sin "ghost hits" ni "phantom pass" | P0 | ✅ unit |
| GP-06 | Combo multiplier x2→x200 | F | Escala por tabla; reset al fallar | P1 | ✅ unit |
| GP-07 | i-frames de dash no abusables | N | Respeta cooldown 2600ms | P1 | ⬜ |
| GP-08 | Rampa de dificultad suave | NF | Sin saltos bruscos (steps 30s) | P1 | ⬜ |
| GP-09 | Pausa congela estado | F | Posición/score/combo/velocidad intactos | P1 | ⬜ |
| GP-10 | Pérdida de foco / dt grande | B | dt clampado a 1000/30 → sin teleport | P1 | ✅ código (GameScene.ts:182) |

### Scoring y economía (P1)

| ID | Caso | Tipo | Resultado esperado | Estado |
|---|---|---|---|---|
| SC-01 | Score = tiempo×pps + bonos | F | Determinista y reproducible | ✅ unit |
| SC-02 | New best persiste solo si supera | F | `commit()` true solo en récord real | ✅ unit |
| SC-03 | Coins ganadas = f(score) | F | Proporción correcta, sin redondeo abusivo | ⬜ |
| EC-01 | Comprar skin descuenta coins | F | `coins -= cost`, skin a `owned` | ⬜ |
| EC-02 | No comprar sin saldo | N | Rechazo si `coins < cost`, saldo intacto | ✅ unit |
| EC-03 | **Anti-tamper economía** | N | Coins negativas/NaN → 0; sin crash | ✅ unit + live |
| EC-04 | Equipar skin persiste | F | Aplica sheet+tint+trail al reiniciar | ⬜ |

### Persistencia y resiliencia (P1)

| ID | Caso | Tipo | Resultado esperado | Estado |
|---|---|---|---|---|
| PE-01 | localStorage deshabilitado | N | Defaults silenciosos, jugable | ✅ código |
| PE-02 | JSON corrupto (`skins`/`ghost`) | N | try-catch → defaults, sin pantalla blanca | ✅ live |
| PE-03 | Ghost graba/reproduce | F | Mejor run translúcido y sincronizado | ⬜ |

### Carga / assets / audio (P1–P3)

| ID | Caso | Resultado esperado | Estado |
|---|---|---|---|
| LD-01 | PNG falta → fallback procedural | Juego jugable | ⬜ |
| LD-02 | MP3 no carga | console.warn, juego sigue sin audio | ⬜ |
| LD-03 | Autoplay bloqueado | Audio arranca tras primer tap | ⬜ |
| LD-04 | Google Fonts no carga | Fallback monospace a 1500ms | ⬜ |

### No funcionales

| ID | Caso | Meta | Estado |
|---|---|---|---|
| NF-01 | FPS sostenido | ≥55 FPS p95 en gama media | ⬜ |
| NF-02 | Sin fugas de memoria | Heap estable en run de 10 min | ⬜ |
| NF-03 | Responsive / portrait | FIT correcto en varios DPI | ⬜ |
| NF-04 | Rotación de pantalla | No rompe layout ni input | ⬜ |
| NF-05 | Accesibilidad mínima | Contraste UI, targets ≥44px | ⬜ |

### Fuera de alcance (consciente)
Seguridad backend, auth, datos personales/GDPR → no existen. Único vector
"seguridad" real: tamper de localStorage (EC-03), impacto bajo (juego local).

## 3. Evaluación del estado actual

Verificación en vivo (preview) + revisión de código:

| Área | Veredicto |
|---|---|
| Boot / carga | ✅ menú renderiza, 0 errores de consola |
| Resiliencia JSON corrupto | ✅ defaults sin crash |
| dt clamp (anti-teleport) | ✅ ya implementado (GameScene.ts:182) |
| Coins/highscore negativos | ❌→✅ **bug #3 corregido** este ciclo |

### Hallazgos / backlog (severidad × esfuerzo)

| # | Hallazgo | Tipo | Sev | Esf | Estado |
|---|---|---|---|---|---|
| 1 | Cobertura de tests en sistemas puros | Mejora | Alta | Medio | 🟢 7 suites / 38 tests |
| 2 | Fairness no verificada de forma automatizada | Riesgo | Alta | Medio | ✅ GapPlanner.test.ts valida el generador real |
| 3 | Persistencia sin saneo (negativos/NaN) | Bug | Media | Bajo | ✅ corregido |
| 4 | Sin telemetría/analítica | Mejora | Media | Medio | ⬜ |
| 5 | Generación procedural sin seed determinista | Testabilidad | Media | Medio | ✅ GapPlanner con RNG inyectable |
| 6 | ~~dt grande tras pérdida de foco~~ | — | — | — | ✅ ya mitigado (no era bug) |
| 7 | Errores silenciados (`console.warn`) sin reporte | Observabilidad | Baja | Bajo | ⬜ |
| 8 | `package.json` declara Phaser ^3.80.1 pero corre 3.90.0 | Higiene | Baja | Bajo | ✅ alineado a ^3.90.0 (build + tests verdes) |

## 4. Cómo evaluar mejoras, cambios y fixes

### Testing
- **Framework:** Vitest (integra con Vite). Requiere **Node ≥18**.
- **Comandos:** `npm test` (watch) · `npm run test:run` (CI).
  ⚠️ Si el `npm`/`node` por defecto es antiguo, usar el Node del proyecto
  (p. ej. `nvm use 20`) — Vitest 1.x no corre en Node <18.
- **Pirámide:**
  - *Unit* — sistemas de lógica pura (objetivo ≥80% en `ScoreManager`,
    `ComboManager`, `CollisionSystem`, `DifficultyManager`).
  - *Integración determinista* — con seed fijo, simular N frames y assertar
    estado (habilita el test de fairness GP-04 sobre el generador real).
  - *E2E (Playwright)* — humo de navegación entre escenas, compra de skin,
    persistencia tras reload.

### Definition of Done (por fix/mejora)
- [ ] Test que reproduce el bug (rojo→verde) o cubre la mejora.
- [ ] `npm run test:run` verde + `tsc --noEmit` sin errores.
- [ ] Sin regresión de FPS (NF-01) ni de fairness (GP-04).
- [ ] Probado en 1 móvil real + 1 desktop.
- [ ] Si toca economía/persistencia: verificado con localStorage corrupto.

### Métricas a vigilar
- Cobertura en sistemas críticos (≥80%).
- *Escape rate* (bugs en juego / total).
- *Flakiness* E2E (<2%).
- FPS p95 gama media (≥55).
- (Con #4) tasa de muerte por tipo de obstáculo → detecta dificultad injusta.

### Regresión / CI sugerido
Unit en cada commit (GitHub Actions: `node 20` → `npm ci` → `npm run build` →
`npm run test:run`). E2E de humo antes de release.

## 5. Hecho en este ciclo
- Montado Vitest + mock de `localStorage` (`test/setup.ts`).
- 7 suites, **38 tests** verdes: `ComboManager`, `CollisionSystem`,
  `ScoreManager`, `ProfileManager`, `GapPlanner`, `ObstacleGenerator`
  (smash/`breakNext`), `DifficultyManager` (modos CLASSIC/RELAX).
- Cobertura de las features nuevas del refactor: `breakNext()` rompe la barrera
  no-pasada más cercana y la recicla; modos de dificultad conmutan/persisten y
  RELAX es demostrablemente más suave (velocidad↓, gap↑, spacing↑).
- Cleanup: `ObstacleGenerator` ya no importa Phaser en runtime (solo tipo).
- **Fix bug #3:** saneo de `coins`/`highscore` persistidos (negativos/NaN → 0)
  en `ProfileManager.ts` y `ScoreManager.ts`. Verificado en unit + navegador.
- **#5 + #2:** extraída la matemática de colocación a `GapPlanner.ts` (puro,
  RNG inyectable). `ObstacleGenerator` ahora delega en él. `GapPlanner.test.ts`
  valida el **contrato de fairness real** (gap on-screen, player-sized y
  siempre alcanzable) sobre toda la rampa de dificultad, con RNG sembrado.

> ⚠️ **Pendiente de verificación E2E:** el gameplay no se pudo probar en vivo
> porque `GameScene`/`HUD` están a medio refactorizar (feature "power/smash":
> `hud.setPower`, `POWER_CFG`, y retirada de `Ghost`/`DASH_CFG` en curso). Al
> cerrarse ese trabajo, re-correr los casos GP-01..GP-10 en el navegador.
