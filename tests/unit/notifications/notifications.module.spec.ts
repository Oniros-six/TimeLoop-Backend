import { Test, TestingModule } from '@nestjs/testing';
import { NotificationModule } from '../../../src/domain/services/notifications/notifications.module';
import { NotificationService } from '../../../src/domain/services/notifications/notifications.service';
import { INotificationProvider } from '../../../src/domain/services/notifications/notification-provider.interface';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { ICommerceRepository } from '@/domain/repositories/commerce.repository';
import { COMMERCE_REPOSITORY } from '@/application/providers';

describe('NotificationModule', () => {
  let module: TestingModule;
  let notificationService: NotificationService;
  let notificationProvider: INotificationProvider;
  let prismaService: PrismaService;
  let commerceRepository: ICommerceRepository;

  beforeEach(async () => {
    // Mock de las variables de entorno necesarias
    process.env.RESEND_API_KEY = 'test_api_key';
    process.env.FROM_EMAIL = 'test@example.com';

    module = await Test.createTestingModule({
      imports: [NotificationModule],
    }).compile();

    notificationService = module.get<NotificationService>(NotificationService);
    notificationProvider = module.get<INotificationProvider>(
      'INotificationProvider',
    );
    prismaService = module.get<PrismaService>(PrismaService);
    commerceRepository = module.get<ICommerceRepository>(COMMERCE_REPOSITORY);
  });

  afterEach(() => {
    // Limpiar las variables de entorno mock
    delete process.env.RESEND_API_KEY;
    delete process.env.FROM_EMAIL;
  });

  it('debería estar definido', () => {
    expect(module).toBeDefined();
  });

  it('debería proporcionar NotificationService', () => {
    expect(notificationService).toBeDefined();
    expect(typeof notificationService.notifyBookingCreated).toBe('function');
    expect(typeof notificationService.notifyBookingCancelled).toBe('function');
    expect(typeof notificationService.notifyBookingRescheduled).toBe(
      'function',
    );
  });

  it('debería proporcionar INotificationProvider', () => {
    expect(notificationProvider).toBeDefined();
    expect(typeof notificationProvider.sendEmail).toBe('function');
    expect(typeof notificationProvider.sendWhatsApp).toBe('function');
  });

  it('debería proporcionar PrismaService', () => {
    expect(prismaService).toBeDefined();
    expect(typeof prismaService).toBe('object');
  });

  it('debería proporcionar CommerceRepository', () => {
    expect(commerceRepository).toBeDefined();
    expect(typeof commerceRepository.findCommerce).toBe('function');
  });

  it('debería exportar NotificationService', () => {
    const exportedService =
      module.get<NotificationService>(NotificationService);
    expect(exportedService).toBeDefined();
  });

  it('debería tener la configuración correcta de providers', () => {
    const moduleRef = module.get(NotificationModule);
    expect(moduleRef).toBeDefined();
  });
});
