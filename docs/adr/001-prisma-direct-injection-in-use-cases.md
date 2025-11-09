# ADR 001: Inyección Directa de PrismaService en Use Cases

**Fecha**: 2024-11-09  
**Estado**: ✅ ACEPTADO (Pragmático)  
**Contexto**: Sistema de reservas TimeLoop - Fase MVP  

---

## 📋 CONTEXTO

Necesitamos garantizar **atomicidad ACID** entre múltiples operaciones al crear/actualizar reservas:
- Crear/actualizar booking
- Crear/actualizar booking history
- Crear activity log

Estas operaciones **DEBEN** ejecutarse en una sola transacción: si una falla, todas deben revertirse.

---

## ⚖️ DECISIÓN

**Inyectar `PrismaService` directamente en los use cases** (`CreateBooking` y `UpdateBooking`) para acceder a `$transaction()` y garantizar atomicidad.

### Código afectado:
- `src/application/use-cases/booking/create.use-case.ts`
- `src/application/use-cases/booking/update.use-case.ts`

---

## 🎯 JUSTIFICACIÓN

### Por qué es necesario:

1. **Atomicidad crítica**: Booking + History + ActivityLog deben ser atómicos
2. **Limitación de Prisma**: `$transaction()` requiere acceso directo al PrismaClient
3. **Repositorios aislados**: Los repositorios individuales no pueden compartir contexto transaccional sin arquitectura compleja
4. **Hybrid Pattern**: Permite separar side effects críticos (EN transacción) de opcionales (FUERA con try-catch)

### Por qué es pragmático:

1. **Velocidad de desarrollo**: No requiere implementar Unit of Work o Transaction Manager
2. **Simplicidad**: Código directo y fácil de entender
3. **Equipo pequeño**: En fase MVP, la pureza arquitectónica es menos prioritaria que la velocidad
4. **Funcionalidad garantizada**: Ya resuelve race conditions, doble booking e inconsistencias

---

## ✅ VENTAJAS

| Ventaja | Descripción |
|---------|-------------|
| **Atomicidad** | 100% garantizada por Prisma con Serializable isolation |
| **Simplicidad** | Código directo sin capas de abstracción intermedias |
| **Performance** | Óptimo, sin overhead de abstracciones |
| **Velocidad de desarrollo** | No requiere implementar patrones adicionales |
| **Testing funcional** | Fácil probar con Prisma test environment |

---

## ⚠️ DESVENTAJAS (Deuda Técnica Consciente)

| Desventaja | Impacto |
|------------|---------|
| **Viola Clean Architecture** | Use case depende de infraestructura (bajo impacto en MVP) |
| **Acoplamiento a Prisma** | Difícil cambiar de ORM (improbable en corto plazo) |
| **Testing unitario** | Más difícil mockear Prisma que una abstracción (aceptable) |
| **Flexibilidad** | Menos agnóstico a la BD (no es un problema actualmente) |

---

## 🔄 ALTERNATIVAS CONSIDERADAS

### Opción 1: Unit of Work Pattern ❌
**Por qué NO se eligió**:
- Complejidad: +3-4 horas de implementación
- Overkill para fase MVP
- No agrega valor inmediato

**Cuándo considerarla**:
- Cuando el proyecto escale a equipos grandes
- Cuando se requiera cambiar de ORM
- Post-MVP, si hay tiempo para refactoring

### Opción 2: Transaction Manager ❌
**Por qué NO se eligió**:
- Complejidad: +1-2 horas de implementación
- Todavía requiere modificar repositorios para soportar contexto transaccional
- Beneficio limitado en etapa actual

**Cuándo considerarla**:
- Después del MVP, como primer paso hacia Clean Architecture puro
- Si el testing unitario se vuelve problemático

### Opción 3: Inyección directa de Prisma ✅ (ELEGIDA)
**Por qué SÍ se eligió**:
- Ya está implementado y funciona
- Cumple el requisito de atomicidad
- Simple de entender y mantener
- Permite avanzar rápido en el MVP

---

## 📝 ESTRATEGIA DE MITIGACIÓN

Para minimizar el impacto de esta decisión pragmática:

1. ✅ **Documentación clara**: ADR + comentarios en código explicando la decisión
2. ✅ **Encapsulación**: Lógica transaccional contenida SOLO en use cases específicos
3. ✅ **Logging estructurado**: Para facilitar debugging y monitoreo
4. ✅ **Hybrid Pattern**: Separación clara entre críticos (EN tx) y opcionales (FUERA tx)
5. ⏸️ **Refactoring futuro planeado**: Ver sección abajo

---

## 🔮 PLAN DE REFACTORING FUTURO

### Cuándo refactorizar:
- ✅ Después del MVP exitoso
- ✅ Cuando haya 3+ use cases con transacciones similares
- ✅ Cuando el testing unitario se vuelva problemático
- ✅ Cuando el equipo crezca a 5+ desarrolladores

### Cómo refactorizar:
1. Implementar `ITransactionManager` interface (dominio)
2. Crear `PrismaTransactionManager` (infraestructura)
3. Modificar use cases para inyectar `ITransactionManager` en lugar de `PrismaService`
4. Agregar tests unitarios con mock de `ITransactionManager`

### Esfuerzo estimado:
- **2-4 horas** de desarrollo
- **1-2 horas** de testing
- **Riesgo bajo**: Cambio aislado sin afectar funcionalidad

---

## 📚 REFERENCIAS

- [Martin Fowler - Unit of Work](https://martinfowler.com/eaaCatalog/unitOfWork.html)
- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Prisma Transactions](https://www.prisma.io/docs/concepts/components/prisma-client/transactions)
- [ADR Process](https://adr.github.io/)

---

## 🎓 LECCIONES APRENDIDAS

### Para el equipo:
1. **Pragmatismo > Pureza**: En MVP, velocidad y funcionalidad son más importantes que arquitectura perfecta
2. **Deuda técnica consciente**: Documentar decisiones pragmáticas las hace manejables
3. **Refactoring incremental**: Planear el cambio futuro sin bloquearse ahora
4. **Trade-offs explícitos**: Comunicar claramente qué se gana y qué se pierde

### Para el proyecto:
1. **Funcionamiento primero**: El sistema ya previene doble booking, race conditions y garantiza consistencia
2. **Arquitectura evolutiva**: Empezar simple y refactorizar cuando el valor lo justifique
3. **Documentación como seguro**: ADRs permiten entender decisiones históricas

---

## ✍️ FIRMAS

**Decisión tomada por**: Equipo TimeLoop  
**Revisado por**: [Tu nombre]  
**Próxima revisión**: Post-MVP (estimado en 3-6 meses)  

---

**PRIORIDAD DE REFACTORING**: 🟡 BAJA  
**IMPACTO FUNCIONAL**: ✅ NINGUNO (funciona correctamente)  
**IMPACTO ARQUITECTÓNICO**: ⚠️ MEDIO (viola Clean Architecture pero documentado)

