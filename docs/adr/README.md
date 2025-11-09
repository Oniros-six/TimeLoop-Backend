# 📚 Architecture Decision Records (ADRs)

Esta carpeta contiene los **Architecture Decision Records** (Registros de Decisiones Arquitectónicas) del proyecto TimeLoop.

---

## 🤔 ¿Qué es un ADR?

Un ADR es un documento que captura una **decisión arquitectónica importante**, incluyendo:

- **Contexto**: ¿Qué problema estamos resolviendo?
- **Decisión**: ¿Qué solución elegimos?
- **Justificación**: ¿Por qué esta solución y no otra?
- **Consecuencias**: ¿Qué ganamos y qué perdemos?
- **Alternativas**: ¿Qué otras opciones consideramos?

---

## 🎯 ¿Por qué usar ADRs?

### Beneficios:

1. ✅ **Memoria histórica**: Entender por qué se tomó una decisión meses/años después
2. ✅ **Onboarding**: Nuevos desarrolladores entienden el razonamiento arquitectónico
3. ✅ **Transparencia**: Decisiones documentadas y revisables por el equipo
4. ✅ **Deuda técnica consciente**: Documentar trade-offs pragmáticos
5. ✅ **Revisión**: Facilita revisar decisiones cuando el contexto cambia

---

## 📝 Cuándo crear un ADR

Crea un ADR cuando tomes una decisión sobre:

- ✅ Patrones arquitectónicos (Clean Architecture, DDD, etc.)
- ✅ Tecnologías principales (ORM, framework, base de datos)
- ✅ Violaciones conscientes de principios (pragmatismo documentado)
- ✅ Trade-offs significativos entre opciones
- ✅ Cambios que afectan a múltiples módulos

**NO necesitas ADR para**:
- ❌ Decisiones de implementación menores
- ❌ Convenciones de código (usa linters/style guides)
- ❌ Bugs fixes rutinarios

---

## 🔢 Nomenclatura

Los ADRs se numeran secuencialmente:

```
001-nombre-de-la-decision.md
002-otra-decision-importante.md
003-cambio-de-estrategia.md
```

---

## 📋 Template

```markdown
# ADR XXX: [Título de la decisión]

**Fecha**: YYYY-MM-DD  
**Estado**: PROPUESTO | ACEPTADO | RECHAZADO | DEPRECADO | SUPERSEDED  
**Contexto**: [Breve descripción del contexto del proyecto]

---

## 📋 CONTEXTO

[Descripción del problema que estamos resolviendo]

---

## ⚖️ DECISIÓN

[La decisión que tomamos]

---

## 🎯 JUSTIFICACIÓN

[Por qué elegimos esta opción]

---

## ✅ VENTAJAS

[Qué ganamos con esta decisión]

---

## ⚠️ DESVENTAJAS

[Qué perdemos o qué deuda técnica aceptamos]

---

## 🔄 ALTERNATIVAS CONSIDERADAS

[Otras opciones que evaluamos y por qué NO las elegimos]

---

## 📚 REFERENCIAS

[Links, artículos, documentación relevante]
```

---

## 📚 ADRs en este proyecto

| # | Título | Estado | Fecha |
|---|--------|--------|-------|
| [001](./001-prisma-direct-injection-in-use-cases.md) | Inyección Directa de PrismaService en Use Cases | ✅ ACEPTADO | 2024-11-09 |

---

## 🔗 Recursos adicionales

- [ADR GitHub Organization](https://adr.github.io/)
- [Michael Nygard - Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [ThoughtWorks Technology Radar - ADRs](https://www.thoughtworks.com/radar/techniques/lightweight-architecture-decision-records)

