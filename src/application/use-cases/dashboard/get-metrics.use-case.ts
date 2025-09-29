import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BOOKING_HISTORY_REPOSITORY, METRICS_REPOSITORY, USER_REPOSITORY } from '@/application/providers';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { IBookingHistoryRepository } from '@/domain/repositories/bookingHistory.repository';
import { BookingHistory } from '@prisma/client';
import { IMetricsRepository } from '@/domain/repositories/metrics.repository';

@Injectable()
export class GetDashboardMetrics {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,

        @Inject(BOOKING_HISTORY_REPOSITORY)
        private readonly bookingHistoryRepository: IBookingHistoryRepository,

        @Inject(METRICS_REPOSITORY)
        private readonly metricsRepository: IMetricsRepository
    ) { }

    private getDateRanges() {
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

        let sameDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
        sameDayLastMonth.setHours(23, 59, 59, 999);

        // Ajuste si el día no existe en el mes anterior
        if (sameDayLastMonth.getMonth() !== (today.getMonth() + 11) % 12) {
            sameDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        }

        const firstDayThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        return { today, firstDayLastMonth, sameDayLastMonth, firstDayThisMonth };
    }

    private calculateDiffPorcentual(previous: number, current: number) {
        let diff: number;

        if (previous === 0) {
            diff = current > 0 ? 100 : 0;
        } else {
            diff = ((current - previous) / previous) * 100;
        }

        return diff
    }

    private calculateRushHour(previousMonthBookings: BookingHistory[]) {
        function getMinutesSinceMidnight(date: Date) {
            return date.getHours() * 60 + date.getMinutes();
        }
        
        const slotSize = 30; // minutos
        const totalSlots = 24 * 60 / slotSize; // cantidad de minutos en un día, 96 slots por día
        const slots = Array(totalSlots).fill(0); // contador de reservas por slot

        for (const booking of previousMonthBookings) {
            let start = getMinutesSinceMidnight(booking.timeStart);
            let end = getMinutesSinceMidnight(booking.timeEnd);

            // recorrer los slots que cubre esta reserva
            for (let t = start; t < end; t += slotSize) {
                const slotIndex = Math.floor(t / slotSize);
                slots[slotIndex]++;
            }
        }

        let maxCount = 0;
        let peakSlotIndex = 0;

        slots.forEach((count, index) => {
            if (count > maxCount) {
                maxCount = count;
                peakSlotIndex = index;
            }
        });

        // Convertir slot a hora:minuto
        const peakStartMinutes = peakSlotIndex * slotSize;
        const peakEndMinutes = peakStartMinutes + slotSize;

        const peakStartHour = Math.floor(peakStartMinutes / 60);
        const peakStartMinute = peakStartMinutes % 60;
        const peakEndHour = Math.floor(peakEndMinutes / 60);
        const peakEndMinute = peakEndMinutes % 60;

        return {
            peakRange: {
                start: `${peakStartHour}:${peakStartMinute.toString().padStart(2, "0")}`,
                end: `${peakEndHour}:${peakEndMinute.toString().padStart(2, "0")}`,
            },
            maxBookings: maxCount,
        };
    }

    async execute(id: number) {
        const { today, firstDayLastMonth, sameDayLastMonth, firstDayThisMonth } = this.getDateRanges();

        const user = await this.userRepository.findUser({ userId: id });
        if (!user) {
            throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND);
        }

        //* Metricas de ingresos
        //* ====================
        const previousMonthBookings = await this.bookingHistoryRepository.findByDatesAndCommerce({
            commerceId: user.commerceId,
            startDate: firstDayLastMonth,
            endDate: sameDayLastMonth,
        });

        const actualMonthBookings = await this.bookingHistoryRepository.findByDatesAndCommerce({
            commerceId: user.commerceId,
            startDate: firstDayThisMonth,
            endDate: today,
        });

        const earnsPastMonth = previousMonthBookings.reduce((t, p) => t + (p.priceAtBooking ?? 0), 0);
        const earnsThisMonth = actualMonthBookings.reduce((t, p) => t + (p.priceAtBooking ?? 0), 0);

        const earnsDiff = this.calculateDiffPorcentual(earnsPastMonth, earnsThisMonth);

        const earnsMetrics = {
            earnsPastMonth,
            earnsThisMonth,
            earnsDiff
        }

        //* Reservas este mes
        //* =================
        const bookingsThisMonth = actualMonthBookings.length
        const bookingsPastMonth = previousMonthBookings.length
        const bookingsDiff = this.calculateDiffPorcentual(bookingsThisMonth, bookingsPastMonth)

        const bookingsMetrics = {
            bookingsThisMonth,
            bookingsPastMonth,
            bookingsDiff
        }

        //* Horario pico
        //* ============
        const rushHoursMetrics = this.calculateRushHour(previousMonthBookings)

        //* Clientes nuevos este mes
        //* ============
        const newClientsThisMonth = await this.metricsRepository.findFirstReservation(
            {
                commerceId: user.commerceId,
                startDate: firstDayThisMonth,
                endDate: today,
            }
        )
        const newClientsLastMonth = await this.metricsRepository.findFirstReservation(
            {
                commerceId: user.commerceId,
                startDate: firstDayLastMonth,
                endDate: sameDayLastMonth,
            }
        )
        const newClientsDiff = this.calculateDiffPorcentual(newClientsLastMonth, newClientsThisMonth)

        const newClientsMetrics = {
            newClientsThisMonth,
            newClientsLastMonth,
            newClientsDiff
        }

        return {
            message: 'Información encontrada',
            statusCode: HttpStatus.OK,
            data: {
                earnsMetrics,
                bookingsMetrics,
                rushHoursMetrics,
                newClientsMetrics
            },
        };
    }
}
