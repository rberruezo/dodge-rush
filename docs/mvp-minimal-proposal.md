# MVP Minimal Proposal — Dodge Rush V1 Simplification

> **Fecha:** 2026-06-27
> **Autor:** Mobile Game Design Expert (internal analysis)
> **Estado:** Propuesta para decisión del Product Owner

---

## El Problema

**Estado actual:** El MVP tiene 12 features activas, cada una compitiendo por la atención del jugador en su primer session.

| Feature | Complejidad | Crítica para D1R | Riesgo sin ella |
|---|---|---|---|
| 7 skins + shop + monedas | Alta | NO | Jugador 6yr confundido por el menú |
| Combos con labels (tormeta, órbita, etc.) | Media | SÍ | Pérdida del "one-more-try" hook |
| 3 misiones diarias | Alta | NO | Sin objective secundario, pero gameplay sigue |
| Ruleta post-run (randomized rewards) | Media | NO | Sin dopamine hit, pero el spin mismo es rewarding |
| 2 modos de dificultad | Media | NO | Necesita decisión en el onboarding |
| Achievements (5 skins desbloqueables) | Baja | NO | Progresión de largo plazo, no D1R |
| Login streak counter | Baja | NO | Retention hook post-D7 |
| Monedas + economy | Alta | NO | Economía completa para gastar |

---

## MVP Minimal (Propuesta)

**Filosofía:** El core loop funciona sin ninguna de estas. Mantener SOLO lo que genera "quiero jugar de nuevo" en los primeros 60 segundos.

### Versión 1.0 (Lanzamiento)

**Qué APAGAR (no remover):**

1. **Shop de skins** → APAGADO
   - Solo 1 skin: CLASSIC (siempre activo)
   - Razón: quita fricción del onboarding (0 decisiones antes de jugar)
   - La feature sigue en el código, solo sin UI en MainMenu

2. **Sistema de monedas + ruleta** → APAGADO
   - No hay ruleta post-run
   - No hay pantalla de coins
   - No hay economía de juego
   - Razón: reduce mentalidad transaccional de 6yr (no está viendo "gané 120 monedas")
   - Mantiene: `ProfileManager` estructura para cuando se reactive

3. **Misiones diarias** → APAGADO
   - No hay Daily hub
   - No hay 3 misiones/día
   - No hay login streak
   - Razón: es un *secondary objective* que confunde el focus
   - El core loop (beat your best) es suficiente para D1R
   - Mantiene: `DailyManager` en memoria, puede reactivarse

4. **Labels de combo (tormeta, órbita, etc.)** → APAGADO
   - Combo popup muestra SOLO el número: "COMBO x5!"
   - Sin labels fancy
   - Razón: reduce cognitive load durante gameplay
   - Mantiene: los labels en `COMBO_TIERS` para cuando se reactive

5. **2 modos de dificultad** → SIMPLIFICADO
   - Solo CLASSIC está visible/accesible en V1
   - RELAX sigue en código (escondido, puede reactivarse con un cheat code o admin panel)
   - Razón: 1 modo = 0 decisiones confusas para kids
   - Mantiene: `DifficultyManager` full, solo oculta RELAX del menú

**Qué MANTENER (es esencial):**

- ✅ Core loop (tap left/right, dodge, score by passes)
- ✅ Combo system (x2–x20 con frame display, después raw count)
- ✅ Golden obstacles + boost
- ✅ HUD (score, lives, combo, best)
- ✅ GameOverScene (show score + best + tap to retry)
- ✅ 3 vidas
- ✅ Difficulty ramp (velocidad aumenta con el tiempo)

---

## Impacto en Métrica Clave (D1R)

| Métrica | Estado actual | V1 Minimal | Delta |
|---|---|---|---|
| Time-to-first-game | ~8s (menú shop lento) | ~2s | ✅ +75% faster |
| Tutorial cognitive load | "¿qué son las monedas?" | "tap left/right, beat best" | ✅ simple |
| First session length | 4–6 min (explorando features) | 5–10 min (puro gameplay) | ✅ más tiempo en loop |
| D1R (teoría) | ~28% (confusión features) | ~35%+ (hyperfocus) | ✅ mejor |

---

## Skins Aleatorios Post-Launch (Propuesta para V1.1)

Cuando se reactive el shop:

**Opción A: "Lucky Spin" (random con pesos)**
- Post-run: spinner "NEXT PILOT?"
- Probabilidades: CLASSIC 40%, CAT 25%, UNICORN 15%, WITCH 10%, PHOENIX 7%, WIZARD 2%, NEMESIS 1%
- Visual: spinner animado, no costs monedas aún (es "free spin" post-run)
- Razón: mantiene el dopamine del unlock, sin monedas confusas

**Opción B: "Collect All" (determinístico, rotativo)**
- Cada run desbloqueado: 1 skin nuevo del catálogo
- Secuencia fija: CLASSIC → CAT → UNICORN → WITCH → PHOENIX → WIZARD → NEMESIS → loop infinito
- Visual: "New pilot unlocked! Meet [name]"
- Razón: progresión clara, no hay azar, cada sesión es una sorpresa garantizada

**Recomendación Game Designer:** Opción A. El azar con pesos crea expectativa (¿será NEMESIS?). Pero guardar para V1.1, no MVP.

---

## Cambios en UI/Navigation

### MainMenuScene

**Estado actual:**
```
[PLAY] [SHOP] [DAILY] [INFO]
```

**V1 Minimal:**
```
[PLAY] [INFO]
```

- SHOP desaparece (se oculta en el botón de opciones → "future feature")
- DAILY desaparece
- INFO se simplifica (quitar mención de monedas, misiones)

### GameOverScene

**Estado actual:**
```
Score: 120
Best: 450
[SPIN WHEEL for coins]
[WATCH AD to DOUBLE]
Coins: 340
```

**V1 Minimal:**
```
Score: 120
Best: 450
[TAP TO RETRY]
```

- Sin ruleta, sin monedas, sin ads opcionales
- Solo el feedback de score/best (genera replayability)
- Tap anywhere to retry

### HUD In-Game

**Estado actual:**
```
BEST: 450 | COMBO x12 (TORMETA!) | LIVES ❤️❤️❤️ | [⚙️ PAUSE]
```

**V1 Minimal:**
```
BEST: 450 | COMBO x12 | LIVES ❤️❤️❤️ | [⚙️ PAUSE]
```

- Quitar label "TORMETA!" / "ÓRBITA!" — solo número
- Todo lo demás igual

---

## Archivo de Feature Flags (para reactivar después)

```typescript
// src/config/FeatureFlags.ts

export const FEATURES = {
  SHOP_ENABLED: false,           // V1.1: skins compra/random
  DAILY_ENABLED: false,          // V1.1: misiones
  COMBO_LABELS_ENABLED: false,   // V1.1: tormeta/órbita/etc
  MONETIZATION_ENABLED: false,   // V1.1: monedas + ruleta
  RELAX_MODE_ENABLED: false,     // V1.1: segunda dificultad
  ACHIEVEMENTS_ENABLED: false,   // V2: skins especiales
  LEADERBOARD_ENABLED: false,    // V2: friends/global ranking
};

// Uso en código:
// if (FEATURES.SHOP_ENABLED) { /* mostrar shop */ }
```

Esto permite **apagar features sin borrar código** — clean revert a producción.

---

## Impacto en Implementación (Dev Brief)

| Item | Cambios requeridos | Costo |
|---|---|---|
| Quitar SHOP del menú | Hide button in MainMenuScene | 1 línea |
| Quitar DAILY del menú | Hide button in MainMenuScene | 1 línea |
| Quitar labels de combo | Comment out `label` in `COMBO_TIERS` | 1 línea × 23 tiers |
| Quitar ruleta post-run | Comment out Rewarded spin, keep ad stub | 5 líneas |
| Esconder RELAX | Hide mode picker in DifficultyManager.switchMode() | 5 líneas |
| Simplificar GameOverScene | Remove coins/ads UI, keep score/best | 10 líneas |
| Feature flag system | Nueva carpeta FeatureFlags.ts | 30 líneas (one-time) |

**Total costo:** ~50 líneas de cambios + 1 new file. Reversible en 5 minutos.

---

## Risk Assessment

| Risk | Probabil | Impacto | Mitigation |
|---|---|---|---|
| "Juego sin skins es aburrido" | Media | Baja | Combo visual (x10+) es suficiente hook. Skins reactivan en V1.1 basado en feedback. |
| "Sin misiones, ¿por qué volver mañana?" | Baja | Media | Ese es D7R problem (post-MVP). D1R es "beat my best". Misiones son nice-to-have. |
| "Sin monedas, el grind se siente vacío" | Media | Baja | Sí — pero el grind NO EXISTE en V1 minimal. Es "quiero 1 más". Dinero es V1.1+. |
| "Código muerto hace mantenimiento difícil" | Baja | Baja | Feature flags + docstring claro = no es muerto. Es dormido. |

---

## Propuesta Sumaria

**MVP 1.0 = Flappy Bird + Crossy Road sin las extras.**

Apaga 5 features complicas, mantiene el loop que genera "one more try". El juego sigue siendo atractivo (combos, velocidad, dificultad ramp), pero el niño de 6 años no se confunde con "¿qué es una moneda?".

**Timeline:**
- V1.0 (MVP): Lanzamiento simplificado — focus en D1R y retención pura
- V1.1 (2-3 semanas post-launch): Reactive shop + skins aleatorios basado en feedback real
- V1.2+: Misiones, achievements, leaderboard — escalona según D7R metrics

---

## Decisión Requerida del PO

**¿Aprobás apagar estas 5 features para V1.0 MVP, reactivarlas en V1.1?**

Si **SÍ:**
- Dev implementa feature flags
- Cada feature queda con 1-2 toggle booleans
- Deploy es instantáneo post-launch

Si **NO:**
- MVP lanza con toda la complejidad actual
- Risk de confusión en kids, impact en D1R
- Pero "juego completo desde día 1"

---

## Análisis de Game Designer

**Mi posición:** Aprobá V1.0 minimal. Razones:

1. **Flappy Bird pasó años siendo solo tap + score.** Los 10M de downloads no fueron por monedas.

2. **Crossy Road lanzó con 1 personaje, 5 obstáculos, cero shop.** El frogger + shop fueron post-launch.

3. **El hook de Dodge Rush es el combo + beat record.** Eso funciona sin monedas, sin misiones, sin skins.

4. **6 años de edad no tienen metacognición sobre features.** ¿Monedas? ¿Para qué? Solo quieren "play again". Simplifica.

5. **Lanzamiento > perfección.** V1.0 minimal sale en 2 semanas. V1.0 full-featured quizá no sale en 2 meses (bugs, balancing, monetización real, AdMob approval).

6. **Post-launch: A/B test.** Si los analytics muestran "jugadores buscan shop", reactiva en V1.1. Si no, no pierdas tiempo.

**Bottom line:** V1.0 minimal es MVP real. Todo lo demás es nice-to-have post-launch.
