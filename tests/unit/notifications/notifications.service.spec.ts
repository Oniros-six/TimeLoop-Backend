/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from '../../../src/domain/services/notifications/notifications.service';
import {
  BookingCreatedEvent,
  BookingCanceledEvent,
  BookingRescheduledEvent,
} from '@/domain/common/booking.events';
import { INotificationProvider } from '../../../src/domain/services/notifications/notification-provider.interface';
import { ICommerceRepository } from '@/domain/repositories/commerce.repository';
import { Commerce } from '@/domain/entities/commerce.entity';
import {
  BOOKING_REPOSITORY,
  COMMERCE_REPOSITORY,
  REMINDER_REPOSITORY,
  USER_REPOSITORY,
} from '@/application/providers';
import { IReminderRepository } from '@/domain/repositories/reminder.repository';
import { IBookingRepository } from '@/domain/repositories/booking.repository';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { Booking } from '@/domain/entities/booking.entity';
import { BusinessCategory } from '@/domain/dbEnums/BusinessCategory.enum';
import { ReminderDTO } from '@/domain/services/reminders/reminder.dto';

describe('NotificationService', () => {
  let service: NotificationService;
  let mockNotificationProvider: jest.Mocked<INotificationProvider>;
  let mockCommerceRepository: jest.Mocked<ICommerceRepository>;
  let mockBookingRepository: jest.Mocked<IBookingRepository>;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockReminderRepository: jest.Mocked<IReminderRepository>;

  // Mock de Booking
  const now = new Date('2024-01-01T10:00:00.000Z');
  const mockBooking = {
    id: 1,
    customerId: 10,
    commerceId: 1,
    duration: 60,
    userId: 5,
    status: 'pending',
    timeStart: now,
    timeEnd: new Date(now.getTime() + 60 * 60 * 1000),
    notes: 'Notas de la reserva',
    totalPrice: 100,
    bookingServices: [],
  } as unknown as Booking;

  // Mock de Commerce
  const mockCommerce = new Commerce(
    1,
    'Test Commerce',
    'test@commerce.com',
    '123456789',
    'Test Address',
    BusinessCategory.Peluqueria,
    true,
  );

  beforeEach(async () => {
    // Crear mocks
    mockNotificationProvider = {
      sendEmail: jest.fn().mockResolvedValue({} as any),
      sendWhatsApp: jest.fn(),
    };

    mockCommerceRepository = {
      findCommerce: jest.fn().mockResolvedValue(mockCommerce),
      findCommerceByName: jest.fn(),
      findCommerceByEmail: jest.fn(),
      findCommerceByPhone: jest.fn(),
      suspendCommerce: jest.fn(),
      reinstateCommerce: jest.fn(),
      createCommerce: jest.fn(),
      updateCommerce: jest.fn(),
      updateLogo: jest.fn(),
      findAllActive: jest.fn(),
      deleteCommerce: jest.fn(),
    } as jest.Mocked<ICommerceRepository>;

    mockBookingRepository = {
      findOne: jest.fn().mockResolvedValue(mockBooking),
    } as unknown as jest.Mocked<IBookingRepository>;

    mockUserRepository = {
      findUser: jest.fn().mockResolvedValue({ id: 5, name: 'Profesional Test' }),
    } as unknown as jest.Mocked<IUserRepository>;

    mockReminderRepository = {
      create: jest.fn(),
      updateSent: jest.fn(),
      updateReminder: jest.fn(),
      findMany: jest.fn(),
      cancelReminder: jest.fn(),
    } as jest.Mocked<IReminderRepository>;

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
        {
          provide: BOOKING_REPOSITORY,
          useValue: mockBookingRepository,
        },
        {
          provide: USER_REPOSITORY,
          useValue: mockUserRepository,
        },
        {
          provide: REMINDER_REPOSITORY,
          useValue: mockReminderRepository,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);

    // Limpiar todos los mocks antes de cada test y restaurar implementaciones base
    jest.clearAllMocks();
    mockNotificationProvider.sendEmail.mockResolvedValue({} as any);
    mockCommerceRepository.findCommerce.mockResolvedValue(mockCommerce);
    mockBookingRepository.findOne.mockResolvedValue(mockBooking);
    mockUserRepository.findUser.mockResolvedValue({
      id: 5,
      name: 'Profesional Test',
    } as any);
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

    it('debería manejar el evento booking.canceled', async () => {
      const spy = jest.spyOn(service, 'notifyBookingCanceled');
      const event = new BookingCanceledEvent(mockBooking);

      await service.handleBookingCanceled(event);

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
      expect(mockCommerceRepository.findCommerce).toHaveBeenCalledWith({
        commerceId: mockBooking.commerceId,
      });
      expect(mockNotificationProvider.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: mockCommerce.email,
          subject: 'Nueva reserva',
          text: expect.stringContaining('¡Tu agenda tiene una nueva reserva!'),
        }),
      );
    });

    it('debería notificar la cancelación de una reserva', async () => {
      const loggerSpy = jest.spyOn(service['logger'], 'log');

      await service.notifyBookingCanceled(mockBooking);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          `Notifying booking canceled: ${mockBooking.id}`,
        ),
      );
      expect(mockCommerceRepository.findCommerce).toHaveBeenCalledWith({
        commerceId: mockBooking.commerceId,
      });
      expect(mockNotificationProvider.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: mockCommerce.email,
          subject: 'Reserva cancelada',
          text: expect.stringContaining('Una reserva ha sido cancelada.'),
        }),
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
      expect(mockCommerceRepository.findCommerce).toHaveBeenCalledWith({
        commerceId: mockBooking.commerceId,
      });
      expect(mockNotificationProvider.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: mockCommerce.email,
          subject: 'Reserva reprogramada',
          text: expect.stringContaining('Una reserva ha sido reprogramada.'),
        }),
      );
    });

    it('debería lanzar error si no encuentra el commerce', async () => {
      mockCommerceRepository.findCommerce.mockResolvedValue(null);

      await expect(service.notifyBookingCreated(mockBooking)).rejects.toThrow(
        'Commerce not found',
      );
    });

    it('debería enviar recordatorio con HTML y texto plano', async () => {
      const reminder = new ReminderDTO(
        10,
        mockBooking.id,
        mockCommerce.id,
        new Date('2024-02-01T09:00:00.000Z'),
        'email',
        'Cliente Demo',
        'cliente@example.com',
        '123456789',
        mockCommerce.name,
        'Dirección Demo 123',
        'https://example.com/cancel',
      );

      await service.notifyBookingReminder(reminder);

      expect(mockNotificationProvider.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'cliente@example.com',
          subject: 'Recordatorio de reserva',
          text: expect.stringContaining('Cliente Demo'),
          html: expect.stringContaining('<!DOCTYPE html>'),
        }),
      );
      expect(mockReminderRepository.updateSent).toHaveBeenCalledWith(reminder.id);
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
      await expect(
        service.handleBookingCreated(event),
      ).resolves.toBeUndefined();

      // Verificar que se registró el error
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Failed to handle BookingCreatedEvent for booking',
        ),
        expect.anything(),
      );
    });

    it('debería capturar y loggear errores en el manejador de booking.canceled sin re-lanzarlos', async () => {
      const error = new Error('Error de prueba');
      const errorSpy = jest
        .spyOn(service['logger'], 'error')
        .mockImplementation(() => {});

      // Mock para que falle el método notifyBookingcanceled
      jest
        .spyOn(service, 'notifyBookingCanceled')
        .mockRejectedValueOnce(error);

      const event = new BookingCanceledEvent(mockBooking);

      // El manejador de eventos debe capturar el error y no re-lanzarlo
      await expect(
        service.handleBookingCanceled(event),
      ).resolves.toBeUndefined();

      // Verificar que se registró el error
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Failed to handle BookingCanceledEvent for booking',
        ),
        expect.anything(),
      );
    });

    it('debería capturar y loggear errores en el manejador de booking.rescheduled sin re-lanzarlos', async () => {
      const error = new Error('Error de prueba');
      const errorSpy = jest
        .spyOn(service['logger'], 'error')
        .mockImplementation(() => {});

      // Mock para que falle el método notifyBookingRescheduled
      jest
        .spyOn(service, 'notifyBookingRescheduled')
        .mockRejectedValueOnce(error);

      const event = new BookingRescheduledEvent(mockBooking, new Date());

      // El manejador de eventos debe capturar el error y no re-lanzarlo
      await expect(
        service.handleBookingRescheduled(event),
      ).resolves.toBeUndefined();

      // Verificar que se registró el error
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Failed to handle BookingRescheduledEvent for booking',
        ),
        expect.anything(),
      );
    });
  });
});
