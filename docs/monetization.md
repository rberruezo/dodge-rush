# Dodge Rush — Monetización

> **Propósito:** definir exactamente cómo, cuándo y dónde aparecen los mecanismos de monetización. Este documento es el contrato de confianza con el jugador. Cualquier cambio que agregue fricciones o reduzca la opcionalidad debe revisarse aquí primero.

---

## Principio rector

> El jugador que elige no gastar nunca debe sentir que el juego lo está castigando o empujando.

El modelo de referencia es Crossy Road al lanzamiento (2014): $1M en 20 días en iOS, 100% de rewarded ads opcionales, cero ventajas de gameplay por dinero. El juego falló en sostener ese modelo post-2020 porque cedió a presión comercial. Este documento existe para que eso no pase aquí.

---

## Mapa completo de monetización

```
FUENTES DE INGRESO
│
├── Rewarded Ads (principal)
│   └── Spin de ruleta post-run (opt-in, máx 1 por sesión)
│   └── Spin extra por completar misión difícil del día
│
└── IAP (secundario, opcional)
    └── Starter Pack único ($0.99 / $1.99)
```

Eso es todo. No hay más vectores de monetización. No hay suscripciones, no hay battle pass, no hay "remove ads" (porque no hay ads invasivos que remover), no hay segunda moneda premium.

---

## Rewarded Ads

### Cuándo aparecen

**Único trigger:** al final de un run, en la pantalla de game over, como botón opcional.

```
Pantalla de game over:
    ┌─────────────────────────────┐
    │          127m               │
    │    ▲ Récord: 134m           │
    │    Obstáculos: 43           │
    │                             │
    │   [🎰 GIRAR RULETA]         │  ← solo si no usó el spin hoy
    │        [RETRY]              │  ← siempre visible, más prominente
    └─────────────────────────────┘
```

**Nunca aparecen:**
- Durante un run
- Al abrir el juego
- Como pop-up entre runs
- Como condición para continuar jugando
- Como reemplazo de una vida perdida ("¡Ve un ad para continuar!" — esto NO existe)

### Frecuencia

- Máximo 1 spin de ruleta por sesión (no por día — si el jugador abre el juego 3 veces, tiene 3 oportunidades, una por sesión)
- Máximo 1 spin extra por completar misiones difíciles del día
- **Tope diario práctico: 2 ads por día por jugador activo.** Esto es sostenible para el jugador y rentable para el juego.

### Lo que el jugador recibe

Cada spin de ruleta resulta en:
- Una skin que no tiene → desbloqueada
- Una skin que ya tiene → 50 coins de consolación

La probabilidad de cada tier es visible antes de girar. No hay "tragamonedas oscuro."

### Proveedores recomendados

Para un juego targeting kids/families en iOS + Android:

| Proveedor | Por qué | Notas |
|---|---|---|
| **Google AdMob** | Más fill rate globalmente, integración sencilla con Expo/RN | Requiere configurar COPPA en consola |
| **Unity Ads** | Fue el proveedor de Crossy Road; eCPMs competitivos para rewarded | Requiere Unity Gaming Services account |
| **IronSource (Unity LevelPlay)** | Mediation entre múltiples redes — maximiza eCPM | Más setup, vale la pena si el juego escala |

**Recomendación para el lanzamiento:** empezar con AdMob solo (menor setup), migrar a mediation (LevelPlay) cuando el juego tenga >1000 DAU.

### eCPMs de referencia (US Q4 2024)

| Formato | eCPM estimado |
|---|---|
| Rewarded video | $16–$20 |
| Interstitial | $5–$15 |
| Banner | $0.20–$1.50 |

Los rewarded ads son el formato más rentable Y el menos invasivo. No hay trade-off.

---

## Compliance legal (kids/families)

Este es el área de mayor riesgo del proyecto. Ignorar COPPA o GDPR-K puede resultar en remoción de los stores.

### COPPA (Estados Unidos)

Aplica si el juego está en la categoría "Kids" del App Store o Play Store, o si recolecta datos de menores de 13 años.

| Requisito | Acción |
|---|---|
| No recolectar datos personales de menores sin consentimiento parental | No pedir email, nombre, ni crear cuentas de usuario para niños |
| Ads dirigidos por comportamiento prohibidos en apps para niños | Usar solo "contextual ads" (no personalizados) para usuarios en categoría Kids |
| Google Family Program: rewarded ads deben ser skippable a los 5 segundos | Configurar el parámetro en AdMob al crear el ad unit |
| No usar pixel tracking de terceros | Revisar SDKs de analytics — Firebase Analytics es compatible si se configura correctamente |

### GDPR-K (Europa)

Similar a COPPA pero aplica a menores de 16 años (varía por país de la UE).

| Requisito | Acción |
|---|---|
| Consentimiento explícito para tracking | Implementar consent flow (CMP) antes de inicializar SDKs de ads |
| Derecho al olvido | El jugador puede borrar su perfil y datos desde Settings |
| No transferencia de datos a terceros sin consentimiento | Limitar qué SDKs se inicializan antes del consentimiento |

### Checklist de compliance antes de lanzar

- [ ] El juego NO está en la categoría "Made for Kids" del Play Store (más restrictiva) salvo que sea la intención explícita
- [ ] AdMob configurado con `tagForChildDirectedTreatment` apropiado
- [ ] Rewarded ads configurados como skippable a los 5 segundos
- [ ] No hay interstitials en el flujo de gameplay
- [ ] Consent Management Platform (CMP) implementado para usuarios de la UE
- [ ] Privacy Policy publicada y linkeada desde el store listing
- [ ] Privacy Policy cubre explícitamente el uso de datos por AdMob/Unity Ads

> **Importante:** este documento no es asesoría legal. Consultar con un profesional antes del lanzamiento en jurisdicciones donde el juego sea clasificado para menores.

---

## IAP — Starter Pack

### Descripción

Un único pack disponible, visible en el Shop, sin urgencia artificial.

```
🎖️ STARTER PACK — $0.99
├── 500 coins
├── 1 skin Rare a elección
└── Badge "Founder" en leaderboard (cosmético)
```

El precio puede variar por región (Price Tier en App Store / Play Store). El equivalente local de $0.99 USD.

### Por qué un solo pack y no múltiples

Los catálogos de IAP con 10 opciones de coins generan parálisis de elección y comunican que el juego es un mecanismo de extracción. Un pack simple comunica: "si querés apoyar el juego, hay una forma de hacerlo."

### Lo que el IAP no puede hacer

- No desbloquea skins exclusivas no disponibles de otra forma
- No da spins adicionales de ruleta
- No da ninguna ventaja de gameplay
- No existe una versión "premium sin ads" (no hay ads invasivos que remover)
- No existe un segundo tier del pack ("VIP", "Pro", etc.)

### Cuándo mostrar el IAP

El botón del Starter Pack aparece en el Shop, siempre disponible. No hay pop-ups promocionales, no hay "¡oferta especial por tiempo limitado!" (excepto quizás en el lanzamiento, con mucha moderación).

---

## Lo que definitivamente NO existe en este juego

Esta lista es tan importante como lo que sí existe. Es el contrato con el jugador que no debe romperse.

| Mecánica | Por qué no |
|---|---|
| Energy system / vidas limitadas | Bloquea el acceso al juego. El player casual abandona antes de volver. |
| "Continuar por X coins/ad" post-muerte | Corrompe la integridad del score. Los mejores runs serían los más comprados, no los más habilidosos. |
| Interstitials entre runs | El formato de menor RPM y mayor irritación. Daña ratings sin justificación económica. |
| Banners en gameplay | Distracción visual en un juego donde la atención importa. RPM ínfimo. |
| Notificaciones push agresivas | "¡Te extrañamos hace 2 días!" → el jugador las desactiva todas y pierde el recordatorio de misiones. |
| Ads en el tutorial | El peor momento posible. El jugador ni siquiera sabe si le gusta el juego. |
| Skins pay-to-win | Inmediatamente destruye la confianza. Un jugador con skin "Epic" no puede ganarle a uno con "Classic" por el skin. |
| Loot boxes con dinero real | Regulación creciente en múltiples países. El spin de ruleta usa ads, no dinero → no es loot box en sentido legal. |

---

## Métricas a monitorear post-lanzamiento

| Métrica | Señal de alerta |
|---|---|
| Ad opt-in rate (% de jugadores que usan la ruleta) | < 15% → la recompensa no es atractiva. > 80% → puede indicar que el juego es percibido como difícil de progresar sin ads |
| Session length promedio | Bajada brusca → algo introdujo fricción |
| Rating en stores | < 4.2 → investigar reviews. Los ads invasivos son la queja #1 en casual games |
| Uninstall rate D1 | > 40% → el onboarding o la primera sesión tiene un problema |
| IAP conversion rate | < 1% es normal para F2P. < 0.3% puede indicar que el pack no tiene valor percibido |

---

## Lo que este documento no cubre

- Integración técnica de AdMob/Unity Ads en Expo/React Native → documentación del proveedor
- Sistema de coins y cómo se acreditan → ver `progression-skins.md`
- La ruleta: animación, probabilidades, UI → ver `progression-skins.md`
