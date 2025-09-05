# Configuración de Seguridad de Pagos

Este documento describe las variables de entorno disponibles para configurar el `PaymentSecurityValidator`.

## Variables de Entorno

### Rate Limiting
```bash
# Ventana de tiempo para rate limiting (en milisegundos)
# Por defecto: 900000 (15 minutos)
PAYMENT_RATE_LIMIT_WINDOW_MS=900000

# Máximo número de intentos por ventana de tiempo
# Por defecto: 10
PAYMENT_RATE_LIMIT_MAX_ATTEMPTS=10
```

### Fallos Múltiples
```bash
# Máximo número de fallos por hora por usuario/comercio
# Por defecto: 5
PAYMENT_MAX_FAILURES_PER_HOUR=5
```

### Montos Sospechosos
```bash
# Umbral de variación para detectar montos sospechosos (0.0 - 1.0)
# Por defecto: 0.3 (30% de variación)
PAYMENT_SUSPICIOUS_AMOUNT_THRESHOLD=0.3

# Tamaño mínimo del historial para establecer patrones
# Por defecto: 5
PAYMENT_MIN_HISTORY_SIZE=5

# Tamaño máximo del historial a mantener
# Por defecto: 20
PAYMENT_MAX_HISTORY_SIZE=20
```

### Patrones Inusuales
```bash
# Hora de inicio del rango de horarios inusuales (0-23)
# Por defecto: 2 (2 AM)
PAYMENT_UNUSUAL_HOURS_START=2

# Hora de fin del rango de horarios inusuales (0-23)
# Por defecto: 6 (6 AM)
PAYMENT_UNUSUAL_HOURS_END=6
```

## Ejemplos de Configuración

### Configuración Estricta (Producción)
```bash
PAYMENT_RATE_LIMIT_WINDOW_MS=600000      # 10 minutos
PAYMENT_RATE_LIMIT_MAX_ATTEMPTS=5        # 5 intentos
PAYMENT_MAX_FAILURES_PER_HOUR=3          # 3 fallos por hora
PAYMENT_SUSPICIOUS_AMOUNT_THRESHOLD=0.2  # 20% de variación
PAYMENT_MIN_HISTORY_SIZE=10              # 10 pagos mínimo
PAYMENT_MAX_HISTORY_SIZE=50              # 50 pagos máximo
PAYMENT_UNUSUAL_HOURS_START=1            # 1 AM
PAYMENT_UNUSUAL_HOURS_END=5              # 5 AM
```

### Configuración Relajada (Desarrollo/Testing)
```bash
PAYMENT_RATE_LIMIT_WINDOW_MS=300000      # 5 minutos
PAYMENT_RATE_LIMIT_MAX_ATTEMPTS=20       # 20 intentos
PAYMENT_MAX_FAILURES_PER_HOUR=10         # 10 fallos por hora
PAYMENT_SUSPICIOUS_AMOUNT_THRESHOLD=0.5  # 50% de variación
PAYMENT_MIN_HISTORY_SIZE=3               # 3 pagos mínimo
PAYMENT_MAX_HISTORY_SIZE=10              # 10 pagos máximo
PAYMENT_UNUSUAL_HOURS_START=3            # 3 AM
PAYMENT_UNUSUAL_HOURS_END=4              # 4 AM
```

## Notas Importantes

1. **Rate Limiting**: Se aplica por combinación de IP + User ID
2. **Montos Sospechosos**: Se calcula basado en el historial de cada comercio individualmente
3. **Fallos Múltiples**: Se rastrea por combinación de User ID + Commerce ID
4. **Horarios Inusuales**: Se considera el horario del servidor, no del cliente
5. **Limpieza de Datos**: Los datos antiguos se limpian automáticamente, pero se recomienda llamar `cleanupOldData()` periódicamente

## Métodos de Utilidad

```typescript
// Obtener configuración actual
const config = validator.getConfig();

// Actualizar configuración (útil para tests)
validator.updateConfig({
    rateLimit: { maxAttempts: 100 }
});

// Limpiar datos antiguos
validator.cleanupOldData();
```
