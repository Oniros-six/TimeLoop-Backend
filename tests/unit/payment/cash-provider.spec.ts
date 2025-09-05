import { Test, TestingModule } from '@nestjs/testing';
import { CashProvider } from '@/domain/services/payment/providers/CashProvider';
import { Payment } from '@/domain/entities/payment.entity';
import { PaymentStatus } from '@/domain/dbEnums/PaymentStatus.enum';
import { PaymentMethod } from '@/domain/dbEnums/PaymentMethods.enum';
import { Currency } from '@/domain/dbEnums/Currency.enum';

describe('CashProvider', () => {
  let provider: CashProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CashProvider],
    }).compile();

    provider = module.get<CashProvider>(CashProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  describe('processPayment', () => {
    const mockPayment = new Payment(
      123, // id
      456, // bookingId
      789, // commerceId
      1500, // amount
      Currency.UYU, // currency
      PaymentStatus.pending, // status
      PaymentMethod.CASH, // method
      new Date('2024-01-15T10:00:00Z'), // createdAt
      null, // updatedAt
      null, // providerRef
      null, // refundedAt
    );

    it('should process cash payment successfully', async () => {
      const result = await provider.processPayment(mockPayment);

      expect(result).toEqual({
        success: true,
        status: PaymentStatus.pending,
        providerRef: expect.stringMatching(/^CASH_123_\d+$/),
        redirectUrl: '',
        error: null,
      });
    });

    it('should generate unique providerRef for each payment', async () => {
      // Agregar un pequeño delay para asegurar timestamps diferentes
      const result1 = await provider.processPayment(mockPayment);
      await new Promise(resolve => setTimeout(resolve, 1));
      const result2 = await provider.processPayment(mockPayment);

      expect(result1.providerRef).not.toBe(result2.providerRef);
      expect(result1.providerRef).toMatch(/^CASH_123_\d+$/);
      expect(result2.providerRef).toMatch(/^CASH_123_\d+$/);
    });

    it('should include payment ID in providerRef', async () => {
      const paymentWithDifferentId = new Payment(
        999, // different id
        mockPayment.bookingId,
        mockPayment.commerceId,
        mockPayment.amount,
        mockPayment.currency,
        mockPayment.status,
        mockPayment.method,
        mockPayment.createdAt,
        mockPayment.updatedAt,
        mockPayment.providerRef,
        mockPayment.refundedAt,
      );

      const result = await provider.processPayment(paymentWithDifferentId);

      expect(result.providerRef).toMatch(/^CASH_999_\d+$/);
    });

    it('should always return pending status for cash payments', async () => {
      const result = await provider.processPayment(mockPayment);

      expect(result.status).toBe(PaymentStatus.pending);
      expect(result.success).toBe(true);
    });

    it('should return empty redirectUrl for cash payments', async () => {
      const result = await provider.processPayment(mockPayment);

      expect(result.redirectUrl).toBe('');
    });

    it('should handle different payment amounts correctly', async () => {
      const highAmountPayment = new Payment(
        123,
        456,
        789,
        50000, // high amount
        Currency.USD,
        PaymentStatus.pending,
        PaymentMethod.CASH,
        new Date(),
        null,
        null,
        null,
      );

      const result = await provider.processPayment(highAmountPayment);

      expect(result.success).toBe(true);
      expect(result.status).toBe(PaymentStatus.pending);
      expect(result.providerRef).toMatch(/^CASH_123_\d+$/);
    });

    it('should handle different currencies correctly', async () => {
      const eurPayment = new Payment(
        123,
        456,
        789,
        1000,
        Currency.EUR,
        PaymentStatus.pending,
        PaymentMethod.CASH,
        new Date(),
        null,
        null,
        null,
      );

      const result = await provider.processPayment(eurPayment);

      expect(result.success).toBe(true);
      expect(result.status).toBe(PaymentStatus.pending);
      expect(result.providerRef).toMatch(/^CASH_123_\d+$/);
    });

    it('should handle different commerce IDs correctly', async () => {
      const differentCommercePayment = new Payment(
        123,
        456,
        999, // different commerceId
        1000,
        Currency.UYU,
        PaymentStatus.pending,
        PaymentMethod.CASH,
        new Date(),
        null,
        null,
        null,
      );

      const result = await provider.processPayment(differentCommercePayment);

      expect(result.success).toBe(true);
      expect(result.status).toBe(PaymentStatus.pending);
      expect(result.providerRef).toMatch(/^CASH_123_\d+$/);
    });
  });

  describe('Error Handling', () => {
    it('should handle null payment gracefully', async () => {
      // Mock Date.now para evitar problemas con el timestamp
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => 1234567890);

      try {
        const result = await provider.processPayment(null as any);

        expect(result.success).toBe(false);
        expect(result.status).toBe(PaymentStatus.rejected);
        expect(result.providerRef).toBeUndefined();
        expect(result.error).toBeDefined();
      } finally {
        Date.now = originalDateNow;
      }
    });

    it('should handle undefined payment gracefully', async () => {
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => 1234567890);

      try {
        const result = await provider.processPayment(undefined as any);

        expect(result.success).toBe(false);
        expect(result.status).toBe(PaymentStatus.rejected);
        expect(result.providerRef).toBeUndefined();
        expect(result.error).toBeDefined();
      } finally {
        Date.now = originalDateNow;
      }
    });

    it('should handle payment with missing properties gracefully', async () => {
      const incompletePayment = {
        id: 123,
        // missing other properties
      } as any;

      const originalDateNow = Date.now;
      Date.now = jest.fn(() => 1234567890);

      try {
        const result = await provider.processPayment(incompletePayment);

        // El CashProvider actual maneja errores de forma básica
        // Si no hay error, debería procesar exitosamente
        expect(result.success).toBe(true);
        expect(result.status).toBe(PaymentStatus.pending);
        expect(result.providerRef).toMatch(/^CASH_123_\d+$/);
        expect(result.error).toBeNull();
      } finally {
        Date.now = originalDateNow;
      }
    });
  });

  describe('ProviderRef Format', () => {
    it('should generate providerRef with correct format', async () => {
      const payment = new Payment(
        42,
        100,
        200,
        500,
        Currency.UYU,
        PaymentStatus.pending,
        PaymentMethod.CASH,
        new Date(),
        null,
        null,
        null,
      );

      const result = await provider.processPayment(payment);

      // Verificar que el formato es CASH_{paymentId}_{timestamp}
      expect(result.providerRef).toMatch(/^CASH_42_\d{13}$/);
    });

    it('should include timestamp in providerRef', async () => {
      const mockPayment = new Payment(
        123,
        456,
        789,
        1500,
        Currency.UYU,
        PaymentStatus.pending,
        PaymentMethod.CASH,
        new Date('2024-01-15T10:00:00Z'),
        null,
        null,
        null,
      );

      const beforeTime = Date.now();
      const result = await provider.processPayment(mockPayment);
      const afterTime = Date.now();

      const timestampMatch = result.providerRef?.match(/^CASH_123_(\d+)$/);
      expect(timestampMatch).toBeTruthy();

      const timestamp = parseInt(timestampMatch![1]);
      expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(timestamp).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('Interface Compliance', () => {
    it('should implement IPaymentProvider interface', () => {
      expect(provider.processPayment).toBeDefined();
      expect(typeof provider.processPayment).toBe('function');
    });

    it('should not implement optional methods from interface', () => {
      // Los métodos opcionales no están implementados en CashProvider
      expect((provider as any).processRefund).toBeUndefined();
      expect((provider as any).verifyPayment).toBeUndefined();
    });
  });
});
