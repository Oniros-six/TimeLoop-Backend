import { Test, TestingModule } from '@nestjs/testing';
import { Booking } from '@/domain/entities/booking.entity';
import { NotificationService } from '../notifications.service';
import {
  BookingCreatedEvent,
  BookingCancelledEvent,
  BookingRescheduledEvent,
} from '@/domain/common/booking.events';
import { BookingDate } from '@/domain/value-objects/booking/booking-date.vo';
import { BookingTime } from '@/domain/value-objects/booking/booking-time.vo';
import { BookingStatus } from '@/domain/value-objects/booking/booking-status.vo';
import { INotificationProvider } from '../notification-provider.interface';
import { ICommerceRepository } from '@/domain/repositories/commerce.repository';
import { Commerce } from '@/domain/entities/commerce.entity';
import { COMMERCE_REPOSITORY } from '@/application/constants/providers';

describe('NotificationService', () => {
  let service: NotificationService;
  let mockNotificationProvider: jest.Mocked<INotificationProvider>;
  let mockCommerceRepository: jest.Mocked<ICommerceRepository>;

  // Mock de Booking
  const mockBooking: Booking = new Booking(
    1, // id
    1, // customerId
    1, // commerceId
    60, // duration
    new BookingStatus('pending'), // status
    1, // serviceId
    new BookingDate(new Date()), // date
    new BookingTime(new Date('1970-01-01T10:00:00')), // timeStart
    'Notas de la reserva', // notes
  );

  // Mock de Commerce
  const mockCommerce = new Commerce(
    1,
    'Test Commerce',
    'test@commerce.com',
    '123456789',
    'Test Address',
    'RESTAURANT' as any,
    true
  );

  beforeEach(async () => {
    // Crear mocks
    mockNotificationProvider = {
      sendEmail: jest.fn(),
      sendWhatsApp: jest.fn(),
    };

    mockCommerceRepository = {
      findCommerce: jest.fn().mockResolvedValue(mockCommerce),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: 'INotificationProvider',
          useValue: mockNotificationProvider,
        },
        {
          provide: COMMERCE_REPOSITORY,
          useValue: mockCommerceRepository,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);

    // Limpiar todos los mocks antes de cada test
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('Manejadores de Eventos', () => {
    it('debería manejar el evento booking.created', async () => {
      const spy = jest.spyOn(service, 'notifyBookingCreated');
      const event = new BookingCreatedEvent(mockBooking);

      // Llamar directamente al manejador de eventos
      await service.handleBookingCreated(event);

      // Verificar que se llamó al método correspondiente
      expect(spy).toHaveBeenCalledWith(mockBooking);
    });

    it('debería manejar el evento booking.cancelled', async () => {
      const spy = jest.spyOn(service, 'notifyBookingCancelled');
      const event = new BookingCancelledEvent(mockBooking);

      await service.handleBookingCancelled(event);

      expect(spy).toHaveBeenCalledWith(mockBooking);
    });

    it('debería manejar el evento booking.rescheduled', async () => {
      const spy = jest.spyOn(service, 'notifyBookingRescheduled');
      const newDate = new Date();
      const event = new BookingRescheduledEvent(mockBooking, newDate);

      await service.handleBookingRescheduled(event);

      expect(spy).toHaveBeenCalledWith(mockBooking, newDate);
    });
  });

  describe('Métodos de Notificación', () => {
    beforeEach(() => {
      // Mock del logger para evitar salida en las pruebas
      jest.spyOn(service['logger'], 'log').mockImplementation(() => {});
    });

    it('debería notificar la creación de una reserva', async () => {
      const loggerSpy = jest.spyOn(service['logger'], 'log');

      await service.notifyBookingCreated(mockBooking);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Notifying booking created: ${mockBooking.id}`),
      );
      expect(mockCommerceRepository.findCommerce).toHaveBeenCalledWith({ commerceId: mockBooking.commerceId });
      expect(mockNotificationProvider.sendEmail).toHaveBeenCalledWith(
        mockCommerce.email,
        'Nueva reserva',
        expect.stringContaining('Se ha creado una reserva')
      );
    });

    it('debería notificar la cancelación de una reserva', async () => {
      const loggerSpy = jest.spyOn(service['logger'], 'log');

      await service.notifyBookingCancelled(mockBooking);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          `Notifying booking cancelled: ${mockBooking.id}`,
        ),
      );
      expect(mockCommerceRepository.findCommerce).toHaveBeenCalledWith({ commerceId: mockBooking.commerceId });
      expect(mockNotificationProvider.sendEmail).toHaveBeenCalledWith(
        mockCommerce.email,
        'Reserva cancelada',
        expect.stringContaining('Se ha cancelado una reserva')
      );
    });

    it('debería notificar la reprogramación de una reserva', async () => {
      const loggerSpy = jest.spyOn(service['logger'], 'log');
      const newDate = new Date('2023-12-25T10:00:00.000Z');

      await service.notifyBookingRescheduled(mockBooking, newDate);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          `Notifying booking rescheduled: ${mockBooking.id} to ${newDate.toISOString()}`,
        ),
      );
      expect(mockCommerceRepository.findCommerce).toHaveBeenCalledWith({ commerceId: mockBooking.commerceId });
      expect(mockNotificationProvider.sendEmail).toHaveBeenCalledWith(
        mockCommerce.email,
        'Reserva reprogramada',
        expect.stringContaining('Se ha reprogramado una reserva')
      );
    });

    it('debería lanzar error si no encuentra el commerce', async () => {
      mockCommerceRepository.findCommerce.mockResolvedValue(null);

      await expect(service.notifyBookingCreated(mockBooking)).rejects.toThrow('Commerce not found');
    });
  });

  describe('Manejo de Errores en Eventos', () => {
    it('debería capturar y loggear errores en el manejador de booking.created sin re-lanzarlos', async () => {
      const error = new Error('Error de prueba');
      const errorSpy = jest
        .spyOn(service['logger'], 'error')
        .mockImplementation(() => {});

      // Mock para que falle el método notifyBookingCreated
      jest.spyOn(service, 'notifyBookingCreated').mockRejectedValueOnce(error);

      const event = new BookingCreatedEvent(mockBooking);

      // El manejador de eventos debe capturar el error y no re-lanzarlo
      await expect(service.handleBookingCreated(event)).resolves.toBeUndefined();

      // Verificar que se registró el error
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to handle BookingCreatedEvent for booking'),
        expect.anything(),
      );
    });

    it('debería capturar y loggear errores en el manejador de booking.cancelled sin re-lanzarlos', async () => {
      const error = new Error('Error de prueba');
      const errorSpy = jest
        .spyOn(service['logger'], 'error')
        .mockImplementation(() => {});

      // Mock para que falle el método notifyBookingCancelled
      jest.spyOn(service, 'notifyBookingCancelled').mockRejectedValueOnce(error);

      const event = new BookingCancelledEvent(mockBooking);

      // El manejador de eventos debe capturar el error y no re-lanzarlo
      await expect(service.handleBookingCancelled(event)).resolves.toBeUndefined();

      // Verificar que se registró el error
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to handle BookingCancelledEvent for booking'),
        expect.anything(),
      );
    });

    it('debería capturar y loggear errores en el manejador de booking.rescheduled sin re-lanzarlos', async () => {
      const error = new Error('Error de prueba');
      const errorSpy = jest
        .spyOn(service['logger'], 'error')
        .mockImplementation(() => {});

      // Mock para que falle el método notifyBookingRescheduled
      jest.spyOn(service, 'notifyBookingRescheduled').mockRejectedValueOnce(error);

      const event = new BookingRescheduledEvent(mockBooking, new Date());

      // El manejador de eventos debe capturar el error y no re-lanzarlo
      await expect(service.handleBookingRescheduled(event)).resolves.toBeUndefined();

      // Verificar que se registró el error
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to handle BookingRescheduledEvent for booking'),
        expect.anything(),
      );
    });
  });
});
