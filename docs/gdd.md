# Dodge Rush — Game Design Document

> **Versión:** 1.0 — Junio 2026
> **Estado:** Documento de referencia activo. Cualquier decisión de diseño o implementación que contradiga este documento necesita justificación explícita y actualización del doc correspondiente.

---

## Qué es este juego

**Dodge Rush** es un arcade casual de esquive para mobile (iOS + Android), orientado a kids y familias. El jugador controla un piloto propelado que cae infinitamente. Los obstáculos suben desde abajo con un gap en cada uno. El jugador toca izquierda o derecha para alinearse con el gap. El objetivo es sobrevivir el mayor tiempo posible y mejorar el récord personal.

**Género:** Arcade casual / endless dodge
**Plataformas:** iOS, Android (port React Native / Expo desde base web Phaser)
**Audiencia:** Kids 6–12 + familias, casual gamers adultos
**Monetización:** Rewarded ads (opt-in) + un Starter Pack IAP opcional
**Modelo:** Free to play, sin ventajas de gameplay por dinero

---

## Elevador pitch

> "Flappy Bird meets Crossy Road. Un piloto propelado cae por el cielo esquivando obstáculos. Tap izquierda, tap derecha. Coleccioná 12 pilotos únicos. Sin energy gates, sin ads forzados, sin pay-to-win."

---

## Principios de diseño (no negociables)

Estas reglas aplican a toda decisión de feature, arte, sonido y monetización. Si una propuesta viola alguna, necesita justificación extraordinaria.

1. **Sin fricción en el retry.** La muerte debe generar deseo de reintentar. Nunca frustración de esperar.
2. **Un solo tipo de input.** Tap izquierda = mover izquierda. Tap derecha = mover derecha. Nada más.
3. **La muerte siempre es culpa del jugador.** Nunca de física imposible, latencia o ads.
4. **Ninguna skin da ventaja de gameplay.** Jamás. Sin excepciones.
5. **El jugador que no gasta nunca debe sentirse castigado.** El juego completo es gratuito.
6. **La legibilidad en movimiento supera a la belleza en pausa.** El arte sirve a la mecánica.
7. **El audio refuerza, no documenta.** Cada sonido agrega información que la imagen sola no da.

---

## Índice de documentos

### Diseño de juego

| Documento | Contenido | Estado |
|---|---|---|
| [core-loop.md](core-loop.md) | La mecánica central, curva de dificultad, tipos de obstáculos, scoring, game feel, y la decisión documentada de no incluir mecánicas de poder activo (destruir obstáculos) | ✓ Completo |
| [progression-skins.md](progression-skins.md) | Sistema de monedas, la ruleta de skins, catálogo de 12 pilotos (con justificación de qué se removió y por qué), tiers de rareza, economía del juego, IAP | ✓ Completo |
| [daily-missions.md](daily-missions.md) | Estructura de 3 misiones diarias, pool de objetivos por dificultad, recompensas, reglas de generación, presentación en UI | ✓ Completo |

### Monetización y negocio

| Documento | Contenido | Estado |
|---|---|---|
| [monetization.md](monetization.md) | Mapa completo de monetización, reglas de los rewarded ads, frecuencia, proveedores recomendados (AdMob / Unity Ads), compliance COPPA y GDPR-K, IAP Starter Pack, lista de lo que definitivamente no existe | ✓ Completo |
| [aso-naming.md](aso-naming.md) | Evaluación de nombres candidatos, nombre oficial **Dodge Rush** (DEC-001), estrategia ASO para Play Store, ícono, screenshots, preview video, localización | ✓ Completo |
| [launch-strategy.md](launch-strategy.md) | Plan de pre-lanzamiento, soft launch (mercados, métricas, iteración), criterios para ir global, primer evento post-lanzamiento, budget estimado | ✓ Completo |

### Arte y sonido

| Documento | Contenido | Estado |
|---|---|---|
| [visual-art-direction.md](visual-art-direction.md) | Estilo visual (flat vector, por qué no cambiar), paleta por fases, animación del piloto, diseño de obstáculos, telegrafía visual, background, HUD, tipografía | ✓ Completo |
| [sound-design.md](sound-design.md) | Música de gameplay (BPM, stems adaptativos), música de menú, SFX jerarquizados (tap, gap, near miss, muerte, récord, ruleta), feedback háptico, opciones del jugador | ✓ Completo |
| [skin-process.md](skin-process.md) | Proceso de creación de nuevas skins, consistencia con el DNA visual existente | ✓ Existente |

---

## Arquitectura del juego (referencia rápida)

```
src/
├── config/
│   ├── Skins.ts          → catálogo de skins (SkinDef, SKINS, SKIN_SHEETS)
│   ├── GameConfig.ts     → parámetros globales del juego
│   ├── ObstacleTypes.ts  → tipos de obstáculos
│   └── Constants.ts      → constantes compartidas
│
├── scenes/               → flujo de pantallas
│   ├── BootScene.ts      → carga inicial
│   ├── PreloadScene.ts   → carga de assets
│   ├── MainMenuScene.ts  → menú principal
│   ├── GameScene.ts      → gameplay loop
│   ├── GameOverScene.ts  → post-run (score, récord, ruleta)
│   ├── ShopScene.ts      → catálogo de skins
│   ├── DailyScene.ts     → misiones diarias
│   └── ...
│
├── systems/              → lógica de negocio desacoplada de escenas
│   ├── DifficultyManager.ts  → curva de dificultad y fases
│   ├── ObstacleGenerator.ts  → generación de obstáculos
│   ├── ScoreManager.ts       → score, récord personal
│   ├── ProfileManager.ts     → perfil del jugador, monedas, skins desbloqueadas
│   ├── DailyManager.ts       → misiones diarias, progreso, reset
│   ├── Rewarded.ts           → lógica del rewarded ad y la ruleta
│   └── ...
│
└── objects/              → entidades del juego
    ├── Player.ts         → el piloto, animación, movimiento
    ├── Barrier.ts        → los obstáculos
    └── Background.ts     → backgrounds con paralax
```

---

## El catálogo de pilotos (estado actual)

12 pilotos activos. Los palette swaps removidos del shop son recompensas de achievement.

| ID | Nombre | Tier | Obtención | Trail |
|---|---|---|---|---|
| `classic` | CLASSIC | Free | Siempre disponible | `#46e6ff` |
| `cat` | CAT | Common | Shop (400c) / Ruleta | `#ffa24a` |
| `hound` | OLD HOUND | Common | Shop (460c) / Ruleta | `#d2a06e` |
| `dragon` | DRAGON | Common | Shop (520c) / Ruleta | `#8be07a` |
| `unicorn` | UNICORN | Rare | Shop (600c) / Ruleta | `#8fe6d2` |
| `witch` | WITCH | Rare | Shop (680c) / Ruleta | `#c24dd6` |
| `phoenix` | PHOENIX | Rare | Shop (750c) / Ruleta | `#ff6a3d` |
| `wizard` | WIZARD | Rare | Shop (820c) / Ruleta | `#ffe08a` |
| `frost` | FROST | Epic | Shop (900c) / Ruleta | `#9fe0ff` |
| `ghost` | GHOST | Epic | Shop (1000c) / Ruleta | `#cdd6ff` |
| `king` | GOLD KING | Legendary | Shop (1200c) / Ruleta | `#ffd24a` |
| `nemesis` | NEMESIS | Legendary | Shop (1400c) / Ruleta | `#b24dff` |

**Palette swaps (recompensas de achievement, no en shop):**

| ID | Nombre | Achievement |
|---|---|---|
| `gold` | GOLD | Superar 1000m por primera vez |
| `shadow` | SHADOW | Completar 50 runs en total |
| `aqua` | AQUA | 7 días consecutivos de misiones diarias |
| `violet` | VIOLET | Alcanzar Fase 5 (500m+) |
| `lime` | LIME | Desbloquear todos los pilotos Common |

---

## Métricas de éxito (post-lanzamiento)

| Métrica | Objetivo | Señal de alarma |
|---|---|---|
| Day 1 Retention | ≥ 30% | < 20% |
| Day 7 Retention | ≥ 10% | < 7% |
| Session length | 5–10 min | < 2 min |
| Ad opt-in rate | 20–40% | < 10% |
| Store rating | ≥ 4.2 | < 4.0 |
| Crash rate | < 0.5% | > 1% |

---

## Decisiones de diseño documentadas

Decisiones no obvias que ya fueron tomadas y justificadas. Leer antes de proponer cambios en estas áreas.

| Decisión | Justificación | Documento |
|---|---|---|
| No hay mecánica de destruir obstáculos (double-tap removido) | Rompe la pureza del loop, introduce vector de monetización pay-to-win, genera ambigüedad de input | [core-loop.md → sección "Decisión de diseño"](core-loop.md) |
| Los palette swaps no están en el shop | Diluyen el impacto de unlockear skins con identidad; repropuestos como achievements | [progression-skins.md → "Catálogo de skins"](progression-skins.md) |
| No hay interstitials ni banners | Menor RPM, mayor irritación, daña ratings sin beneficio proporcional | [monetization.md → "Lo que definitivamente NO existe"](monetization.md) |
| No hay energy system ni vidas | Bloquea el retry, el jugador casual abandona antes de volver | [monetization.md](monetization.md) |
| Un solo IAP (Starter Pack $0.99) | Catálogos de IAP múltiples generan parálisis de elección y comunican extracción | [monetization.md → "IAP"](monetization.md) |
| Soft launch en Canadá/Australia antes de US | El algoritmo de store penaliza lanzamientos flojos; no hay segunda oportunidad | [launch-strategy.md → "Fase 2"](launch-strategy.md) |
| No gastar en UA antes de D7R ≥ 10% | Pagar para adquirir usuarios que se van al día 2 es quemar dinero | [launch-strategy.md](launch-strategy.md) |

---

## Qué falta (backlog de diseño)

Features no documentadas aún. No implementar hasta que estén en un doc de esta carpeta.

- [ ] Sistema de leaderboard (weekly friends + global separados)
- [ ] Eventos de temporada (estructura, duración, skins limitadas)
- [ ] Onboarding de primera sesión (cómo enseñar sin tutorial explícito)
- [ ] Notificaciones push (política, frecuencia máxima, opt-in flow)
- [ ] Achievements completos (lista, condiciones, pantalla de logros)
- [ ] Localización (qué strings, qué idiomas, proceso)

---

## Changelog

| Versión | Fecha | Cambios |
|---|---|---|
| 1.0 | Junio 2026 | Documento inicial — GDD completo desde investigación de producto |
