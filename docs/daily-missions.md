# Dodge Rush — Misiones Diarias

> **Propósito:** definir la estructura, objetivos, recompensas y reglas de las misiones diarias. Las misiones son el principal mecanismo de retención de Day 2–30: le dan al jugador una razón para abrir el juego todos los días que no depende únicamente de querer jugar.

---

## Principio rector

Las misiones diarias no deben cambiar cómo se juega. Deben ser observaciones del juego que el jugador ya hace, no restricciones que obligan a jugar de una forma específica o frustrante.

> Una buena misión diaria es: "esquivá 100 obstáculos hoy."
> Una mala misión diaria es: "esquivá 100 obstáculos en un solo run sin morir."

La primera se completa en múltiples sesiones. La segunda es una trampa para frustrar al jugador casual y hacerlo abrir el juego otra vez.

---

## Estructura

Tres misiones por día, de dificultad creciente. Se resetean a medianoche (hora local del dispositivo).

```
┌──────────────────────────────────────┐
│  MISIONES DE HOY           [3/3 ✓]  │
│                                      │
│  ✓ Esquivá 50 obstáculos    10 🪙   │
│  ✓ Viajá 200m en total      25 🪙   │
│  ○ Alcanzá 300m en un run   1 spin  │
└──────────────────────────────────────┘
```

| Dificultad | Tipo de objetivo | Recompensa |
|---|---|---|
| Fácil | Acumulativo, completa en 2-3 runs | 10 coins |
| Media | Acumulativo, completa en 5-8 runs | 25 coins |
| Difícil | Por run, requiere skill o persistencia | 1 spin de ruleta gratis |

La misión difícil recompensa con un spin de ruleta extra (adicional al spin post-run). Esto le da valor especial a completar las tres misiones.

---

## Pool de objetivos por dificultad

### Misiones fáciles (acumulativas, completa en una sesión corta)

| Objetivo | Cantidad | Comentario |
|---|---|---|
| Esquivá N obstáculos (total del día) | 50–80 | ~2-3 runs promedio |
| Viajá N metros (total del día) | 100–200m | Muy accesible |
| Completá N runs | 3–5 runs | No importa si muere rápido |
| Recogé N coins en runs | 30–50 | Solo de gameplay, no shop |

### Misiones medias (requieren juego sostenido)

| Objetivo | Cantidad | Comentario |
|---|---|---|
| Esquivá N obstáculos (total del día) | 150–200 | ~6-8 runs promedio |
| Viajá N metros (total del día) | 400–600m | Sesión de 15-20 min |
| Completá N runs | 8–12 runs | Casual activo lo logra |
| Pasá por N gaps tipo deslizante | 20–30 | Introduce variedad de obstáculo |

### Misiones difíciles (por run — requieren skill o consistencia)

| Objetivo | Descripción | Threshold |
|---|---|---|
| Alcanzá X metros en un run | Superar una distancia mínima | 200–400m |
| Pasá por N obstáculos seguidos sin morir | Streak dentro de un run | 30–50 obstacles |
| Llegá a Fase X | Alcanzar la fase de dificultad N | Fase 3 o Fase 4 |
| Viajá N metros sin moverte a la izquierda | Challenge de restricción de input | 50–80m |
| Completá un run sin tocar el borde | No pasar cerca del límite de pantalla | Cualquier distancia |

---

## Reglas de generación de misiones

**Variedad:** ningún par de misiones del mismo día debe usar el mismo tipo de métrica. No puede haber dos misiones de "esquivá obstáculos" el mismo día.

**Escalado por progresión del jugador:** las misiones difíciles se ajustan al récord personal del jugador.
- Si el récord del jugador es 150m, la misión difícil pide 120m (alcanzable pero desafiante).
- Si el récord es 800m, la misión difícil pide 500m (no trivial pero no imposible).
- Esto previene que las misiones sean imposibles para nuevos jugadores o triviales para expertos.

**Sin misiones de "compra algo" o "ve un ad."** Las misiones son siempre de gameplay. Nunca "comprá una skin" ni "mirá 3 ads hoy." Eso convierte las misiones en publicidad disfrazada.

---

## Presentación en la UI

### Acceso

Las misiones son accesibles desde:
- Un botón permanente en el Main Menu (siempre visible)
- Un banner breve post-run si hay misiones pendientes de completar ese día

**No hay notificaciones push automáticas para misiones.** El juego puede preguntar una sola vez al instalar si el jugador quiere recordatorio diario — y debe ser una notificación de "tus misiones de hoy están listas", no "¡te extrañamos! volvé a jugar."

### Progreso en tiempo real

El progreso de misiones se actualiza al finalizar cada run, no durante el run. Esto evita que el jugador divida la atención entre "esquivar obstáculos" y "ver el contador de misión."

### Pantalla de misiones completadas

Cuando las tres misiones del día se completan:
- Animación de celebración breve (no intrusiva)
- Resumen de coins ganados + recordatorio del spin extra si aplica
- La pantalla vuelve sola al menú — no bloquea el juego

---

## Por qué tres misiones y no más

- **Una sola:** insuficiente para crear hábito. El jugador la completa en 2 minutos y no tiene más razón para volver.
- **Tres:** el número óptimo para crear sensación de progresión sin abrumar. Fácil + Media se completan en una sesión normal. Difícil puede requerir volver después.
- **Cinco o más:** fatiga de misiones. El jugador siente que es trabajo, no juego.

---

## Lo que este documento no cubre

- Cómo se almacenan el progreso y el reset en el cliente → ver `ProfileManager.ts`
- Sistema de coins y cómo se suman a la billetera → ver `progression-skins.md`
- Monetización del spin extra de misión difícil → ver `monetization.md`
