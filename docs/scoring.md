# Dodge Rush — Reglas de Puntuación (estado actual)

> **Propósito:** dejar asentadas las reglas de *scoring* **tal como están implementadas hoy** en el código. Es la fuente de verdad técnica del sistema de puntos; complementa la sección de "Scoring" (nivel diseño) de [`core-loop.md`](./core-loop.md).
>
> **Nota de diseño vs. implementación:** `core-loop.md` describe el score primario como "metros recorridos". En el código, el score primario es **tiempo de supervivencia** (puntos/segundo) más bonos por obstáculo. Esta divergencia está registrada para revisión en el ticket **GME-019** del [`BACKLOG.md`](../BACKLOG.md).
>
> **Última actualización:** 2026-07-01 · **Fuente:** `src/config/Constants.ts` (`SCORE_CFG`, `COMBO_TIERS`, `COMBO_CFG`), `src/systems/ScoreManager.ts`, `src/scenes/GameScene.ts` (`handlePass`).

---

## Resumen en una línea

`score = puntos por tiempo + Σ (por cada obstáculo pasado: base × combo × boost + bonos de riesgo × combo)`

Todo el sistema es **aditivo**: ninguna acción resta puntos. Un gap ancho simplemente no paga bono; nunca penaliza (mantiene Relax accesible).

---

## 1. Puntos por tiempo (supervivencia)

- **`pointsPerSecond: 10`** — se acumulan de forma continua mientras el jugador está vivo.
- Es la base pasiva del score. Es el único componente que no depende de la acción del jugador.

## 2. Puntos por pasar un obstáculo (base)

- **`pointsPerPass: 10`**, multiplicado por el **multiplicador de combo** y por el **multiplicador de boost**.
- Fórmula: `base = pointsPerPass × comboMult × boostMult`.

## 3. Obstáculos Dorados (Golden)

- **`goldenBonus: 250`** puntos instantáneos al enhebrar un obstáculo dorado (se suman crudos, sin combo ni boost).
- Activa el **BOOST dorado**: `goldenBoostMult: 2` durante `goldenBoostMs: 5000` ms.
  - El boost **solo duplica la parte base** de cada pase (§2). **No** duplica los bonos de riesgo (§4–6).
- Los obstáculos dorados **no** otorgan bonos de riesgo (§4–6); pagan su bono fijo y encienden el boost.

## 4. Bono por gap estrecho (Narrow Gap)

- Escala lineal según el ancho del gap elegido:
  - `riskGapWide: 230` px o más → **0** puntos.
  - `riskGapNarrow: 120` px o menos → bono completo **`riskGapBonus: 20`**.
  - Entre medio, interpolación lineal.
- Se multiplica por el **combo**. `ScoreManager.narrowGapBonus(gapWidth, mult)`.
- El popup "TIGHT!" solo aparece cuando el bono supera `riskFeedbackMin: 8`.

## 5. Bono por fork difícil (Hard Gap)

- Algunos obstáculos ofrecen dos pasos: uno **fácil** (ancho/cerca) y uno **difícil** (angosto/lejos). El fácil siempre es alcanzable (contrato de fairness); el difícil paga extra.
- Solo se paga si el jugador tomó el gap **difícil**:
  - Base **`forkChoiceBonus: 35`** con un piso del **60 %** por comprometerse, escalando al **100 %** según la separación entre los dos gaps (`forkSeparationRef: 200` px = escala completa).
- Se multiplica por el **combo**. `ScoreManager.forkBonus(separation, mult)`.
- Feedback: popup "RISKY!" + burst + screen shake.

## 6. Bono por near-miss (Close Call)

- **`nearMissBonus: 15`** puntos extra por pasar con `nearMissMargin: 16` px de holgura o menos (sin chocar).
- Se multiplica por el **combo**.
- Dispara el pose de "startle" del piloto por ~160 ms + sonido `nearMiss`.
- El **primer** near-miss de la **primera** corrida del jugador recibe feedback amplificado ("CLOSE CALL!", flash + shake grandes) — *first-wow* (GME-GD-005).

## 7. Multiplicador de combo

- El combo sube **+1 por cada obstáculo pasado** y **se resetea al perder una vida**.
- El multiplicador por cantidad de pases (`COMBO_TIERS`, high-to-low):

  | Pases (`at`) | Multiplicador | Feedback |
  |---|---|---|
  | 2 | ×2 | badge numerado |
  | 4 | ×3 | badge numerado |
  | 7 | ×5 | badge numerado |
  | 12 | ×10 | badge numerado |
  | 20 | ×20 | badge numerado |
  | 30–90 (cada 10) | ×28 → ×56 | cheer grande (`huge`) |
  | 100–1000 (cada 100) | ×60 → ×350 | cheer épico (`epic`) |
  | > 1000 | generado dinámicamente | — |

- El combo **multiplica** la parte base del pase (§2) y **todos** los bonos de riesgo (§4–6).
- Efecto secundario de game feel: el combo también agrega velocidad de caída (`COMBO_CFG.speedPerMult: 0.012` por paso, tope `speedBonusMax: 0.26`) — no es score, pero eleva el riesgo/recompensa.

---

## Fórmula completa por obstáculo pasado (no dorado)

```
comboMult = multiplicador del combo actual (§7)
boostMult = 2 si el boost dorado está activo, si no 1 (§3)

puntos  = pointsPerPass × comboMult × boostMult          // base (§2)
        + narrowGapBonus(gapWidth) × comboMult           // 0–20 × combo (§4)
        + forkBonus(separation) × comboMult              // 0–35 × combo, si tomó el difícil (§5)
        + (nearMiss ? nearMissBonus × comboMult : 0)     // 15 × combo, si rozó (§6)
```

Para obstáculos dorados: `puntos = pointsPerPass × comboMult × boostMult + goldenBonus`, y se enciende el boost.

---

## Récord (high score)

- El récord se persiste **por modo de dificultad** (DEC-007): `CLASSIC` y `RELAX` tienen registros independientes.
- `ScoreManager.commit()` guarda solo si el run superó el récord del modo activo.

---

## Constantes de referencia (`SCORE_CFG`)

| Constante | Valor | Rol |
|---|---|---|
| `pointsPerSecond` | 10 | score de supervivencia |
| `pointsPerPass` | 10 | base por obstáculo (antes del combo) |
| `goldenBonus` | 250 | puntos instantáneos por dorado |
| `goldenBoostMs` | 5000 | duración del boost dorado (ms) |
| `goldenBoostMult` | 2 | multiplicador de la base durante el boost |
| `nearMissBonus` | 15 | extra (× combo) por pase cerrado |
| `nearMissMargin` | 16 | px de holgura para contar como "close" |
| `riskGapBonus` | 20 | máximo (× combo) por el gap más estrecho |
| `riskGapWide` | 230 | ancho (px) desde el cual no hay bono |
| `riskGapNarrow` | 120 | ancho (px) que paga el bono completo |
| `riskFeedbackMin` | 8 | umbral para mostrar el popup "TIGHT!" |
| `forkChoiceBonus` | 35 | base (× combo) por tomar el gap difícil |
| `forkSeparationRef` | 200 | px entre gaps que da escala completa |
</content>
</invoke>
