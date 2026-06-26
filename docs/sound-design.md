# Dodge Rush — Sound Design

> **Propósito:** definir el lenguaje sonoro del juego: qué suena, cuándo, cómo, y por qué. El audio es el 50% de la experiencia de juego y el elemento más ignorado en desarrollos indie. Este documento trata el sonido como diseño, no como decoración.

---

## Principio rector

> Cada sonido debe reforzar la mecánica, no documentarla.

Un sonido que dice "pasaste por el gap" es redundante — el jugador ya lo sabe. Un sonido que dice "eso estuvo cerca" cuando pasó por el borde del gap es nuevo y útil. El audio debe agregar información que la imagen sola no da.

El segundo principio: **el jugador no puede fatigarse del audio**. Un juego de arcade casual se juega en loops de 30-90 segundos. Los sonidos se escuchan docenas de veces por sesión. Lo que suena bien la primera vez puede volverse tortura en la décima.

---

## Capa 1: Música

### Música de gameplay

**Objetivo emocional:** adrenalina controlada. El jugador debe sentirse veloz pero no ansioso.

**Especificaciones:**
- BPM: 128–140
- Duración de loop: mínimo 60 segundos (loops cortos se perciben como repetitivos)
- El punto de loop debe ser inaudible — el jugador no debe notar el reinicio
- Estilo: sintetizadores brillantes + beat electrónico limpio (no heavy metal, no ambient)
- Sin letra — la letra distrae la concentración en un juego de reflejos

**Sistema de intensidad adaptativa (opcional pero recomendado):**

El juego tiene fases de dificultad. La música puede reflejarlas sutilmente:

```
Fase 1–2: versión base de la pista (percusión suave, melodía limpia)
Fase 3–4: se suman una capa de bajo o arpegio (más densa, más urgente)
Fase 5+:  versión full con todas las capas (máxima tensión)
```

Implementación técnica: no es un crossfade entre pistas separadas sino capas (stems) que se activan progresivamente. Esto evita cualquier click o salto audible al cambiar de fase.

**Cerca del récord personal (opcional):** cuando el jugador supera el 80% de su récord en un run, se puede agregar un efecto sutil de reverb o filtro en la música que comunique "esto es territorio nuevo." No es obligatorio pero es muy efectivo.

### Música de menú / shop

**Objetivo:** atmosférica, más relajada que el gameplay, que invite a quedarse en el menú sin generar urgencia.

- BPM: 90–110
- Estilo: versión "downtempo" del mismo tema musical del gameplay (misma tonalidad, mismo motivo, diferente arreglo)
- Mantener coherencia tonal con el gameplay — el jugador debe reconocer que es el mismo juego

### Música de victoria (nuevo récord)

Un sting corto (3–5 segundos) que interrumpe la música de gameplay en el momento de death si se rompió el récord. Luego retoma el menú de game over normalmente.

- Carácter: fanfarria breve, ascendente, jubilosa
- No debe sonar como "game over" — es un logro

---

## Capa 2: Sound Effects (SFX)

### Jerarquía de SFX

No todos los sonidos son iguales. Definir jerarquía evita que la mezcla sea un caos:

```
Tier A (siempre presentes, nunca silenciados por otros):
    - Sonido de muerte
    - Sonido de nuevo récord

Tier B (presentes en gameplay normal):
    - Paso por gap
    - Movimiento del piloto (tap)
    - Cambio de fase

Tier C (micro-feedback, pueden omitirse en dispositivos lentos):
    - Trail de velocidad
    - Approaching-gap warning (si se implementa)
```

### Catálogo de SFX

**Tap / movimiento del piloto**
- Suena al registrar el input, no al llegar a destino
- Muy corto (< 100ms), suave
- Carácter: "whoosh" direccional (ligero pitch shift según dirección: izquierda = leve bajada, derecha = leve subida)
- Propósito: confirmar que el input fue registrado

**Paso por un gap (clean pass)**
- Suena cuando el piloto cruza el plano del obstáculo
- Corto (150–200ms), satisfactorio
- Carácter: "swoosh" + micro tono ascendente (una nota de xilofón o campana)
- No debe ser demasiado prominente — se escucha muchas veces

**Paso por un gap (near miss)**
- Solo suena si el piloto pasó a menos del 15% del margen del obstáculo
- Carácter: mismo que "clean pass" pero con un sub-grave suave + leve pitch distorsionado
- Propósito: comunicar "eso estuvo cerca" sin que el jugador haya muerto — crea tensión

**Cambio de fase**
- Suena cuando la velocidad/dificultad sube de fase
- Carácter: un "whomp" de bajo + breve subida de pitch en la música
- Propósito: señalizar al jugador que el juego cambió sin detener la acción

**Muerte (impacto)**
- El sonido más importante del juego — se escucha en cada run
- Carácter: cómico, breve (< 500ms), sin carga emocional negativa
- Debe tener dos partes: el impacto ("bonk" o "crash" suave) + el propeler girando loco (2–3 rotaciones rápidas descendentes en pitch)
- NO debe sonar como "fracaso doloroso" — debe sonar como "ups, otra vez"
- El tono emocional correcto: Wile E. Coyote, no Dark Souls

**Nuevo récord**
- Sting de fanfarria corto (ver Música arriba)
- Acompañado por el SFX de "coins lloviendo" o "confetti"

**Desbloqueo de skin (ruleta)**
- Sonido de ruleta girando (tick-tick-tick acelerando)
- Sonido de reveal al detenerse: diferente según rareza
  - Common: "ding" simple
  - Rare: "ding" + eco
  - Epic: "whomp" + reverb
  - Legendary: fanfarria completa (2-3 segundos)

**Coin recibida**
- El clásico "ding" de moneda — inconfundible, breve
- No tiene que ser original — el sonido de moneda de arcade es universalmente entendido

---

## Capa 3: Feedback háptico

En dispositivos que lo soportan (la mayoría de smartphones modernos), el feedback háptico es una tercera capa de audio no-sonora.

| Evento | Háptico |
|---|---|
| Tap del jugador | Vibración leve (10ms) — confirma input |
| Near miss | Vibración media (30ms) — "eso estuvo cerca" |
| Muerte | Vibración fuerte (100ms) — "impacto" |
| Nuevo récord | Patrón rítmico de 3 pulsos cortos — celebración |

El háptico siempre debe poder desactivarse desde Settings.

---

## Capa 4: Opciones del jugador

El juego debe respetar que muchos jugadores juegan sin sonido (transporte público, reuniones, espacios compartidos). Esto no es un caso edge — es el caso común.

**Settings de audio:**
- Música: ON/OFF (no volumen deslizante — demasiada complejidad para casual)
- SFX: ON/OFF
- Háptico: ON/OFF
- Estos estados persisten entre sesiones

**El juego sin sonido debe funcionar perfectamente.** Toda la información crítica (gap, muerte, récord) debe ser también visual. El audio es una capa de mejora, nunca una capa de información exclusiva.

---

## Producción: referencias de estilo

Para comunicar el estilo a un compositor/sound designer:

| Referencia | Elemento a tomar |
|---|---|
| Geometry Dash | Energía del BPM + coherencia entre música y movimiento |
| Alto's Adventure | Transiciones suaves entre estados (tensión/relajación) |
| Monument Valley | Claridad tonal — pocos sonidos, cada uno inconfundible |
| Crossy Road | Muerte cómica, sin peso emocional negativo |

**Estilo a evitar:** música de "gaming genérico" con drops de dubstep o heavy metal. El juego apunta a kids/families — el audio debe ser enérgico pero no agresivo.

---

## Checklist de audio antes de lanzar

- [ ] Música de gameplay loopea sin click audible
- [ ] Música de menú es reconociblemente el mismo universo que gameplay
- [ ] Sonido de muerte es < 500ms y no tiene carga emocional negativa
- [ ] Near miss tiene sonido diferente al clean pass
- [ ] Todos los SFX testeados en parlantes de teléfono (no solo auriculares)
- [ ] El juego con música OFF y SFX OFF es 100% jugable
- [ ] Háptico desactivable desde Settings
- [ ] Volumen de SFX no aplasta la música en mezcla

---

## Lo que este documento no cubre

- Implementación técnica de audio en Phaser/WebAudio → ver código de `SoundManager.ts`
- Stems adaptativos y cómo cargarlos sin impactar el tiempo de carga → performance concern separado
