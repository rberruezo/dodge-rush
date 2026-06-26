# Dodge Rush — Sistema de Progresión y Skins

> **Propósito:** definir cómo el jugador avanza, cómo gana y gasta monedas, cómo desbloquea skins, y qué skins tiene sentido mantener. Este documento es la fuente de verdad para el diseño del shop, el sistema de coins, y el catálogo de personajes.

---

## Principio rector

> Ninguna skin da ventaja de gameplay. Ningún skin es necesario para disfrutar el juego completo. Cada skin es una recompensa de identidad, no de poder.

El modelo de referencia es Crossy Road al lanzamiento: el jugador puede ignorar absolutamente todo el sistema de skins y tener la experiencia completa. Las skins son el "coleccionable" que le da identidad al jugador y sostiene la monetización sin corromperla.

---

## Monedas (coins)

Las monedas son la única moneda del juego. Se ganan jugando. Se gastan en skins. No hay una segunda moneda premium.

### Cómo se ganan

| Fuente | Cantidad | Notas |
|---|---|---|
| Por run (distancia) | 1 coin cada 10m | Proporcional al skill — mejor jugador, más coins |
| Misión diaria fácil | 10 coins | Ver daily-missions.md |
| Misión diaria media | 25 coins | Ver daily-missions.md |
| Misión diaria difícil | 50 coins | Ver daily-missions.md |
| Rewarded ad (opcional) | Spin de ruleta | No coins directos — ver sección Ruleta |

### Lo que NO existe
- Coins por ver ads directamente (evita que el jugador vea ads sin querer nada)
- Coins comprados con dinero real (evita pay-to-win en colección)
- Coins que se pierden o expiran

---

## La Ruleta (rewarded ad)

La ruleta es el único lugar donde los rewarded ads aparecen. Siempre es opt-in.

```
Fin de un run → pantalla de game over
    │
    ├── [si el jugador NO usó la ruleta hoy]
    │       Aparece botón "🎰 GIRAR RULETA"
    │       El jugador puede ignorarlo completamente
    │       Si lo toca → ve un rewarded ad (15-30 seg)
    │       Al terminar → animación de ruleta → revela una skin
    │           Si ya la tiene: recibe 50 coins de consolación
    │           Si no la tiene: la desbloquea
    │
    └── [si ya usó la ruleta hoy]
            El botón no aparece
            El jugador no es recordado ni notificado
```

**Reglas de la ruleta:**
- Máximo 1 spin por sesión de juego (no por día — por sesión). Esto crea escasez real sin frustrar.
- La probabilidad de cada skin es visible antes de girar (transparencia).
- Las skins Legendary tienen menor probabilidad pero se pueden obtener.
- El jugador nunca puede comprar spins adicionales con dinero real.

**Por qué este diseño:**
Es el patrón exacto de Crossy Road al lanzamiento (verificado). El ad aparece como una oportunidad efímera vinculada a una recompensa visible, no como una interrupción. El jugador lo experimenta como "elegí ver el ad" en lugar de "me forzaron el ad".

---

## Compra directa de skins (coins)

Además de la ruleta, el jugador puede comprar cualquier skin directamente con coins en el shop.

La ventaja sobre la ruleta: elección determinista. El jugador elige exactamente qué skin quiere y ahorra para ella.
La desventaja: tarda más que tener suerte en la ruleta.

Esto da dos caminos de progresión paralelos:
- **Casual:** juega, gira ruleta, va acumulando skins al azar
- **Coleccionista:** juega para acumular coins y compra exactamente lo que quiere

Ambos son válidos. Ninguno requiere dinero real.

---

## Catálogo de skins: qué mantener y qué remover

### Estado actual: 17 skins

El catálogo actual tiene un problema estructural: **Tier 1 son 5 skins de relleno** (aqua, lime, violet, gold, shadow). Son el mismo sheet `character` con un filtro de color diferente. No tienen personalidad, nombre con historia, ni identidad visual propia. Su única función es inflar el número de skins disponibles.

Este antipatrón tiene costos reales:
1. **Diluye el impacto de unlockear algo.** Si el jugador gira la ruleta y obtiene "AQUA" (el mismo personaje en celeste), la experiencia es "meh". Eso daña la mecánica central de recompensa.
2. **Hace el shop visualmente aburrido.** Una grilla con 5 versiones del mismo personaje comunica "esto está relleno".
3. **Confunde al jugador nuevo.** ¿Por qué hay 5 versiones del mismo personaje? ¿Cuál es el "real"?
4. **No tiene historia ni identidad.** Las skins que generan apego tienen nombre y personalidad: "PHOENIX", "GOLD KING", "NEMESIS". "LIME" y "AQUA" no tienen eso.

### Recomendación: eliminar Tier 1 palette swaps

**Skins a remover del catálogo principal:**
- `aqua` — repintado celeste del base
- `lime` — repintado verde del base
- `violet` — repintado violeta del base
- `gold` — repintado dorado del base
- `shadow` — repintado gris del base

**Skins a mantener (12 skins con identidad real):**

| ID | Nombre | Tier | Por qué mantener |
|---|---|---|---|
| `classic` | CLASSIC | Gratis | El piloto base. Identidad del juego. |
| `cat` | CAT | Common | Primer personaje temático. Accesible. |
| `hound` | OLD HOUND | Common | Personalidad clara. Diferente del cat. |
| `dragon` | DRAGON | Common | Fan-favorite en cualquier demografía. |
| `unicorn` | UNICORN | Rare | Identidad fuerte para kids/girls. |
| `witch` | WITCH | Rare | Temático, memorizable. |
| `phoenix` | PHOENIX | Rare | Visualmente espectacular con trail naranja. |
| `wizard` | WIZARD | Rare | Completa el trío mágico witch/wizard. |
| `frost` | FROST | Epic | Versión "ice" del clásico, bien diferenciada. |
| `ghost` | GHOST | Epic | Trail cdd6ff único, temática horror-cute. |
| `king` | GOLD KING | Legendary | Status symbol. La "aspiración" del catálogo. |
| `nemesis` | NEMESIS | Legendary | El "villain". Polo opuesto del classic. |

**Total recomendado: 12 skins** (1 gratis + 11 desbloqueables).

### Qué hacer con los palette swaps removidos

No tirarlos. Repropósitarlos como **recompensas de achievement**:

```
"GOLD" skin   → achievement: "Superar 1000m por primera vez"
"SHADOW" skin → achievement: "Completar 50 runs en total"
"AQUA" skin   → achievement: "Completar las misiones diarias 7 días seguidos"
"VIOLET" skin → achievement: "Alcanzar Fase 5 (500m+)"
"LIME" skin   → achievement: "Desbloquear todas las skins Common"
```

Esto les da propósito narrativo ("ganaste esto por hacer X") en lugar de ser compras de relleno. Son ahora trofeos, no productos.

---

## Tiers de rareza redefinidos

Con 12 skins, los tiers quedan así:

| Tier | Skins | Probabilidad ruleta | Costo directo |
|---|---|---|---|
| **Free** | classic | — | Gratis siempre |
| **Common** | cat, hound, dragon | 40% (entre los 3) | 400–500 coins |
| **Rare** | unicorn, witch, phoenix, wizard | 35% (entre los 4) | 600–800 coins |
| **Epic** | frost, ghost | 18% (entre los 2) | 900–1100 coins |
| **Legendary** | king, nemesis | 7% (entre los 2) | 1300–1500 coins |

Las probabilidades son por tier, distribuidas equitativamente dentro del tier. El jugador ve estas probabilidades antes de girar.

---

## Economía: cuánto tarda un jugador en desbloquear todo

Para que el sistema sea percibido como generoso (no como grind interminable):

**Jugador casual (5-10 runs/día, ~150m promedio):**
- Gana ~15-20 coins/día solo de runs
- + 85 coins/día de misiones diarias = ~100 coins/día
- Skin más cara (1500 coins) → 15 días de juego casual

**Jugador activo (20+ runs/día, ~300m promedio):**
- Gana ~60 coins/día de runs
- + 85 coins/día de misiones = ~145 coins/día
- Skin más cara → ~10 días

**Catálogo completo sin IAP:** un jugador casual activo desbloquea todo en ~2-3 meses. Eso es el horizonte correcto: suficientemente largo para mantener el juego vivo, suficientemente alcanzable para no frustrar.

---

## IAP (In-App Purchase) — rol en el sistema

El IAP existe para jugadores que no quieren esperar, no para jugadores que quieren ventaja.

**Único IAP recomendado al lanzamiento:**

```
"Starter Pack" — $0.99 / $1.99
├── 500 coins (suficiente para 1 skin Common directa)
├── 1 skin de su elección del tier Rare
└── Badge cosmético "Founder" visible solo en leaderboard
```

**Lo que el IAP no puede hacer:**
- Dar más spins de ruleta
- Dar acceso anticipado a skins no lanzadas
- Dar cualquier ventaja de gameplay
- Desbloquear un modo sin ads (porque no hay ads invasivos que bloquear)

---

## Expansión futura: skins de temporada

Una vez que el catálogo base esté sólido, las skins de temporada son el mecanismo de retención de largo plazo:

```
Temporada (cada 2-3 meses):
├── 1-2 skins nuevas con temática estacional
├── Disponibles por coins durante la temporada
├── Desaparecen del shop al terminar (pero quien las tiene las conserva)
└── No hay compra con dinero real — solo achievement o coins acumulados
```

El FOMO es legítimo (la skin tiene ventana de tiempo) pero no es pago — es engagement. El jugador que jugó activamente durante la temporada las consigue. El que no jugó se la perdió, pero no porque no pagó.

---

## Lo que este documento no cubre

- Misiones diarias (qué objetivos, cómo se resetean) → ver `daily-missions.md`
- Monetización detallada (rewarded ad providers, frecuencia, compliance COPPA) → ver `monetization.md`
- Arte y proceso de creación de skins → ver `skin-process.md`
