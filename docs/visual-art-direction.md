# Dodge Rush — Visual Art Direction

> **Propósito:** definir el lenguaje visual del juego: estilo, paleta, animación, y cómo el arte sirve a la mecánica. El arte no es decoración — es información. Un obstáculo que no se lee bien en 200ms de anticipación es un bug de diseño visual, no estético.

---

## Principio rector

> La legibilidad en movimiento es más importante que la belleza en pausa.

Este es un juego de reflejos. El jugador tiene entre 200ms y 1 segundo para leer el gap de un obstáculo y decidir si mover izquierda o derecha. El arte debe hacer ese proceso instantáneo, no dificultar.

Corolario: si un asset se ve bien en un screenshot pero es confuso mientras el juego está en movimiento, el asset está equivocado.

---

## Universo visual: los pilotos propelados

El juego ya tiene una identidad visual establecida: pilotos con propelador en la espalda, todos usando el mismo uniform base (el `pilot_kit`), diferenciados por personalidad y detalle. Este universo es el activo más valioso del juego y debe guiar todas las decisiones visuales.

**Coherencia del universo:**
- Todos los personajes son variaciones del mismo arquetipo de piloto
- El uniforme base es reconocible en todos (aunque con variaciones de color y accesorios)
- La diferenciación entre skins viene del personaje/criatura del piloto, no de rediseñar el suit
- El propeler es siempre el elemento central — es la identidad del juego

Este es exactamente el modelo de Crossy Road: todos los personajes son versiones del mismo pollo, diferenciados por tema y estética, nunca por diseño fundamental.

---

## Estilo visual

### Flat vector con shading plano (el estilo actual)

El estilo actual de los personajes — flat 2D con shading de pocas capas, colores sólidos con delineado — es el correcto para este juego. No cambiar de estilo.

**Por qué este estilo funciona para Fallcade:**
1. **Legible a cualquier resolución.** Funciona en un iPhone 8 con pantalla pequeña y en un iPad Pro. No hay detalle fino que se pierda.
2. **Escalable para nuevas skins.** Agregar un personaje nuevo no requiere modelado 3D ni animación de rotoscopia.
3. **Rápido de cargar.** Sprites 2D con pocas capas tienen footprint mínimo.
4. **Reconocible en el ícono.** A 60x60px el piloto es reconocible — en 3D low-poly no lo sería.

### Lo que NO cambiar

- No migrar a 3D low-poly (más producción, sin beneficio para la mecánica)
- No agregar pixel art (cambio de estilo demasiado disruptivo con assets existentes)
- No introducir realismo fotográfico (incompatible con la audiencia kids/families)

---

## Paleta de colores

### Paleta del gameplay (lo que el jugador ve mientras juega)

El gameplay necesita una jerarquía visual clara:

```
PRIORIDAD 1 (debe verse siempre):
    El gap del obstáculo — contraste máximo con los bordes del obstáculo

PRIORIDAD 2 (visible pero no compite):
    El piloto — reconocible, con trail de color

PRIORIDAD 3 (fondo, no distrae):
    El background — se mueve lentamente, nunca interfiere con obstáculos
```

**Regla de contraste:** el gap del obstáculo debe tener un ratio de contraste mínimo de 4.5:1 contra el color del obstáculo. Esto no es solo accesibilidad — es legibilidad de mecánica.

### Paleta por fases (progresión de ambiente)

El color del fondo puede comunicar la fase de dificultad sin texto:

| Fase | Cielo | Tono emocional |
|---|---|---|
| 1–2 (fácil) | Azul día, nublado suave | Tranquilidad, aprendizaje |
| 3–4 (medio) | Atardecer, naranja-rosa | Tensión creciente |
| 5+ (difícil) | Noche, azul profundo o aurora | Zona de maestría |

Este gradiente es sutil — el jugador lo percibe inconscientemente como "las cosas se pusieron más intensas" sin leer ningún texto.

El juego ya tiene estos backgrounds en assets: `bg_sky_day`, `bg_sky_dusk`, `bg_sky_sunset`, `bg_sky_night`, `bg_sky_aurora`. Usarlos en este orden según la fase es consistente con lo que ya existe.

### Paleta de obstáculos

Los obstáculos necesitan un esquema de color propio que:
- No se confunda con el fondo
- No se confunda con el piloto
- Haga el gap visualmente obvio

**Propuesta:**
- Cuerpo del obstáculo: color sólido, oscuro, con bordes redondeados leves
- Gap: el color del cielo/fondo se ve "a través" — la apertura es literalmente transparencia
- Borde del gap: un rim light sutil (blanco o color claro) que marca dónde termina el obstáculo y empieza el espacio seguro

Evitar: gradientes en los obstáculos, texturas complejas, colores que cambien según la fase (confunde al jugador que está aprendiendo qué esquivar).

---

## Animación del piloto

### Estados de animación necesarios

| Estado | Descripción | Duración |
|---|---|---|
| Idle/falling | Loop de caída — propeler girando, leve balanceo | Loop infinito |
| Move left | Inclinación + aceleración hacia izquierda | ~150ms |
| Move right | Inclinación + aceleración hacia derecha | ~150ms |
| Near miss | Reacción de susto breve (cabeza que gira, ojos que se abren) | ~200ms |
| Death | Propeler se dobla, piloto sale girando/volando | ~400ms |
| Victory (récord) | Puño en alto, grito de alegría | ~800ms (post-run) |

### Principios de animación

**El propeler siempre gira.** Es el alma visual del personaje. En idle, en movimiento, hasta el momento del impacto (ahí se dobla bruscamente). Si el propeler se detiene, el personaje parece muerto antes de morir.

**El movimiento lateral tiene squash & stretch suave.** Cuando el piloto se mueve a la izquierda, se "estira" levemente en esa dirección en el primer frame y vuelve a la forma normal al llegar. Esto es lo que hace que el movimiento se sienta "vivo" en lugar de mecánico.

**La muerte tiene dos beats:** el impacto (frame de "bonk") y el vuelo (el piloto sale en arco). No es solo desaparecer — hay narrativa en esa animación. Es el equivalente visual del sonido cómico.

---

## El trail del piloto

El trail (estela detrás del piloto) es un elemento de game feel, no decorativo.

**Funciones del trail:**
1. Hace el movimiento del piloto más legible — a alta velocidad, el jugador necesita ver hacia dónde fue el personaje
2. Comunica la skin activa — cada skin tiene su propio color de trail (ya definido en `Skins.ts`)
3. Da sensación de velocidad al fondo estático

**Especificaciones:**
- Duración del trail: 200–300ms de fade-out
- Ancho: delgado al frente, se expande levemente hacia atrás
- Opacidad: comienza en 60%, fade a 0%
- Color: el `trail` definido en `SkinDef` de cada skin

---

## Los obstáculos: diseño visual detallado

### Forma

Los obstáculos son barras horizontales que ocupan todo el ancho de la pantalla excepto el gap. La forma es simple por diseño — cualquier complejidad visual compite con la legibilidad del gap.

**Variaciones visuales según tipo:**

| Tipo de obstáculo | Visual diferenciador |
|---|---|
| Estático | Color base, sin animación |
| Deslizante | El gap tiene un leve "glow" pulsante que comunica "esto se mueve" |
| Dividido | Los dos gaps tienen el mismo glow que el estático pero son más angostos |
| Rápido | Borde del obstáculo con líneas de velocidad (motion blur leve) |

La diferenciación visual entre tipos debe ser **inmediatamente reconocible** — el jugador no tiene tiempo de "leer" el tipo de obstáculo, debe reconocerlo en un frame.

### Telegrafiar antes de que llegue

El obstáculo entra desde el borde inferior de la pantalla y sube. El jugador necesita leer el gap antes de que llegue a la mitad de la pantalla.

**Herramientas de telegrafía:**
1. **Sombra anticipatoria:** una sombra tenue del obstáculo aparece 0.5–1 segundo antes que el obstáculo mismo, mostrando dónde estará el gap. Esto da tiempo al jugador sin hacer el juego fácil.
2. **Indicador de posición del gap:** una flecha o marcador en el borde de la pantalla que señala dónde está el gap del próximo obstáculo. Esto es especialmente útil en las primeras sesiones.

Cualquiera de los dos (o ambos) mejora la experiencia sin reducir la dificultad del juego experto — el experto ya no los necesita y los ignora.

---

## El background

El background tiene dos funciones: crear profundidad y comunicar velocidad. No debe competir con el gameplay.

**Reglas del background:**
- La capa más cercana (nubes, airships) se mueve más rápido que el cielo — paralax
- La velocidad del background NO debe coincidir con la velocidad de los obstáculos — si lo hace, el jugador pierde la referencia de qué es obstáculo y qué es decoración
- A alta velocidad (Fase 4+), el background se puede oscurecer levemente para que los obstáculos tengan más contraste

El juego ya tiene múltiples layers de background: `bg_clouds`, `bg_clouds_far`, `bg_airships`, `bg_spaceship`, etc. El paralax ya está en parte implementado — asegurarse de que las velocidades relativas sean correctas.

---

## UI / HUD durante gameplay

El HUD debe ser mínimo. El jugador necesita toda la pantalla para el juego.

**Durante el run:**
```
┌──────────────────────────────┐
│  🪙 42          [■] 127m     │  ← coins acumulados + distancia actual
│                              │
│                              │  ← gameplay puro
│         (piloto)             │
│                              │
│                              │
└──────────────────────────────┘
```

Solo dos datos: coins acumulados en el run + distancia actual. En el borde superior, tipografía clara, sin fondo sólido (usar text shadow para legibilidad sobre cualquier background).

**Fuera del run (game over, shop, misiones):** puede haber más UI pero mantener el estilo flat/clean del juego.

---

## Tipografía

| Contexto | Estilo | Notas |
|---|---|---|
| Score / HUD | Sans-serif bold, alta legibilidad | "Nunito Bold" o similar — legible a tamaños pequeños |
| Nombres de skins | Todo mayúsculas, tracking amplio | Estilo arcade — ya está en el código como `CLASSIC`, `CAT`, etc. |
| Misiones / UI | Sans-serif medium, no bold | Más legible en textos largos |
| Botones | Todo mayúsculas, bold | Claridad de acción |

Una sola familia tipográfica para todo el juego. No mezclar sans-serif con serif.

---

## Checklist de arte antes de lanzar

- [ ] El gap de todos los tipos de obstáculo es legible a 200ms de anticipación en dispositivo real
- [ ] El piloto es reconocible en el ícono a 60x60px
- [ ] El trail de cada skin tiene su color diferenciado
- [ ] La animación de muerte tiene los dos beats (impacto + vuelo)
- [ ] El background no se confunde con los obstáculos en ninguna fase
- [ ] Los textos del HUD son legibles sobre todos los backgrounds
- [ ] El propeler gira en todos los estados del piloto excepto post-muerte
- [ ] Screenshots capturados en dispositivos reales (no simulador)

---

## Lo que este documento no cubre

- Proceso de creación de nuevas skins → ver `skin-process.md`
- Animaciones de UI (transiciones de escena, modales) → decisión de implementación
- Efectos de partículas específicos → `EffectsLayer.ts`
