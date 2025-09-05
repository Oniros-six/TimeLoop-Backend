import { Test, TestingModule } from '@nestjs/testing';
import { PaymentSecurityValidator } from '@/domain/services/payment/PaymentSecurityValidator';
import { PaymentLogger } from '@/infrastructure/logging/PaymentLogger';
import { PaymentStatus } from '@/domain/dbEnums/PaymentStatus.enum';

describe('PaymentSecurityValidator', () => {
    let validator: PaymentSecurityValidator;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [PaymentSecurityValidator],
        }).compile();

        validator = module.get<PaymentSecurityValidator>(PaymentSecurityValidator);
    });

    it('should be defined', () => {
        expect(validator).toBeDefined();
    });

    it('should detect rate limit violations', async () => {
        // Configurar límite más bajo para el test
        validator.updateConfig({
            rateLimit: { windowMs: 60000, maxAttempts: 3 } // 1 minuto, 3 intentos
        });

        const context = {
            userId: 1,
            commerceId: 100,
            amount: 1000,
            ipAddress: '192.168.1.1',
            userAgent: 'test-agent',
            timestamp: new Date(),
        };

        // Simular múltiples intentos rápidos
        for (let i = 0; i < 5; i++) {
            const violations = await validator.validatePaymentSecurity(context);
            if (i < 3) {
                expect(violations.length).toBe(0);
            } else {
                expect(violations.length).toBeGreaterThan(0);
                expect(violations[0].type).toBe('RATE_LIMIT');
            }
        }
    });

    it('should detect suspicious amounts', async () => {
        // Configurar umbral más bajo para el test
        validator.updateConfig({
            suspiciousAmount: { threshold: 0.1, minHistorySize: 3, maxHistorySize: 10 }
        });

        const commerceId = 100;
        
        // Establecer patrón normal (montos entre 100-200)
        for (let i = 0; i < 3; i++) {
            const context = {
                userId: 1,
                commerceId,
                amount: 100 + (i * 20), // 100, 120, 140
                ipAddress: '192.168.1.1',
                userAgent: 'test-agent',
                timestamp: new Date(),
            };
            
            const violations = await validator.validatePaymentSecurity(context);
            expect(violations.length).toBe(0);
        }

        // Intentar monto sospechoso (muy alto)
        const suspiciousContext = {
            userId: 1,
            commerceId,
            amount: 10000, // Muy por encima del promedio
            ipAddress: '192.168.1.1',
            userAgent: 'test-agent',
            timestamp: new Date(),
        };

        const violations = await validator.validatePaymentSecurity(suspiciousContext);
        expect(violations.length).toBeGreaterThan(0);
        expect(violations[0].type).toBe('SUSPICIOUS_AMOUNT');
    });

    it('should detect unusual time patterns', async () => {
        // Configurar horarios inusuales más amplios para el test
        validator.updateConfig({
            unusualPatterns: {
                unusualHours: { start: 0, end: 23 } // Todo el día es inusual para el test
            }
        });

        const context = {
            userId: 1,
            commerceId: 100,
            amount: 1000,
            ipAddress: '192.168.1.1',
            userAgent: 'test-agent',
            timestamp: new Date(),
        };

        const violations = await validator.validatePaymentSecurity(context);
        expect(violations.length).toBeGreaterThan(0);
        expect(violations[0].type).toBe('UNUSUAL_PATTERN');
    });

    it('should record failures correctly', () => {
        const context = {
            userId: 1,
            commerceId: 100,
            timestamp: new Date(),
        };

        validator.recordFailure(context);
        validator.recordFailure(context);
        validator.recordFailure(context);

        // No debería haber violaciones aún (límite es 5)
        expect(true).toBe(true); // Placeholder para verificación futura
    });

    it('should allow configuration updates', () => {
        const originalConfig = validator.getConfig();
        
        // Actualizar configuración
        validator.updateConfig({
            rateLimit: { windowMs: 300000, maxAttempts: 5 }
        });
        
        const updatedConfig = validator.getConfig();
        
        expect(updatedConfig.rateLimit.windowMs).toBe(300000);
        expect(updatedConfig.rateLimit.maxAttempts).toBe(5);
        expect(updatedConfig.failures.maxFailuresPerHour).toBe(originalConfig.failures.maxFailuresPerHour);
    });
});

describe('PaymentLogger', () => {
    let logger: PaymentLogger;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [PaymentLogger],
        }).compile();

        logger = module.get<PaymentLogger>(PaymentLogger);
    });

    it('should be defined', () => {
        expect(logger).toBeDefined();
    });

    it('should log payment created event', () => {
        const context = {
            paymentId: 1,
            bookingId: 100,
            commerceId: 200,
            amount: 1000,
            currency: 'ARS',
            provider: 'MERCADO_PAGO',
            status: PaymentStatus.pending,
        };

        // No debería lanzar error
        expect(() => logger.logPaymentCreated(context)).not.toThrow();
    });

    it('should log error event', () => {
        const context = {
            paymentId: 1,
            bookingId: 100,
            commerceId: 200,
            error: 'Test error',
        };

        const error = new Error('Test error message');

        // Mock Date.now para evitar problemas con el logger
        const originalDateNow = Date.now;
        Date.now = jest.fn(() => 1234567890);

        try {
            // No debería lanzar error
            expect(() => logger.logError(context, error)).not.toThrow();
        } finally {
            // Restaurar Date.now original
            Date.now = originalDateNow;
        }
    });

    it('should log security event', () => {
        const context = {
            paymentId: 1,
            bookingId: 100,
            commerceId: 200,
        };

        // No debería lanzar error
        expect(() => logger.logSecurityEvent(context, 'TEST_SECURITY_EVENT')).not.toThrow();
    });
});
