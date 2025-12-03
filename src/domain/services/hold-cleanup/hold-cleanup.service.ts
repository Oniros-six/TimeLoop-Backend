import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { BookingStatus } from '@/domain/dbEnums/BookingStatus.enum';
import { BOOKING_REALTIME_NOTIFIER } from '@/application/providers';
import { BookingRealtimeNotifier } from '@/application/services/booking/booking-realtime-notifier.service';
import { AvailabilityUpdateEventDto } from '@/application/dto/availability-update-event.dto';

/**
 * Servicio de Limpieza de Holds Expirados
 * 
 * PROPÓSITO:
 * Eliminar automáticamente los holds (prereservas) que han expirado
 * después de 5 minutos sin ser confirmados.
 * 
 * FUNCIONAMIENTO:
 * - Se ejecuta cada 1 minuto (configurable)
 * - Busca bookings con status HOLD y expiresAt < now()
 * - Emite evento WebSocket para notificar expiración (status: CANCELED)
 * - Los elimina en batch (máximo 100 por ejecución)
 * - Loguea para monitoreo
 */
@Injectable()
export class HoldCleanupService {
  private readonly logger = new Logger(HoldCleanupService.name);
  private isRunning = false; // Evitar ejecuciones concurrentes

  constructor(
    private readonly prisma: PrismaService,
    
    @Inject(BOOKING_REALTIME_NOTIFIER)
    private readonly bookingRealtimeNotifier: BookingRealtimeNotifier,
  ) {}

  /**
   * Ejecuta cada 1 minuto para limpiar holds expirados
   * 
   * Puedes ajustar la frecuencia:
   * - CronExpression.EVERY_30_SECONDS → Cada 30 segundos (muy agresivo)
   * - CronExpression.EVERY_MINUTE → Cada 1 minuto (recomendado)
   * - CronExpression.EVERY_5_MINUTES → Cada 5 minutos (más relajado)
   * - '* /2 * * * *' → Cada 2 minutos
   */
  @Cron(CronExpression.EVERY_MINUTE, {
    name: 'cleanup-expired-holds',
  })
  async cleanupExpiredHolds() {
    // Evitar ejecuciones concurrentes
    if (this.isRunning) {
      this.logger.debug('Cleanup already running, skipping...');
      return;
    }

    this.isRunning = true;

    try {
      const now = new Date();

      // Buscar holds expirados (máximo 100 por ejecución para no sobrecargar)
      const expiredHolds = await this.prisma.booking.findMany({
        where: {
          status: BookingStatus.HOLD,
          expiresAt: {
            lt: now, // expiresAt < now
          },
        },
        take: 100, // Procesar máximo 100 por vez
        select: {
          id: true,
          customerId: true,
          userId: true,
          timeStart: true,
          timeEnd: true,
          commerceId: true,
          expiresAt: true,
        },
      });

      if (expiredHolds.length === 0) {
        this.logger.debug('No expired holds found');
        return;
      }

      // Primero emitir las notificaciones antes de eliminar los holds
      // para tener acceso a los datos completos
      for (const hold of expiredHolds) {
        try {
          await this.bookingRealtimeNotifier.emitAvailabilityUpdate(
            new AvailabilityUpdateEventDto({
              bookingId: hold.id,
              status: BookingStatus.CANCELED,
              timeStart: hold.timeStart,
              timeEnd: hold.timeEnd,
              employeeId: hold.userId,
              commerceId: hold.commerceId,
            })
          );
        } catch (error) {
          this.logger.error('Failed to emit realtime update for expired hold', {
            holdId: hold.id,
            error: error instanceof Error ? error.message : error,
          });
        }
      }

      // Ahora sí eliminar los holds de la base de datos
      const holdIds = expiredHolds.map((h) => h.id);
      const deletedCount = await this.deleteHoldsCascade(holdIds);

      this.logger.log(`Cleaned up ${deletedCount} expired holds`, {
        holdIds: holdIds,
        expiredCount: expiredHolds.length,
      });

    } catch (error) {
      const details: Record<string, unknown> = {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      };

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        details.code = error.code;
        details.meta = error.meta;
      }

      this.logger.error('Error cleaning up expired holds', details);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Método manual para limpiar holds (útil para testing o admin)
   * También emite eventos WebSocket para notificar expiración
   */
  async manualCleanup(): Promise<number> {
    const now = new Date();
    const expiredHolds = await this.prisma.booking.findMany({
      where: {
        status: BookingStatus.HOLD,
        expiresAt: {
          lt: now,
        },
      },
      select: {
        id: true,
        customerId: true,
        userId: true,
        timeStart: true,
        timeEnd: true,
        commerceId: true,
        expiresAt: true,
      },
    });

    if (expiredHolds.length === 0) {
      this.logger.debug('Manual cleanup: no expired holds to remove');
      return 0;
    }

    // Emitir eventos WebSocket antes de eliminar
    for (const hold of expiredHolds) {
      try {
        await this.bookingRealtimeNotifier.emitAvailabilityUpdate(
          new AvailabilityUpdateEventDto({
            bookingId: hold.id,
            status: BookingStatus.CANCELED,
            timeStart: hold.timeStart,
            timeEnd: hold.timeEnd,
            employeeId: hold.userId,
            commerceId: hold.commerceId,
          })
        );
      } catch (error) {
        this.logger.error('Failed to emit realtime update for expired hold (manual cleanup)', {
          holdId: hold.id,
          error: error instanceof Error ? error.message : error,
        });
      }
    }

    const holdIds = expiredHolds.map((hold) => hold.id);
    const deletedCount = await this.deleteHoldsCascade(holdIds);

    this.logger.log(`Manual cleanup: removed ${deletedCount} expired holds`);
    return deletedCount;
  }

  /**
   * Obtener estadísticas de holds actuales (útil para monitoring)
   */
  async getHoldStats(): Promise<{
    total: number;
    expired: number;
    active: number;
  }> {
    const now = new Date();

    const [total, expired] = await Promise.all([
      this.prisma.booking.count({
        where: { status: BookingStatus.HOLD },
      }),
      this.prisma.booking.count({
        where: {
          status: BookingStatus.HOLD,
          expiresAt: { lt: now },
        },
      }),
    ]);

    return {
      total,
      expired,
      active: total - expired,
    };
  }

  private async deleteHoldsCascade(holdIds: number[]): Promise<number> {
    if (holdIds.length === 0) return 0;

    return this.prisma.$transaction(async (tx) => {
      await tx.bookingService.deleteMany({
        where: { bookingId: { in: holdIds } },
      });

      await tx.bookingHistory.deleteMany({
        where: { bookingId: { in: holdIds } },
      });

      await tx.reminder.deleteMany({
        where: { bookingId: { in: holdIds } },
      });

      await tx.payment.deleteMany({
        where: { bookingId: { in: holdIds } },
      });

      const result = await tx.booking.deleteMany({
        where: {
          id: { in: holdIds },
          status: BookingStatus.HOLD,
        },
      });

      return result.count;
    });
  }
}

