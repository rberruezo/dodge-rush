# Dodge Rush — Launch Strategy

> **Propósito:** definir el plan de lanzamiento: qué hacer antes del lanzamiento, cómo ejecutar el soft launch, cuándo ir global, y cómo medir si está funcionando. Un buen juego con un mal lanzamiento desaparece. Un buen lanzamiento amplifica lo que ya funciona.

---

## Principio rector

> Lanzar sin datos es apostar. El soft launch existe para convertir suposiciones en certezas antes de que importe.

La estrategia de lanzamiento tiene tres fases bien diferenciadas: pre-lanzamiento (construir audiencia y pulir), soft launch (validar en mercado real con bajo riesgo), y global launch (escalar lo que funcionó).

---

## Fase 1: Pre-lanzamiento (4–8 semanas antes)

### 1.1 Store listing mínimo viable

Antes de tener jugadores reales, preparar el store listing completo:

- [ ] Título: "Dodge Rush" (nombre oficial — DEC-001)
- [ ] Ícono finalizado
- [ ] 5 screenshots en inglés
- [ ] Preview video de 15-30 segundos
- [ ] Descripción en inglés y español (mínimo)
- [ ] Privacy Policy publicada en URL pública
- [ ] Age rating configurado correctamente en ambos stores

**Por qué antes del lanzamiento:** el App Store puede tardar 24-72 horas en aprobar actualizaciones de metadata. Tener el listing listo evita lanzar con screenshots feos o descripción placeholder.

### 1.2 TestFlight / Play Store Internal Testing

Poner el juego en manos de 20-50 personas reales antes del soft launch.

**Quiénes:** amigos, familia, conocidos del rubro, comunidades de gamedev (r/indiegaming tiene threads de "play my game").

**Qué medir en esta etapa:**
- ¿El jugador entiende la mecánica sin tutorial? (observar la primera sesión)
- ¿El jugador vuelve al menos una vez por cuenta propia? (retención orgánica)
- ¿Hay algún obstáculo que sea percibido como injusto?
- ¿Los sonidos de muerte generan risa o irritación?

No pedir feedback estructurado — observar comportamiento. Lo que el jugador hace importa más que lo que dice.

### 1.3 Presencia mínima en redes (opcional pero recomendado)

No es necesario una campaña de marketing elaborada. Sí es útil:

- **TikTok / Instagram Reels:** clips de 15-30 segundos de gameplay. Los juegos casuales tienen muy buen rendimiento orgánico en TikTok — el algoritmo los distribuye sin gasto de pauta si el contenido engancha.
- **Reddit:** postear en r/indiegaming, r/AndroidGaming, r/iosgaming cuando esté listo el soft launch. Un post honesto de "hice este juego, feedback bienvenido" funciona bien si el juego es genuinamente bueno.
- **No crear cuentas de redes sociales que no se van a mantener.** Una cuenta con 3 posts y luego silencio es peor que no tener cuenta.

### 1.4 Press kit mínimo

Un folder descargable con:
- Ícono en alta resolución (1024x1024)
- 5-8 screenshots
- 30-second gameplay GIF (sin sonido)
- Descripción corta (50 palabras) y larga (150 palabras)
- Nombre y contacto del desarrollador

Publicar en el sitio web o en una página de itch.io. Los reviewers y content creators de YouTube/TikTok buscan esto — si no existe, ignoran el juego.

---

## Fase 2: Soft Launch (4–6 semanas)

### Qué es el soft launch

Lanzamiento real en el App Store y Play Store, pero limitado a uno o dos mercados específicos. Los usuarios reales pueden descargar y jugar. Los datos son reales.

### Mercados recomendados para soft launch

| Mercado | Por qué |
|---|---|
| **Canadá** | Angloparlante, mercado mobile maduro, representativo del comportamiento US, menor competencia que US |
| **Australia** | Mismo perfil que Canadá, zona horaria útil para iterar antes de que despierte el mercado US |
| **Suecia o Dinamarca** | Benchmark de calidad europeo: si funciona en Nórdicos, funciona en Europa |

**Por qué no lanzar directamente en US:** el App Store y Play Store priorizan apps con buen momentum temprano. Si el lanzamiento en US es flojo porque el juego todavía tiene bugs o la monetización no está calibrada, el algoritmo penaliza y recuperar ese posicionamiento es muy difícil.

### Qué validar en el soft launch

**Las 4 métricas críticas:**

```
1. Day 1 Retention (D1R)
   ¿Vuelve el jugador al día siguiente?
   Benchmark saludable para casual arcade: 30–40%
   Señal de alarma: < 20%

2. Day 7 Retention (D7R)
   ¿Sigue jugando después de una semana?
   Benchmark: 10–15%
   Señal de alarma: < 7%

3. Session length promedio
   ¿Cuántos minutos por sesión?
   Objetivo: 5–10 minutos (el "una más" funcionando)
   Señal de alarma: < 2 minutos (el juego no engancha)

4. Ad opt-in rate
   ¿Qué % de jugadores usa la ruleta al menos una vez?
   Objetivo: 20–40%
   Señal de alarma: < 10% (la recompensa no es atractiva)
```

**Herramientas para medir:**
- Firebase Analytics (gratuito, integración directa con Expo)
- GameAnalytics (gratuito hasta cierto volumen, específico para juegos)

### Qué iterar durante el soft launch

El soft launch no es un período de observación pasiva — es un sprint de optimización activa.

**Prioridades de iteración:**

| Si D1R < 20% | Revisar primera sesión — ¿el jugador muere sin entender por qué? ¿El retry es muy lento? |
| Si D7R < 7% | Revisar misiones diarias — ¿son muy difíciles? ¿El juego se vuelve repetitivo en día 3? |
| Si session < 2min | Revisar curva de dificultad temprana — el jugador muere demasiado rápido antes de sentir progresión |
| Si ad opt-in < 10% | Revisar recompensa de la ruleta — ¿las skins son lo suficientemente atractivas? |
| Si rating < 4.0 | Leer reviews de 1-2 estrellas — identificar la queja más frecuente |

**Regla:** no iterar todo a la vez. Cambiar una variable por semana y medir el efecto. Si se cambian tres cosas juntas y el número mejora, no se sabe cuál funcionó.

---

## Fase 3: Global Launch

### Cuándo pasar al global launch

Condiciones mínimas:
- D1R ≥ 30%
- D7R ≥ 10%
- Rating ≥ 4.0 con mínimo 20 reviews
- Cero crashes reportados en los últimos 7 días
- Ad opt-in rate estable y > 15%

Si alguna condición no se cumple, extender el soft launch y seguir iterando. No hay urgencia de ir global — un juego que se lanza globalmente antes de estar listo pierde su oportunidad de manera permanente.

### Cronograma de lanzamiento global

```
Día 0 (Global Launch):
    - Abrir el juego a todos los mercados simultáneamente
    - Postear en r/indiegaming, r/AndroidGaming, r/iosgaming
    - Publicar gameplay clips en TikTok / Instagram
    - Enviar press kit a 10-15 blogs/YouTubers de mobile gaming (lista abajo)

Semana 1:
    - Monitorear ratings diariamente
    - Responder TODAS las reviews negativas con soluciones concretas
    - Tener lista una hotfix build para bugs críticos

Semana 2:
    - Primer análisis de retención con datos reales del mercado global
    - Identificar si algún mercado tiene retención anormalmente baja (puede indicar problema de localización)

Mes 1:
    - Decisión sobre primer evento estacional (si el juego está funcionando)
    - Revisión de pricing del Starter Pack por región
```

### Medios a contactar para el lanzamiento

Blogs y canales con audiencia de mobile gaming casual:

| Medio | Tipo | Audiencia |
|---|---|---|
| TouchArcade | Blog iOS | Hardcore mobile + casual |
| Pocket Gamer | Blog iOS/Android | Casual mobile |
| Droid Gamers | Blog Android | Android casual |
| MobileGamer (YouTube) | Video | Casual mobile |
| r/iosgaming (mod post) | Reddit | iOS casual |
| r/AndroidGaming (mod post) | Reddit | Android casual |

No pedir reviews pagadas. Enviar press kit + código de promo y dejar que decidan. Un review orgánico vale diez veces más que uno pagado en términos de credibilidad y SEO.

---

## Primer evento post-lanzamiento (Mes 1–2)

Si el global launch tiene buen momentum, el primer evento estacional es el segundo pico de atención disponible.

**Timing recomendado:** alinear con una fecha natural (Halloween, navidad, año nuevo) — reduce la necesidad de explicar el evento.

**Estructura mínima del evento:**
```
Duración: 2-3 semanas
Nuevo contenido: 1-2 skins temáticas (no disponibles fuera del evento)
Misiones especiales: 3 misiones diarias con temática del evento
Recompensa por completar todas: skin especial del evento
```

El evento no requiere rediseñar el juego — solo nuevas skins y misiones con texto temático. El costo de producción es bajo; el impacto en retención y prensa es alto.

---

## Budget de lanzamiento (estimado, escala indie)

| Item | Costo estimado | Prioridad |
|---|---|---|
| Apple Developer Account | $99/año | Requerido |
| Google Play Developer Account | $25 única vez | Requerido |
| Diseño de ícono (si se externaliza) | $200–$500 | Alto |
| Música de gameplay (si se contrata) | $300–$800 | Alto |
| SFX pack o compositor | $100–$300 | Medio |
| Herramienta ASO (AppFollow o AppRadar) | $20–$50/mes | Medio |
| Paid UA inicial (TikTok/Meta, opcional) | $200–$500 para test | Bajo (solo si hay datos positivos de soft launch) |

**Total mínimo viable:** ~$500 (cuentas de developer + ícono + algo de música)
**Total recomendado:** ~$1,200–$1,800

No gastar en UA (publicidad pagada) antes de tener D7R ≥ 10%. Pagar para adquirir usuarios que se van al día 2 es quemar dinero. La UA solo tiene sentido cuando el juego ya retiene.

---

## Red flags que justifican posponer el global launch

- Crash rate > 1% en cualquier device popular
- Cualquier review mencionando "ads every 30 seconds" o similar — aunque no sea cierto, indica que la percepción de monetización está rota
- D1R que baja semana a semana durante el soft launch (significa que el juego no tiene "one more run")
- Confusión recurrente con la mecánica en las primeras sesiones (observada en testeo)

---

## Lo que este documento no cubre

- Integración técnica de Firebase Analytics → setup por separado
- Configuración de TestFlight → documentación de Apple
- Estrategia de UA a largo plazo (Meta Ads, TikTok Ads) → separado de la estrategia de lanzamiento
