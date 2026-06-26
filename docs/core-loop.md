# Dodge Rush — Core Loop Design

> **Propósito de este documento:** definir la mecánica central del juego de forma que sirva como referencia para decisiones de diseño, desarrollo y revisión de features. Cualquier nueva mecánica debe evaluarse contra este documento: si la contradice, necesita justificación fuerte.

---

## La mecánica en una oración

El jugador cae infinitamente. Los obstáculos suben. Cada obstáculo tiene un gap. El jugador toca izquierda o derecha para alinearse con el gap antes de que lo tape.

---

## Principios de diseño del core loop

1. **Sin fricción en el retry.** La muerte debe desencadenar el deseo de reintentar, no la frustración de esperar.
2. **Un solo tipo de input.** Tap izquierda = mover izquierda. Tap derecha = mover derecha. Nada más.
3. **La muerte siempre es culpa del jugador.** Nunca de física imposible ni de latencia de control.
4. **Easy to learn, hard to master.** La mecánica se entiende en 5 segundos; la maestría toma semanas.
5. **Pureza sobre complejidad.** Una mecánica bien ejecutada supera a dos mecánicas mediocres.

---

## Flujo del run (micro loop)

```
INICIO DEL RUN
    │
    ▼
Personaje aparece → la pantalla empieza a moverse INMEDIATAMENTE
                    Sin countdown. Sin animación de intro. Sin tutorial obligatorio.
    │
    ▼
Obstáculos suben con gap visible
    │   Cada obstáculo tiene exactamente un gap (o dos en fases avanzadas)
    │   El gap siempre es alcanzable dado el tiempo disponible
    ▼
El jugador toca izquierda o derecha para alinearse
    │   El piloto se inclina ~15-20° y desliza en ~150ms
    │   El movimiento es inmediato pero tiene micro-momentum (no teleport)
    ▼
[IMPACTO]
    │
    ▼
Animación de muerte: < 0.5 segundos, expresiva, con humor
El piloto sale girando con el propeler doblado
    │
    ▼
Post-run screen:
    ┌─────────────────────────┐
    │         127m            │  ← score del run (grande, central)
    │   ▲ Tu récord: 134m     │  ← comparación inmediata
    │   Obstáculos: 43        │  ← dato secundario
    │                         │
    │  [🎰 GIRAR RULETA]      │  ← rewarded ad (opcional, máx 1 por sesión)
    │       [RETRY]           │  ← botón principal, más prominente
    └─────────────────────────┘
    │
    ▼
Tap RETRY → run reinicia INMEDIATAMENTE
```

**Invariante crítica:** el botón de retry siempre es más prominente que cualquier oferta de monetización.

---

## Control

| Input | Acción |
|---|---|
| Tap mitad izquierda de pantalla | El piloto se mueve hacia la izquierda |
| Tap mitad derecha de pantalla | El piloto se mueve hacia la derecha |

No hay más inputs. No hay hold, no hay swipe, no hay doble tap activo.

### Sensación del movimiento

El tap debe tener respuesta perceptualmente inmediata. El piloto se inclina en la dirección del movimiento (feedback visual de que el input fue registrado) y llega a la posición en ~150ms. No es teleport — hay continuidad visual. No es lento — el jugador nunca siente que el control falló.

---

## Curva de dificultad dentro de un run

La dificultad escala en fases. Cada fase introduce una nueva variable; nunca dos variables nuevas a la vez.

| Fase | Rango | Gap | Velocidad | Tipo de obstáculo |
|---|---|---|---|---|
| 1 | 0–50m | Grande (60-70% del ancho) | Lenta | Estático, centrado |
| 2 | 50–150m | Medio (40-50%) | Media | Estático, posición variable |
| 3 | 150–300m | Angosto (30-40%) | Media-alta | Deslizante (gap se mueve) |
| 4 | 300–500m | Angosto | Alta | 2 obstáculos simultáneos |
| 5 | 500m+ | Angosto/variable | Alta | Combinaciones de tipos |

**Regla de oro:** si el jugador muere, la causa debe ser identificable como un error propio ("me moví tarde", "fui al lado equivocado"). Si la causa es "no había tiempo suficiente" o "fue injusto", el balance está roto.

---

## Tipos de obstáculos

| Tipo | Descripción | Desafío principal | Aparece desde |
|---|---|---|---|
| Estático | Gap fijo | Reacción y alineación | Fase 1 |
| Deslizante | El gap se mueve lentamente | Anticipación de posición futura | Fase 3 |
| Dividido | Dos gaps pequeños | Elegir el gap correcto | Fase 3 |
| Bloqueado | Gap con objeto central (dos sub-gaps) | Precisión extrema | Fase 4 |
| Rápido | Sube más rápido que el ritmo base | Tiempo de reacción reducido | Fase 3 |

---

## Scoring

**Score primario:** metros recorridos (distancia de caída). Simple, universalmente entendible.

**Score secundario:** obstáculos esquivados. Se usa para misiones diarias, no para el score principal del jugador.

**Comparación post-run:** siempre mostrar la diferencia con el récord personal. Si superó el récord, celebrarlo con feedback visual/sonoro especial.

---

## Game feel (juice)

Cada acción del jugador o del juego debe tener feedback perceptible. Estos detalles no cambian la mecánica pero son la diferencia entre "funciona" y "se siente bien".

| Acción | Feedback |
|---|---|
| Tap del jugador | Inclinación del piloto + vibración háptica leve (opcional) |
| Pasar por un gap | Micro "whoosh" + leve trail visual + micro screen shake |
| Cambio de fase | Cambio sutil de color/velocidad de fondo + beat musical |
| Nuevo récord | Flash "¡RÉCORD!" + sonido especial |
| Muerte | Piloto sale girando + sonido cómico corto (< 0.5s) |

---

## Las capas ocultas de profundidad ("hard to master")

Lo que separa a un jugador casual de uno experto, sin que la mecánica cambie:

1. **Anticipación sobre reacción.** Novatos reaccionan cuando el obstáculo ya llegó. Expertos leen el gap 3-4 obstáculos adelante y se pre-posicionan.
2. **Economía de movimiento.** Moverse innecesariamente es peligroso. Los mejores jugadores se mueven lo mínimo necesario.
3. **Reconocimiento de patrones.** Los obstáculos tienen un ritmo subyacente. Con suficiente práctica, el jugador lo lee como música.
4. **Gestión de posición central.** Estar en el centro siempre maximiza las opciones. Los mejores jugadores tratan de volver al centro entre obstáculos.

---

## Loop de sesión

El objetivo de diseño es el "una más". Cada muerte debe generar deseo de reintentar.

```
Run 1: El jugador entiende la mecánica → muere rápido → "¿eso es todo?"
Run 2: Llega notablemente más lejos → "ah, entendí"
Run 3: Muere por un error evitable → "yo sé que puedo más"
Run 4-6: Ronda su récord → tensión real
Run 7: Supera el récord → dopamina
→ AQUÍ aparece la oportunidad del rewarded ad (ver monetización)
Run 8+: El jugador está en "zona"
```

El juego no debe imponer timers, energy systems, ni vidas limitadas. La sesión termina cuando el jugador decide. Siempre.

---

## Decisión de diseño: por qué NO hay mecánica de destruir obstáculos

### El feature removido

Existía una mecánica de doble tap que destruía el obstáculo en pantalla. Se decidió removerla. Esta sección documenta los motivos para que la decisión sea reversible con contexto completo, y para evaluar propuestas similares en el futuro.

### Razones para no incluirla

**1. Rompe la pureza del loop.**
El core loop tiene exactamente una variable bajo control del jugador: dónde está el piloto (izquierda o derecha). Agregar un segundo input (destruir) divide la atención cognitiva en dos dimensiones ortogonales: posicionamiento espacial + gestión de recurso. Esto no suma profundidad al mismo problema; crea un segundo problema diferente. La profundidad del juego viene de dominar el posicionamiento, no de administrar poderes.

**2. Introduce un recurso que inevitablemente se monetiza.**
Cualquier mecánica de "usar para salvar un run" crea presión de monetización. Si el destructor es limitado (N usos por sesión), la monetización obvia es "comprar más usos". Esto transforma la experiencia de un juego de habilidad pura en un juego donde el dinero puede compensar la habilidad. El modelo que queremos (Crossy Road como referencia) funciona específicamente porque no hay ninguna ventaja de gameplay disponible por dinero.

**3. Ambigüedad de input en una mecánica de tap.**
En un juego donde tap izquierda y tap derecha son los únicos inputs, el doble tap introduce ambigüedad. Bajo presión (exactamente cuando se usaría el destructor), la diferencia entre "tap rápido" y "doble tap" es difícil de ejecutar con precisión. Esto genera falsas activaciones o fallas en activar cuando se quería. La frustración resultante es de la peor categoría: no es fallo del jugador ni del obstáculo, es fallo del sistema de control.

**4. Diluye el aprendizaje y la maestría.**
Si el jugador puede destruir obstáculos, los runs largos mezclan habilidad real con uso de poderes. El jugador no sabe si llegó lejos porque mejoró o porque usó el destructor en el momento correcto. Esto oscurece el feedback de progresión, que es uno de los principales motivadores de retención.

**5. Complejidad de balanceo innecesaria.**
¿Cuántos usos por run? ¿Se acumulan entre runs? ¿Se cargan con tiempo o con puntos? ¿Qué pasa si el jugador lo guarda para siempre? Cada respuesta crea nuevos vectores de balance que consumen tiempo de diseño y desarrollo sin mejorar la experiencia core.

### Criterios para reconsiderar en el futuro

Si alguna vez se propone una mecánica de "poder activo" similar, debe cumplir todos estos criterios para ser evaluada:

- [ ] No es obtenible por dinero ni mejora las chances de logros que tienen recompensa económica.
- [ ] No introduce un segundo tipo de input que compita con el input de posicionamiento.
- [ ] No puede compensar la falta de habilidad del jugador de forma que distorsione el scoring.
- [ ] Se puede implementar como skin/efecto cosmético en lugar de ventaja de gameplay (preferible).
- [ ] El juego sin el poder es igual de completo y satisfactorio que con él.

Si un power-up no pasa este checklist, es una feature de monetización disfrazada de feature de gameplay.

---

## Lo que este documento no cubre

- Sistema de progresión y skins → ver `progression-skins.md`
- Misiones diarias → ver `daily-missions.md`
- Monetización detallada → ver `monetization.md`
- Nombre y ASO → ver `aso-naming.md`
