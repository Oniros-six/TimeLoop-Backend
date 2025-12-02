# Contrato WebSocket para Actualizaciones en Tiempo Real de Reservas

## Descripción General

Este documento describe el contrato de WebSocket para recibir actualizaciones en tiempo real sobre el estado de las reservas en un comercio específico.

## Endpoint

- **URL**: `ws://[host]/bookings`
- **Namespace**: `/bookings`
- **Protocolo**: Socket.IO v4

## Conexión

### Handshake

Al conectarse, el cliente debe proporcionar el ID del comercio:

```javascript
const socket = io('/bookings', {
  query: {
    commerceId: '123' // ID del comercio (requerido)
  }
});
```

### Respuestas de Conexión

#### Conexión Exitosa
```javascript
socket.on('connected', (data) => {
  console.log('Conectado al comercio:', data.commerceId);
});
```

#### Errores de Conexión
```javascript
socket.on('error', (error) => {
  console.error('Error:', error.message);
  // Posibles mensajes:
  // - "commerceId is required"
  // - "commerceId must be a number"
  // - "Commerce not found"
  // - "Too many connections"
});
```

## Eventos

### `availabilityUpdated`

Emitido cuando hay un cambio en la disponibilidad del comercio (creación, actualización, cancelación o expiración de reservas).

#### Payload

```typescript
interface AvailabilityUpdateEvent {
  bookingId: number;       // ID de la reserva
  status: BookingStatus;   // Estado actual de la reserva
  timeStart: Date;         // Hora de inicio
  timeEnd: Date;           // Hora de fin
  employeeId: number;      // ID del empleado
  commerceId: number;      // ID del comercio
}

enum BookingStatus {
  HOLD = 'HOLD',           // Prereserva temporal
  PENDING = 'PENDING',     // Reserva pendiente
  CONFIRMED = 'CONFIRMED', // Reserva confirmada
  CANCELED = 'CANCELED',   // Reserva cancelada
  NO_SHOW = 'NO_SHOW',     // Cliente no se presentó
  COMPLETED = 'COMPLETED', // Servicio completado
  RESCHEDULED = 'RESCHEDULED' // Reserva reagendada
}
```

#### Ejemplo de Uso

```javascript
socket.on('availabilityUpdated', (data) => {
  console.log('Actualización de disponibilidad:', {
    bookingId: data.bookingId,
    status: data.status,
    horario: `${data.timeStart} - ${data.timeEnd}`,
    empleado: data.employeeId
  });
  
  // Actualizar UI según el estado
  if (data.status === 'CANCELED') {
    // El horario está disponible nuevamente
    calendar.markAsAvailable(data.timeStart, data.timeEnd, data.employeeId);
  } else if (data.status === 'HOLD' || data.status === 'PENDING') {
    // El horario está ocupado
    calendar.markAsUnavailable(data.timeStart, data.timeEnd, data.employeeId);
  }
});
```

## Seguridad y Límites

### Rate Limiting

- **Límite**: 30 conexiones por minuto por IP
- **Ventana**: 60 segundos
- **Respuesta al exceder**: Desconexión con mensaje "Too many connections"

### Aislamiento por Comercio

- Cada cliente solo recibe actualizaciones del comercio especificado en la conexión
- No es posible suscribirse a múltiples comercios en una sola conexión
- Para monitorear múltiples comercios, se requieren conexiones separadas

## Casos de Uso

### 1. Cliente Viendo Disponibilidad

```javascript
// Conectar al ver calendario del comercio
const socket = io('/bookings', {
  query: { commerceId: '123' }
});

// Escuchar actualizaciones
socket.on('availabilityUpdated', (update) => {
  updateCalendarView(update);
});

// Desconectar al salir de la vista
socket.disconnect();
```

### 2. Manejo de Reconexión

```javascript
const socket = io('/bookings', {
  query: { commerceId: '123' },
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});

socket.on('reconnect', () => {
  // Recargar estado actual desde API REST
  fetchCurrentAvailability();
});
```

### 3. Integración con Estado Local

```javascript
// Store de disponibilidad
const availabilityStore = {
  slots: new Map(),
  
  updateFromWebSocket(event) {
    const key = `${event.employeeId}-${event.timeStart}`;
    
    if (event.status === 'CANCELED') {
      this.slots.delete(key);
    } else {
      this.slots.set(key, {
        bookingId: event.bookingId,
        status: event.status,
        timeStart: event.timeStart,
        timeEnd: event.timeEnd,
        employeeId: event.employeeId
      });
    }
    
    // Notificar a la UI
    this.notifySubscribers();
  }
};

socket.on('availabilityUpdated', (event) => {
  availabilityStore.updateFromWebSocket(event);
});
```

## Estados de Reserva y su Significado

- **HOLD**: Prereserva temporal (15 minutos). El horario está temporalmente bloqueado.
- **PENDING**: Reserva creada pero pendiente de confirmación.
- **CONFIRMED**: Reserva confirmada.
- **CANCELED**: Reserva cancelada. El horario vuelve a estar disponible.
- **RESCHEDULED**: La reserva fue movida a otro horario.

### Nota sobre Holds Expirados

Cuando un hold expira después de 15 minutos:
1. Se emite un evento `availabilityUpdated` con estado CANCELED para indicar que el horario está libre
2. El hold se elimina completamente de la base de datos
3. El `bookingId` en el evento corresponde al hold que ya fue eliminado

## Notas Importantes

1. **Sin Autenticación**: La conexión no requiere autenticación. Cualquier cliente puede conectarse proporcionando un commerceId válido.

2. **Datos Mínimos**: Los eventos solo contienen la información necesaria para actualizar la disponibilidad. Para detalles completos de las reservas, use las APIs REST.

3. **Eventual Consistency**: Los eventos se emiten después de que la operación se complete en la base de datos, pero pueden llegar con un pequeño retraso.

4. **No Garantizado**: Si el cliente está desconectado, perderá los eventos. Al reconectar, debe sincronizar el estado completo vía REST.

## Ejemplo Completo de Implementación

```javascript
class BookingRealtimeClient {
  constructor(commerceId) {
    this.commerceId = commerceId;
    this.socket = null;
    this.listeners = new Set();
  }

  connect() {
    this.socket = io('/bookings', {
      query: { commerceId: this.commerceId },
      reconnection: true
    });

    this.socket.on('connected', (data) => {
      console.log('Connected to commerce:', data.commerceId);
    });

    this.socket.on('availabilityUpdated', (event) => {
      this.notifyListeners(event);
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  onAvailabilityUpdate(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(event) {
    this.listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in availability listener:', error);
      }
    });
  }
}

// Uso
const client = new BookingRealtimeClient('123');
client.connect();

const unsubscribe = client.onAvailabilityUpdate((event) => {
  console.log('Availability changed:', event);
});

// Cuando ya no se necesita
unsubscribe();
client.disconnect();
```
