import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { BookingStatus } from '@/domain/dbEnums/BookingStatus.enum';

/**
 * Servicio de Limpieza de Holds Expirados
 * 
 * PROPÓSITO:
 * Eliminar automáticamente los holds (prereservas) que han expirado
 * después de 15 minutos sin ser confirmados.
 * 
 * FUNCIONAMIENTO:
 * - Se ejecuta cada 1 minuto (configurable)
 * - Busca bookings con status HOLD y expiresAt < now()
 * - Los elimina en batch (máximo 100 por ejecución)
 * - Loguea para monitoreo
 * 
 * FUTURO (con WebSockets):
 * Cuando se elimina un hold, emitir evento para actualizar disponibilidad
 * en tiempo real para usuarios viendo ese día.
 */
@Injectable()
export class HoldCleanupService {
  private readonly logger = new Logger(HoldCleanupService.name);
  private isRunning = false; // Evitar ejecuciones concurrentes

  constructor(private readonly prisma: PrismaService) {}

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
          expiresAt: true,
        },
      });

      if (expiredHolds.length === 0) {
        this.logger.debug('No expired holds found');
        return;
      }

      // Eliminar en batch
      const holdIds = expiredHolds.map(h => h.id);
      
      const result = await this.prisma.booking.deleteMany({
        where: {
          id: { in: holdIds },
          status: BookingStatus.HOLD, // Doble check por seguridad
        },
      });

      this.logger.log(
        `Cleaned up ${result.count} expired holds`,
        {
          holdIds: holdIds,
          expiredCount: expiredHolds.length,
        },
      );

      // TODO: Emitir evento de WebSocket aquí para actualizar disponibilidad
      // this.websocketGateway.emitSlotsAvailable({ userId, date })

    } catch (error) {
      this.logger.error('Error cleaning up expired holds', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Método manual para limpiar holds (útil para testing o admin)
   */
  async manualCleanup(): Promise<number> {
    const result = await this.prisma.booking.deleteMany({
      where: {
        status: BookingStatus.HOLD,
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    this.logger.log(`Manual cleanup: removed ${result.count} expired holds`);
    return result.count;
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
}

