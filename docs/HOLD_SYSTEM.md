# 🕐 Sistema de Hold / Prereserva Temporal

## 📋 **DESCRIPCIÓN**

El **Sistema de Hold** permite crear prereservas temporales de 15 minutos que bloquean un horario mientras el cliente completa el proceso de pago, evitando que otros usuarios reserven el mismo slot.

---

## 🎯 **PROBLEMA QUE RESUELVE**

### Escenario sin Hold:
```
14:00:00 - Cliente A selecciona horario 10:00 AM
14:00:05 - Cliente B selecciona mismo horario 10:00 AM  
14:00:10 - Cliente A completa pago → Reserva creada ✅
14:00:15 - Cliente B completa pago → ERROR: Horario ocupado ❌
          Cliente B pierde tiempo y tiene mala experiencia
```

###Escenario con Hold:
```
14:00:00 - Cliente A a las 14:00:00 selecciona horario 10:00 AM
14:00:01 - Sistema crea HOLD (expira 14:15:00)
14:00:05 - Cliente B intenta mismo horario → "No disponible" ⚠️
14:00:10 - Cliente A completa pago → HOLD → PENDING ✅
14:00:15 - Cliente B ve que ya está disponible otro horario
```

---

## 🏗️ **ARQUITECTURA**

### **Base de Datos**

```sql
-- Enum actualizado
enum BookingStatus {
  HOLD         -- ← NUEVO
  PENDING
  CONFIRMED
  CANCELED
  NO_SHOW
  COMPLETED
  RESCHEDULED
}

-- Columna nueva
ALTER TABLE bookings ADD COLUMN "expiresAt" TIMESTAMPTZ;

-- Índice para limpieza eficiente
CREATE INDEX "bookings_expiresAt_idx" ON bookings("expiresAt");

-- Exclusion constraint actualizado (incluye HOLD)
ALTER TABLE bookings ADD CONSTRAINT unique_user_booking_range 
  EXCLUDE USING GIST ("userId" WITH =, time_range WITH &&) 
  WHERE (status IN ('HOLD', 'PENDING', 'CONFIRMED', 'RESCHEDULED'));
```

---

## 🔄 **FLUJO COMPLETO**

### **1. Cliente selecciona horario**
```typescript
POST /booking/hold
{
  "customerId": 1,
  "commerceId": 1,
  "userId": 2,
  "serviceIds": [1, 2],
  "timeStart": "2024-11-15T10:00:00.000Z",
  "notes": "Cliente prefiere ventana"
}

// Respuesta
{
  "message": "Horario reservado temporalmente. Complete el pago en 15 minutos.",
  "statusCode": 201,
  "data": {
    "holdId": 123,
    "expiresAt": "2024-11-15T10:15:00.000Z",
    "expiresInSeconds": 900
  }
}
```

**Qué hace internamente:**
- ✅ Valida servicios y usuario
- ✅ Crea booking con `status: HOLD`
- ✅ Establece `expiresAt = now() + 15 minutos`
- ✅ El **exclusion constraint** previene que otros creen holds overlapping
- ✅ Retorna `holdId` para confirmar después

---

### **2. Cliente completa pago**
```typescript
POST /booking/hold/123/confirm

// Respuesta
{
  "message": "Reserva confirmada exitosamente",
  "statusCode": 200,
  "data": {
    "id": 123,
    "status": "PENDING",  // ← Convertido de HOLD
    "expiresAt": null,     // ← Ya no expira
    // ... resto de datos
  }
}
```

**Qué hace internamente:**
- ✅ Verifica que el hold existe y NO ha expirado
- ✅ **Transacción atómica**: HOLD → PENDING + historial + log
- ✅ Limpia `expiresAt` (ya es permanente)
- ✅ Crea reminder (opcional, con try-catch)
- ✅ Emite evento (opcional, con try-catch)

---

### **3. Cliente abandona (15 min sin confirmar)**
```
14:00:00 - Hold creado (expira 14:15:00)
14:01:00 - Cron check: aún no expiró, skip
14:15:00 - Cron check: EXPIRADO → DELETE ✅
14:15:01 - Horario vuelve a estar disponible
```

**Cron Job (cada 1 minuto):**
```typescript
@Cron(CronExpression.EVERY_MINUTE)
async cleanupExpiredHolds() {
  const expiredHolds = await prisma.booking.findMany({
    where: {
      status: 'HOLD',
      expiresAt: { lt: new Date() }
    }
  });

  await prisma.booking.deleteMany({
    where: { id: { in: holdIds } }
  });

  logger.log(`Cleaned up ${count} expired holds`);
}
```

---

## 📂 **ARCHIVOS CREADOS/MODIFICADOS**

### **Archivos Nuevos**
```
src/application/use-cases/booking/
├── create-hold.use-case.ts          # Crear hold temporal
└── confirm-hold.use-case.ts         # Convertir hold a PENDING

src/domain/services/hold-cleanup/
├── hold-cleanup.service.ts          # Cron job para limpiar expirados
└── hold-cleanup.module.ts           # Módulo del servicio

src/interfaces/controllers/booking/
├── booking-hold.controller.ts       # Endpoints de hold
└── dto/create-hold.dto.ts           # DTO de validación

prisma/migrations/
└── 20251109_add_hold_system/
    └── migration.sql                # Migración completa

docs/
└── HOLD_SYSTEM.md                   # Este documento
```

### **Archivos Modificados**
```
prisma/schema.prisma                 # + enum HOLD, + expiresAt
src/interfaces/controllers/booking/booking.module.ts  # + use cases
src/app.module.ts                    # + HoldCleanupModule
```

---

## 🚀 **DEPLOYMENT CHECKLIST**

### **1. Aplicar Migración**
```bash
# Ejecutar migración (agrega HOLD, expiresAt, actualiza constraint)
npx prisma migrate deploy

# Verificar que se aplicó
npx prisma db pull
```

### **2. Generar Cliente Prisma**
```bash
npx prisma generate
```

### **3. Verificar Cron Job**
```bash
# El cron job se activa automáticamente al iniciar la app
# Verifica los logs:
# "Cleaned up X expired holds" (cada 1 minuto)
```

### **4. Test Manual**
```bash
# 1. Crear hold
curl -X POST http://localhost:3000/booking/hold \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": 1,
    "commerceId": 1,
    "userId": 2,
    "serviceIds": [1],
    "timeStart": "2024-11-15T10:00:00.000Z"
  }'

# 2. Confirmar hold (antes de 15 min)
curl -X POST http://localhost:3000/booking/hold/123/confirm \
  -H "Authorization: Bearer <token>"

# 3. Verificar que expiró (esperar > 15 min sin confirmar)
# El cron lo eliminará automáticamente
```

---

## ⚙️ **CONFIGURACIÓN**

### **Ajustar tiempo de expiración**

En `src/application/use-cases/booking/create-hold.use-case.ts`:

```typescript
export class CreateHold {
  // Cambiar de 15 a X minutos
  private readonly HOLD_EXPIRATION_MINUTES = 15;
}
```

### **Ajustar frecuencia del cron**

En `src/domain/services/hold-cleanup/hold-cleanup.service.ts`:

```typescript
// Opciones disponibles:
@Cron(CronExpression.EVERY_30_SECONDS)  // Cada 30 segundos (agresivo)
@Cron(CronExpression.EVERY_MINUTE)      // Cada 1 minuto (recomendado)
@Cron(CronExpression.EVERY_5_MINUTES)   // Cada 5 minutos (relajado)
@Cron('*/2 * * * *')                     // Cada 2 minutos (custom)
```

---

## 🔐 **SEGURIDAD Y GARANTÍAS**

### **✅ Prevención de Double Booking**
- Exclusion constraint en BD incluye `HOLD`
- Imposible crear 2 holds para mismo horario
- Atomicidad ACID garantizada

### **✅ Limpieza Automática**
- Cron job elimina holds expirados cada 1 minuto
- No requiere intervención manual
- Logs para monitoreo

### **✅ Validación de Expiración**
- `ConfirmHold` valida que NO haya expirado antes de confirmar
- Error 410 GONE si ya expiró
- Cliente debe crear nuevo hold

### **✅ Sin Residuos**
- Holds expirados se **ELIMINAN** (no quedan como CANCELED)
- Base de datos limpia
- No afecta estadísticas

---

## 📊 **MONITOREO**

### **Estadísticas de Holds**
```typescript
// Endpoint para obtener stats (útil para dashboard admin)
const stats = await holdCleanupService.getHoldStats();

// Resultado:
{
  total: 50,      // Total de holds activos
  expired: 5,     // Cuántos están expirados (pendientes de limpieza)
  active: 45      // Cuántos aún son válidos
}
```

### **Logs a Monitorear**
```
[HoldCleanupService] Cleaned up 3 expired holds
[HoldCleanupService] No expired holds found
[CreateHold] Hold created: 123, expires at 2024-11-15T10:15:00.000Z
[ConfirmHold] Hold 123 confirmed successfully
[ConfirmHold] Intento de confirmar hold expirado: 124
```

---

## 🔮 **FUTURO: INTEGRACIÓN CON WEBSOCKETS**

Cuando implementes WebSockets, el sistema de holds se integrará perfectamente:

### **Emitir eventos en tiempo real**

```typescript
// En create-hold.use-case.ts (después de crear hold)
this.websocketGateway.emit('slot-unavailable', {
  userId: data.userId,
  date: data.timeStart,
  holdId: result.id
});

// En hold-cleanup.service.ts (después de eliminar hold)
for (const hold of expiredHolds) {
  this.websocketGateway.emit('slot-available', {
    userId: hold.userId,
    date: hold.timeStart,
  });
}
```

### **Cliente escucha eventos**
```typescript
// Frontend
socket.on('slot-unavailable', (data) => {
  // Marcar horario como ocupado en UI
  updateSlotAvailability(data.date, false);
});

socket.on('slot-available', (data) => {
  // Marcar horario como disponible en UI
  updateSlotAvailability(data.date, true);
});
```

### **Resultado**
- ✅ Disponibilidad actualizada en tiempo real
- ✅ Usuarios ven cuando un hold se crea/expira
- ✅ Mejor UX (sin refrescar manualmente)

---

## 🎓 **LECCIONES APRENDIDAS**

### **Por qué DELETE en lugar de CANCEL**
- Los holds son **temporales por naturaleza**
- No representan intención real de reserva
- Cancelar contaminaría estadísticas de cancelaciones reales
- Eliminar mantiene la BD limpia y las métricas precisas

### **Por qué 15 minutos**
- Suficiente para completar proceso de pago
- No demasiado largo (bloqueando disponibilidad innecesariamente)
- Balance entre UX y disponibilidad

### **Por qué Cron cada 1 minuto**
- Latencia aceptable (máximo 1 min extra de bloqueo)
- No sobrecarga el servidor
- Fácil de monitorear y debuggear

---

## 📚 **REFERENCIAS**

- [Booking System with Race Conditions](../adr/001-prisma-direct-injection-in-use-cases.md)
- [UTC Timezone Normalization](./TIMEZONE_STRATEGY.md)
- [Exclusion Constraints in PostgreSQL](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-EXCLUSION)
- [NestJS Cron Jobs](https://docs.nestjs.com/techniques/task-scheduling)

---

**PRIORIDAD**: 🔥 ALTA (Mejora crítica de UX y prevención de errores)  
**COMPLEJIDAD**: 🟡 MEDIA  
**IMPACTO**: ✅ ALTO (Mejor experiencia de usuario, menos frustraciones)

