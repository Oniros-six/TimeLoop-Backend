import { Test, TestingModule } from '@nestjs/testing';
import { CreateBooking } from '@/application/use-cases/booking/create.use-case';
import {
  BOOKING_REPOSITORY,
  SERVICE_REPOSITORY,
  USER_REPOSITORY,
  BOOKING_REALTIME_NOTIFIER,
} from '@/application/providers';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RemindersService } from '@/domain/services/reminders/reminders.service';
import { WorkingPatternValidator } from '@/application/services/working-pattern/working-pattern.validator';
import { BookingPersistenceService } from '@/application/services/booking/booking-persistence.service';
import { BookingRealtimeNotifier } from '@/application/services/booking/booking-realtime-notifier.service';
import { CreateBookingDto } from '@/interfaces/controllers/booking/dto/create-booking.dto';
import { BookingStatus } from '@/domain/dbEnums/BookingStatus.enum';
import { AvailabilityUpdateEventDto } from '@/application/dto/availability-update-event.dto';

describe('CreateBooking - Realtime Notifications', () => {
  let useCase: CreateBooking;
  let bookingRealtimeNotifier: BookingRealtimeNotifier;

  const mockBookingRepository = {
    findByIdempotencyKey: jest.fn(),
  };

  const mockServiceRepository = {
    findServicesByUser: jest.fn(),
  };

  const mockUserRepository = {
    findUserByCommerce: jest.fn(),
  };

  const mockBookingRealtimeNotifier = {
    emitAvailabilityUpdate: jest.fn(),
  };

  const mockRemindersService = {
    create: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  const mockWorkingPatternValidator = {
    ensureAvailability: jest.fn(),
  };

  const mockBookingPersistenceService = {
    createBookingWithHistory: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateBooking,
        {
          provide: BOOKING_REPOSITORY,
          useValue: mockBookingRepository,
        },
        {
          provide: SERVICE_REPOSITORY,
          useValue: mockServiceRepository,
        },
        {
          provide: USER_REPOSITORY,
          useValue: mockUserRepository,
        },
        {
          provide: BOOKING_REALTIME_NOTIFIER,
          useValue: mockBookingRealtimeNotifier,
        },
        {
          provide: RemindersService,
          useValue: mockRemindersService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
        {
          provide: WorkingPatternValidator,
          useValue: mockWorkingPatternValidator,
        },
        {
          provide: BookingPersistenceService,
          useValue: mockBookingPersistenceService,
        },
      ],
    }).compile();

    useCase = module.get<CreateBooking>(CreateBooking);
    bookingRealtimeNotifier = module.get<BookingRealtimeNotifier>(BOOKING_REALTIME_NOTIFIER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should emit realtime notification after creating booking', async () => {
    // Arrange
    const createDto: CreateBookingDto = {
      customerId: 1,
      commerceId: 2,
      userId: 3,
      timeStart: new Date('2025-12-20T10:00:00'),
      serviceIds: [1, 2],
      notes: 'Test booking',
    };

    const mockServices = [
      { id: 1, price: 100, duration: 30 },
      { id: 2, price: 50, duration: 15 },
    ];

    const mockUser = { id: 3, commerceId: 2 };

    const createdBooking = {
      id: 123,
      customerId: 1,
      commerceId: 2,
      userId: 3,
      status: BookingStatus.PENDING,
      timeStart: createDto.timeStart,
      timeEnd: new Date('2025-12-20T10:45:00'),
      duration: 45,
      totalPrice: 150,
      notes: 'Test booking',
    };

    mockBookingRepository.findByIdempotencyKey.mockResolvedValue(null);
    mockServiceRepository.findServicesByUser.mockResolvedValue(mockServices);
    mockUserRepository.findUserByCommerce.mockResolvedValue(mockUser);
    mockWorkingPatternValidator.ensureAvailability.mockResolvedValue(true);
    mockBookingPersistenceService.createBookingWithHistory.mockResolvedValue(createdBooking);
    mockRemindersService.create.mockResolvedValue(true);
    mockBookingRealtimeNotifier.emitAvailabilityUpdate.mockResolvedValue(undefined);

    // Act
    await useCase.execute(createDto);

    // Assert
    expect(mockBookingRealtimeNotifier.emitAvailabilityUpdate).toHaveBeenCalledTimes(1);
    expect(mockBookingRealtimeNotifier.emitAvailabilityUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        bookingId: createdBooking.id,
        status: createdBooking.status,
        timeStart: createdBooking.timeStart,
        timeEnd: createdBooking.timeEnd,
        employeeId: createdBooking.userId,
        commerceId: createdBooking.commerceId,
      })
    );
  });

  it('should not fail if realtime notification fails', async () => {
    // Arrange
    const createDto: CreateBookingDto = {
      customerId: 1,
      commerceId: 2,
      userId: 3,
      timeStart: new Date('2025-12-20T10:00:00'),
      serviceIds: [1],
      notes: 'Test booking',
    };

    const mockServices = [{ id: 1, price: 100, duration: 30 }];
    const mockUser = { id: 3, commerceId: 2 };

    const createdBooking = {
      id: 123,
      customerId: 1,
      commerceId: 2,
      userId: 3,
      status: BookingStatus.PENDING,
      timeStart: createDto.timeStart,
      timeEnd: new Date('2025-12-20T10:30:00'),
      duration: 30,
      totalPrice: 100,
      notes: 'Test booking',
    };

    mockBookingRepository.findByIdempotencyKey.mockResolvedValue(null);
    mockServiceRepository.findServicesByUser.mockResolvedValue(mockServices);
    mockUserRepository.findUserByCommerce.mockResolvedValue(mockUser);
    mockWorkingPatternValidator.ensureAvailability.mockResolvedValue(true);
    mockBookingPersistenceService.createBookingWithHistory.mockResolvedValue(createdBooking);
    mockRemindersService.create.mockResolvedValue(true);
    
    // Simular fallo en el notifier
    mockBookingRealtimeNotifier.emitAvailabilityUpdate.mockRejectedValue(
      new Error('WebSocket connection failed')
    );

    // Act
    const result = await useCase.execute(createDto);

    // Assert
    expect(result.statusCode).toBe(200);
    expect(result.data).toEqual(createdBooking);
    expect(mockBookingRealtimeNotifier.emitAvailabilityUpdate).toHaveBeenCalled();
  });

  it('should emit correct AvailabilityUpdateEventDto structure', async () => {
    // Arrange
    const createDto: CreateBookingDto = {
      customerId: 1,
      commerceId: 2,
      userId: 3,
      timeStart: new Date('2025-12-20T10:00:00'),
      serviceIds: [1],
    };

    const mockServices = [{ id: 1, price: 100, duration: 30 }];
    const mockUser = { id: 3, commerceId: 2 };

    const createdBooking = {
      id: 456,
      customerId: 1,
      commerceId: 2,
      userId: 3,
      status: BookingStatus.PENDING,
      timeStart: createDto.timeStart,
      timeEnd: new Date('2025-12-20T10:30:00'),
      duration: 30,
      totalPrice: 100,
      notes: null,
    };

    mockBookingRepository.findByIdempotencyKey.mockResolvedValue(null);
    mockServiceRepository.findServicesByUser.mockResolvedValue(mockServices);
    mockUserRepository.findUserByCommerce.mockResolvedValue(mockUser);
    mockWorkingPatternValidator.ensureAvailability.mockResolvedValue(true);
    mockBookingPersistenceService.createBookingWithHistory.mockResolvedValue(createdBooking);
    mockRemindersService.create.mockResolvedValue(true);
    mockBookingRealtimeNotifier.emitAvailabilityUpdate.mockResolvedValue(undefined);

    // Act
    await useCase.execute(createDto);

    // Assert
    const expectedDto = mockBookingRealtimeNotifier.emitAvailabilityUpdate.mock.calls[0][0];
    expect(expectedDto).toBeInstanceOf(AvailabilityUpdateEventDto);
    expect(expectedDto.bookingId).toBe(456);
    expect(expectedDto.status).toBe(BookingStatus.PENDING);
    expect(expectedDto.commerceId).toBe(2);
    expect(expectedDto.employeeId).toBe(3);
  });
});
