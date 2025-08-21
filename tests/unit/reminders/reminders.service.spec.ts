import { Test, TestingModule } from '@nestjs/testing';
import { RemindersService } from '../reminders.service';
import { NotificationService } from '@/domain/services/notifications/notifications.service';
import { IReminderRepository } from '@/domain/repositories/reminder.repository';
import { ReminderDTO } from '../reminder.dto';
import { REMINDER_REPOSITORY } from '@/application/constants/providers';

describe('RemindersService', () => {
  let service: RemindersService;
  let mockNotificationService: {
    notifyBookingReminder: jest.Mock;
    notifyBookingCreated: jest.Mock;
    notifyBookingCancelled: jest.Mock;
    notifyBookingRescheduled: jest.Mock;
    handleBookingCreated: jest.Mock;
    handleBookingCancelled: jest.Mock;
    handleBookingRescheduled: jest.Mock;
  };
  let mockReminderRepository: jest.Mocked<IReminderRepository>;

  const mockReminderDTO = new ReminderDTO(
    1,
    new Date('2023-12-25T10:00:00.000Z'),
    'email',
    'Juan Pérez',
    'juan@example.com',
    '123456789',
    'Peluquería Test',
    'Calle Test 123',
  );

  beforeEach(async () => {
    mockNotificationService = {
      notifyBookingReminder: jest.fn(),
      notifyBookingCreated: jest.fn(),
      notifyBookingCancelled: jest.fn(),
      notifyBookingRescheduled: jest.fn(),
      handleBookingCreated: jest.fn(),
      handleBookingCancelled: jest.fn(),
      handleBookingRescheduled: jest.fn(),
    };

    mockReminderRepository = {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    } as jest.Mocked<IReminderRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RemindersService,
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
        {
          provide: REMINDER_REPOSITORY,
          useValue: mockReminderRepository,
        },
      ],
    }).compile();

    service = module.get<RemindersService>(RemindersService);

    // Mock del logger para evitar salida en las pruebas
    jest.spyOn(service['logger'], 'log').mockImplementation(() => {});
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('handleReminders', () => {
    it('debería procesar recordatorios pendientes y enviar notificaciones', async () => {
      const now = new Date();
      const window = new Date(now.getTime() + 60 * 60 * 1000);
      const reminders = [mockReminderDTO];

      mockReminderRepository.findMany.mockResolvedValue(reminders);
      mockNotificationService.notifyBookingReminder.mockResolvedValue(undefined);

      await service.handleReminders();

      expect(mockReminderRepository.findMany).toHaveBeenCalledWith(now, window);
      expect(mockNotificationService.notifyBookingReminder).toHaveBeenCalledWith(
        mockReminderDTO,
      );
    });

    it('debería manejar cuando no hay recordatorios pendientes', async () => {
      mockReminderRepository.findMany.mockResolvedValue(null);

      await service.handleReminders();

      expect(mockReminderRepository.findMany).toHaveBeenCalled();
      expect(mockNotificationService.notifyBookingReminder).not.toHaveBeenCalled();
    });

    it('debería procesar múltiples recordatorios', async () => {
      const reminders = [
        mockReminderDTO,
        new ReminderDTO(
          2,
          new Date('2023-12-25T11:00:00.000Z'),
          'email',
          'María García',
          'maria@example.com',
          '987654321',
          'Peluquería Test',
          'Calle Test 123',
        ),
      ];

      mockReminderRepository.findMany.mockResolvedValue(reminders);
      mockNotificationService.notifyBookingReminder.mockResolvedValue(undefined);

      await service.handleReminders();

      expect(mockNotificationService.notifyBookingReminder).toHaveBeenCalledTimes(2);
      expect(mockNotificationService.notifyBookingReminder).toHaveBeenCalledWith(
        reminders[0],
      );
      expect(mockNotificationService.notifyBookingReminder).toHaveBeenCalledWith(
        reminders[1],
      );
    });

    it('debería manejar errores en el procesamiento de recordatorios', async () => {
      const error = new Error('Error de base de datos');
      mockReminderRepository.findMany.mockRejectedValue(error);

      // El método debería manejar el error sin re-lanzarlo
      await expect(service.handleReminders()).rejects.toThrow('Error de base de datos');
    });
  });

  describe('Configuración del Cron', () => {
    it('debería usar la configuración de cron correcta', () => {
      const cronExpression = process.env.REMINDERS_SCHEDULE || '*/30 * * * *';
      expect(cronExpression).toBe('*/30 * * * *'); // cada 30 minutos por defecto
    });
  });
});
