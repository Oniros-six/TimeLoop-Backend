import { Injectable } from '@nestjs/common';

export interface SecurityValidationContext {
  paymentId?: number;
  commerceId?: number;
  userId?: number;
  amount?: number;
  ipAddress?: string;
  userAgent?: string;
  timestamp?: Date;
}

export interface SecurityViolation {
  type:
    | 'RATE_LIMIT'
    | 'SUSPICIOUS_AMOUNT'
    | 'MULTIPLE_FAILURES'
    | 'UNUSUAL_PATTERN';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  details: Record<string, any>;
}

export interface SecurityConfig {
  rateLimit: {
    windowMs: number;
    maxAttempts: number;
  };
  failures: {
    maxFailuresPerHour: number;
  };
  suspiciousAmount: {
    threshold: number;
    minHistorySize: number;
    maxHistorySize: number;
  };
  unusualPatterns: {
    unusualHours: {
      start: number;
      end: number;
    };
  };
}

@Injectable()
export class PaymentSecurityValidator {
  private readonly rateLimitMap = new Map<
    string,
    { count: number; lastReset: Date }
  >();
  private readonly failureCountMap = new Map<
    string,
    { count: number; lastFailure: Date }
  >();
  private readonly suspiciousAmounts = new Map<number, number[]>(); // commerceId -> amounts

  private readonly config: SecurityConfig;

  constructor() {
    this.config = this.loadSecurityConfig();
  }

  /**
   * Carga la configuración de seguridad desde variables de entorno o valores por defecto
   */
  private loadSecurityConfig(): SecurityConfig {
    return {
      rateLimit: {
        windowMs: parseInt(
          process.env.PAYMENT_RATE_LIMIT_WINDOW_MS || '900000',
        ), // 15 minutos por defecto
        maxAttempts: parseInt(
          process.env.PAYMENT_RATE_LIMIT_MAX_ATTEMPTS || '10',
        ),
      },
      failures: {
        maxFailuresPerHour: parseInt(
          process.env.PAYMENT_MAX_FAILURES_PER_HOUR || '5',
        ),
      },
      suspiciousAmount: {
        threshold: parseFloat(
          process.env.PAYMENT_SUSPICIOUS_AMOUNT_THRESHOLD || '0.3',
        ), // 30%
        minHistorySize: parseInt(process.env.PAYMENT_MIN_HISTORY_SIZE || '5'),
        maxHistorySize: parseInt(process.env.PAYMENT_MAX_HISTORY_SIZE || '20'),
      },
      unusualPatterns: {
        unusualHours: {
          start: parseInt(process.env.PAYMENT_UNUSUAL_HOURS_START || '2'),
          end: parseInt(process.env.PAYMENT_UNUSUAL_HOURS_END || '6'),
        },
      },
    };
  }

  /**
   * Valida la seguridad de una operación de pago
   */
  validatePaymentSecurity(
    context: SecurityValidationContext,
  ): SecurityViolation[] {
    const violations: SecurityViolation[] = [];

    // 1. Validar rate limiting
    const rateLimitViolation = this.validateRateLimit(context);
    if (rateLimitViolation) violations.push(rateLimitViolation);

    // 2. Validar monto sospechoso
    const amountViolation = this.validateSuspiciousAmount(context);
    if (amountViolation) violations.push(amountViolation);

    // 3. Validar fallos múltiples
    const failureViolation = this.validateMultipleFailures(context);
    if (failureViolation) violations.push(failureViolation);

    // 4. Validar patrones inusuales
    const patternViolation = this.validateUnusualPatterns(context);
    if (patternViolation) violations.push(patternViolation);

    return violations;
  }

  /**
   * Valida rate limiting por IP y usuario
   */
  private validateRateLimit(
    context: SecurityValidationContext,
  ): SecurityViolation | null {
    const key = `${context.ipAddress}_${context.userId}`;
    const now = new Date();

    const rateLimitData = this.rateLimitMap.get(key);

    if (!rateLimitData) {
      this.rateLimitMap.set(key, { count: 1, lastReset: now });
      return null;
    }

    // Resetear contador si ha pasado la ventana de tiempo
    if (
      now.getTime() - rateLimitData.lastReset.getTime() >
      this.config.rateLimit.windowMs
    ) {
      this.rateLimitMap.set(key, { count: 1, lastReset: now });
      return null;
    }

    // Incrementar contador
    rateLimitData.count++;
    this.rateLimitMap.set(key, rateLimitData);

    if (rateLimitData.count > this.config.rateLimit.maxAttempts) {
      return {
        type: 'RATE_LIMIT',
        severity: 'HIGH',
        message: 'Límite de intentos excedido',
        details: {
          attempts: rateLimitData.count,
          limit: this.config.rateLimit.maxAttempts,
          window: this.config.rateLimit.windowMs,
        },
      };
    }

    return null;
  }

  /**
   * Valida montos sospechosos basado en historial del comercio
   */
  private validateSuspiciousAmount(
    context: SecurityValidationContext,
  ): SecurityViolation | null {
    if (!context.commerceId || !context.amount) return null;

    const amounts = this.suspiciousAmounts.get(context.commerceId) || [];

    if (amounts.length < this.config.suspiciousAmount.minHistorySize) {
      // Necesitamos al menos X pagos para establecer un patrón
      amounts.push(context.amount);
      this.suspiciousAmounts.set(context.commerceId, amounts);
      return null;
    }

    // Calcular promedio y desviación estándar
    const average =
      amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    const variance =
      amounts.reduce((sum, amount) => sum + Math.pow(amount - average, 2), 0) /
      amounts.length;
    const standardDeviation = Math.sqrt(variance);

    // Verificar si el monto actual está fuera del rango normal
    const threshold = average * this.config.suspiciousAmount.threshold;
    const isSuspicious = Math.abs(context.amount - average) > threshold;

    if (isSuspicious) {
      return {
        type: 'SUSPICIOUS_AMOUNT',
        severity: context.amount > average * 2 ? 'HIGH' : 'MEDIUM',
        message: 'Monto sospechoso detectado',
        details: {
          currentAmount: context.amount,
          averageAmount: average,
          standardDeviation,
          threshold,
        },
      };
    }

    // Actualizar historial
    amounts.push(context.amount);
    if (amounts.length > this.config.suspiciousAmount.maxHistorySize) {
      amounts.shift(); // Mantener solo los últimos X
    }
    this.suspiciousAmounts.set(context.commerceId, amounts);

    return null;
  }

  /**
   * Valida fallos múltiples del mismo usuario/comercio
   */
  private validateMultipleFailures(
    context: SecurityValidationContext,
  ): SecurityViolation | null {
    const key = `${context.userId}_${context.commerceId}`;
    const now = new Date();

    const failureData = this.failureCountMap.get(key);

    if (!failureData) {
      this.failureCountMap.set(key, { count: 1, lastFailure: now });
      return null;
    }

    // Resetear contador si ha pasado una hora
    if (now.getTime() - failureData.lastFailure.getTime() > 60 * 60 * 1000) {
      this.failureCountMap.set(key, { count: 1, lastFailure: now });
      return null;
    }

    failureData.count++;
    failureData.lastFailure = now;
    this.failureCountMap.set(key, failureData);

    if (failureData.count > this.config.failures.maxFailuresPerHour) {
      return {
        type: 'MULTIPLE_FAILURES',
        severity: 'HIGH',
        message: 'Múltiples fallos detectados',
        details: {
          failures: failureData.count,
          limit: this.config.failures.maxFailuresPerHour,
          timeWindow: '1 hour',
        },
      };
    }

    return null;
  }

  /**
   * Valida patrones inusuales (horarios, ubicaciones, etc.)
   */
  private validateUnusualPatterns(
    _context: SecurityValidationContext,
  ): SecurityViolation | null {
    const hour = new Date().getHours();

    // Detectar pagos en horarios inusuales configurados
    if (
      hour >= this.config.unusualPatterns.unusualHours.start &&
      hour <= this.config.unusualPatterns.unusualHours.end
    ) {
      return {
        type: 'UNUSUAL_PATTERN',
        severity: 'LOW',
        message: 'Pago en horario inusual',
        details: {
          hour,
          pattern: 'unusual_time',
          unusualHoursRange: {
            start: this.config.unusualPatterns.unusualHours.start,
            end: this.config.unusualPatterns.unusualHours.end,
          },
        },
      };
    }

    return null;
  }

  /**
   * Registra un fallo para tracking
   */
  recordFailure(context: SecurityValidationContext) {
    const key = `${context.userId}_${context.commerceId}`;
    const now = new Date();

    const failureData = this.failureCountMap.get(key);
    if (failureData) {
      failureData.count++;
      failureData.lastFailure = now;
      this.failureCountMap.set(key, failureData);
    } else {
      this.failureCountMap.set(key, { count: 1, lastFailure: now });
    }
  }

  /**
   * Limpia datos antiguos (llamar periódicamente)
   */
  cleanupOldData() {
    const now = new Date();
    const oneHourAgo = now.getTime() - 60 * 60 * 1000;
    const rateLimitWindowAgo = now.getTime() - this.config.rateLimit.windowMs;

    // Limpiar rate limits antiguos
    for (const [key, data] of this.rateLimitMap.entries()) {
      if (data.lastReset.getTime() < rateLimitWindowAgo) {
        this.rateLimitMap.delete(key);
      }
    }

    // Limpiar fallos antiguos
    for (const [key, data] of this.failureCountMap.entries()) {
      if (data.lastFailure.getTime() < oneHourAgo) {
        this.failureCountMap.delete(key);
      }
    }
  }

  /**
   * Obtiene la configuración actual de seguridad
   */
  getConfig(): SecurityConfig {
    return { ...this.config };
  }

  /**
   * Actualiza la configuración de seguridad (útil para tests)
   */
  updateConfig(newConfig: Partial<SecurityConfig>) {
    Object.assign(this.config, newConfig);
  }
}
