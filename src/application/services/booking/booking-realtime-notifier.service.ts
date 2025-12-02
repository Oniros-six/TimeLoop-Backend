import { Injectable, Logger } from '@nestjs/common';
import { BookingRealtimeGateway } from '@/interfaces/gateways/booking/booking-realtime.gateway';
import { AvailabilityUpdateEventDto } from '@/application/dto/availability-update-event.dto';

@Injectable()
export class BookingRealtimeNotifier {
  private readonly logger = new Logger(BookingRealtimeNotifier.name);

  constructor(
    private readonly bookingGateway: BookingRealtimeGateway,
  ) {}

  /**
   * Emite una actualización de disponibilidad a todos los clientes conectados
   * a la sala del comercio específico.
   * 
   * @param dto - Datos del evento de actualización
   */
  async emitAvailabilityUpdate(dto: AvailabilityUpdateEventDto): Promise<void> {
    try {
      // Usar Promise.resolve para manejar casos donde el gateway no esté disponible
      await Promise.resolve(
        this.bookingGateway.emitToCommerce(
          dto.commerceId,
          'availabilityUpdated',
          {
            bookingId: dto.bookingId,
            status: dto.status,
            timeStart: dto.timeStart,
            timeEnd: dto.timeEnd,
            employeeId: dto.employeeId,
            commerceId: dto.commerceId,
          }
        )
      ).catch((error) => {
        // Solo loggear el error, no propagar para no afectar el flujo principal
        this.logger.error(
          `Failed to emit availability update for commerce ${dto.commerceId}`,
          error
        );
      });

      this.logger.debug(
        `Availability update emitted for booking ${dto.bookingId} in commerce ${dto.commerceId}`
      );
    } catch (error) {
      // Captura adicional por si algo falla antes del Promise.resolve
      this.logger.error(
        `Unexpected error emitting availability update for commerce ${dto.commerceId}`,
        error
      );
    }
  }
}
