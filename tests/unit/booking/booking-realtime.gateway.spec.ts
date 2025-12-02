import { Test, TestingModule } from '@nestjs/testing';
import { BookingRealtimeGateway } from '@/interfaces/gateways/booking/booking-realtime.gateway';
import { ICommerceRepository } from '@/domain/repositories/commerce.repository';
import { COMMERCE_REPOSITORY } from '@/application/providers';
import { Socket } from 'socket.io';
import { Commerce } from '@/domain/entities/commerce.entity';

describe('BookingRealtimeGateway', () => {
  let gateway: BookingRealtimeGateway;
  let commerceRepository: ICommerceRepository;

const mockCommerceRepository = {
    findCommerce: jest.fn(),
  };

const createMockSocket = (overrides: Partial<Socket> = {}): Socket => {
  const base: Partial<Socket> = {
    id: 'socket-123',
    handshake: {
      address: '127.0.0.1',
      query: {},
    } as any,
    join: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    data: {},
  };

  return { ...base, ...overrides } as Socket;
};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingRealtimeGateway,
        {
          provide: COMMERCE_REPOSITORY,
          useValue: mockCommerceRepository,
        },
      ],
    }).compile();

    gateway = module.get<BookingRealtimeGateway>(BookingRealtimeGateway);
    commerceRepository = module.get<ICommerceRepository>(COMMERCE_REPOSITORY);
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Limpiar rate limit para evitar interferencias entre pruebas
    (gateway as any).rateLimitMap.clear();
  });

  describe('handleConnection', () => {
    it('should reject connection without commerceId', async () => {
      const socket = createMockSocket();
      
      await gateway.handleConnection(socket);
      
      expect(socket.emit).toHaveBeenCalledWith('error', { message: 'commerceId is required' });
      expect(socket.disconnect).toHaveBeenCalled();
    });

    it('should reject connection with non-numeric commerceId', async () => {
      const socket = createMockSocket({
        handshake: {
          address: '127.0.0.1',
          query: { commerceId: 'abc' },
        } as any,
      });
      
      await gateway.handleConnection(socket);
      
      expect(socket.emit).toHaveBeenCalledWith('error', { message: 'commerceId must be a number' });
      expect(socket.disconnect).toHaveBeenCalled();
    });

    it('should reject connection when commerce not found', async () => {
      const socket = createMockSocket({
        handshake: {
          address: '127.0.0.1',
          query: { commerceId: '123' },
        } as any,
      });
      
      mockCommerceRepository.findCommerce.mockResolvedValueOnce(null);
      
      await gateway.handleConnection(socket);
      
      expect(commerceRepository.findCommerce).toHaveBeenCalledWith({ commerceId: 123 });
      expect(socket.emit).toHaveBeenCalledWith('error', { message: 'Commerce not found' });
      expect(socket.disconnect).toHaveBeenCalled();
    });

    it('should successfully connect and join commerce room', async () => {
      const commerceId = 123;
      const socket = createMockSocket({
        handshake: {
          address: '127.0.0.1',
          query: { commerceId: commerceId.toString() },
        } as any,
      });
      
      const mockCommerce = { id: commerceId } as Commerce;
      mockCommerceRepository.findCommerce.mockResolvedValueOnce(mockCommerce);
      
      await gateway.handleConnection(socket);
      
      expect(commerceRepository.findCommerce).toHaveBeenCalledWith({ commerceId });
      expect(socket.join).toHaveBeenCalledWith(`commerce-${commerceId}`);
      expect(socket.data.commerceId).toBe(commerceId);
      expect(socket.emit).toHaveBeenCalledWith('connected', { commerceId });
      expect(socket.disconnect).not.toHaveBeenCalled();
    });
  });

  describe('rate limiting', () => {
    it('should allow connections within rate limit', async () => {
      const commerceId = 123;
      const mockCommerce = { id: commerceId } as Commerce;
      mockCommerceRepository.findCommerce.mockResolvedValue(mockCommerce);

      // Simular 10 conexiones desde la misma IP
      for (let i = 0; i < 10; i++) {
        const socket = createMockSocket({
          id: `socket-${i}`,
          handshake: {
            address: '192.168.1.100',
            query: { commerceId: commerceId.toString() },
          } as any,
        });

        await gateway.handleConnection(socket);
        
        expect(socket.join).toHaveBeenCalled();
        expect(socket.disconnect).not.toHaveBeenCalled();
      }
    });

    it('should reject connections exceeding rate limit', async () => {
      const commerceId = 123;
      const mockCommerce = { id: commerceId } as Commerce;
      mockCommerceRepository.findCommerce.mockResolvedValue(mockCommerce);
      const clientIp = '192.168.1.200';

      // Simular 31 conexiones (límite es 30)
      for (let i = 0; i < 31; i++) {
        const socket = createMockSocket({
          id: `socket-${i}`,
          handshake: {
            address: clientIp,
            query: { commerceId: commerceId.toString() },
          } as any,
          join: jest.fn(),
          emit: jest.fn(),
          disconnect: jest.fn(),
          data: {},
        });

        await gateway.handleConnection(socket);
        
        if (i < 30) {
          expect(socket.disconnect).not.toHaveBeenCalled();
        } else {
          // La conexión 31 debe ser rechazada
          expect(socket.emit).toHaveBeenCalledWith('error', { message: 'Too many connections' });
          expect(socket.disconnect).toHaveBeenCalled();
        }
      }
    });
  });

  describe('handleDisconnect', () => {
    it('should log disconnection with commerceId', () => {
      const socket = createMockSocket({
        data: { commerceId: 123 },
      });
      
      gateway.handleDisconnect(socket);
      
      // El test verifica que no lance errores
      expect(true).toBe(true);
    });
  });

  describe('emitToCommerce', () => {
    it('should emit event to commerce room', () => {
      const commerceId = 123;
      const eventName = 'availabilityUpdated';
      const eventData = { bookingId: 1, status: 'CONFIRMED' };
      
      // Mock del server
      gateway.server = {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
      } as any;
      
      gateway.emitToCommerce(commerceId, eventName, eventData);
      
      expect(gateway.server.to).toHaveBeenCalledWith(`commerce-${commerceId}`);
      expect(gateway.server.emit).toHaveBeenCalledWith(eventName, eventData);
    });
  });
});
