import { HttpException, HttpStatus } from '@nestjs/common';
import { Booking } from '@/domain/entities/booking.entity';
import { CommerceWorkingPattern } from '@/domain/entities/commerceWorkingPattern.entity';
import { UserWorkingPattern } from '@/domain/entities/userWorkingPattern.entity';
import { Service } from '@/domain/entities/service.entity';
import { AvailabilityType } from '@/domain/dbEnums/AvailabilityType.enum';
import { addMinutesToTime } from '@/domain/value-objects/booking/validations';

export type TimeSlot = {
  start: Date;
  end: Date;
};

/**
 * Genera slots de tiempo disponibles basándose en los patrones de trabajo
 * del comercio y usuario, excluyendo los slots ocupados por reservas existentes.
 * 
 * Optimizado para alto rendimiento mediante:
 * - Ordenamiento único de reservas por tiempo
 * - Filtrado de reservas por ventana antes de verificar solapamientos
 * - Early exit en verificaciones de ocupación
 */
export function generateAvailableSlots(params: {
  date: Date;
  commercePattern: CommerceWorkingPattern;
  userPattern: UserWorkingPattern;
  totalDuration: number;
  existingBookings: Booking[];
}): TimeSlot[] {
  const { date, commercePattern, userPattern, totalDuration, existingBookings } =
    params;

  const slots: TimeSlot[] = [];
  const slotInterval = 15; // Intervalo de 15 minutos entre slots

  // Optimización: Ordenar reservas una sola vez por timeStart
  // Esto permite usar early exit y filtrado más eficiente
  const sortedBookings = [...existingBookings].sort(
    (a, b) => a.timeStart.getTime() - b.timeStart.getTime(),
  );

  // Obtener ventanas disponibles (intersección entre comercio y usuario)
  const availableWindows = getAvailableWindows(commercePattern, userPattern);

  // Para cada ventana disponible, generar slots
  for (const window of availableWindows) {
    const windowStart = timeStringToDate(date, window.start);
    const windowEnd = timeStringToDate(date, window.end);

    // Optimización: Filtrar solo reservas relevantes para esta ventana
    // Las reservas están ordenadas, así que podemos usar early exit
    const relevantBookings = getRelevantBookingsForWindow(
      sortedBookings,
      windowStart,
      windowEnd,
    );

    // Generar slots cada 15 minutos dentro de la ventana
    let currentSlotStart = new Date(windowStart);

    while (currentSlotStart < windowEnd) {
      const slotEnd = addMinutesToTime(currentSlotStart, totalDuration);

      // Verificar que el slot completo quepa en la ventana
      if (slotEnd <= windowEnd) {
        // Verificar que el slot no esté ocupado (usando reservas filtradas)
        if (
          !isSlotOccupied(
            currentSlotStart,
            slotEnd,
            relevantBookings,
          )
        ) {
          slots.push({
            start: new Date(currentSlotStart),
            end: new Date(slotEnd),
          });
        }
      }

      // Avanzar al siguiente slot
      currentSlotStart = addMinutesToTime(currentSlotStart, slotInterval);
    }
  }

  return slots;
}

/**
 * Obtiene las ventanas de tiempo disponibles calculando la intersección
 * entre los horarios del comercio y del usuario.
 */
export function getAvailableWindows(
  commercePattern: CommerceWorkingPattern,
  userPattern: UserWorkingPattern,
): Array<{ start: string; end: string }> {
  const windows: Array<{ start: string; end: string }> = [];

  // Ventana de mañana
  if (
    commercePattern.morningStart &&
    commercePattern.morningEnd &&
    userPattern.morningStart &&
    userPattern.morningEnd
  ) {
    const morningStart = getLaterTime(
      commercePattern.morningStart,
      userPattern.morningStart,
    );
    const morningEnd = getEarlierTime(
      commercePattern.morningEnd,
      userPattern.morningEnd,
    );

    if (morningStart && morningEnd && morningStart < morningEnd) {
      windows.push({ start: morningStart, end: morningEnd });
    }
  }

  // Ventana de tarde
  if (
    commercePattern.afternoonStart &&
    commercePattern.afternoonEnd &&
    userPattern.afternoonStart &&
    userPattern.afternoonEnd
  ) {
    const afternoonStart = getLaterTime(
      commercePattern.afternoonStart,
      userPattern.afternoonStart,
    );
    const afternoonEnd = getEarlierTime(
      commercePattern.afternoonEnd,
      userPattern.afternoonEnd,
    );

    if (afternoonStart && afternoonEnd && afternoonStart < afternoonEnd) {
      windows.push({ start: afternoonStart, end: afternoonEnd });
    }
  }

  return windows;
}

/**
 * Retorna el tiempo más tarde entre dos tiempos.
 */
export function getLaterTime(time1: string, time2: string): string {
  return compareTimes(time1, time2) > 0 ? time1 : time2;
}

/**
 * Retorna el tiempo más temprano entre dos tiempos.
 */
export function getEarlierTime(time1: string, time2: string): string {
  return compareTimes(time1, time2) < 0 ? time1 : time2;
}

/**
 * Compara dos tiempos en formato HH:MM:SS.
 * Retorna un número negativo si time1 < time2, positivo si time1 > time2, o 0 si son iguales.
 */
export function compareTimes(time1: string, time2: string): number {
  const [h1, m1] = time1.split(':').map(Number);
  const [h2, m2] = time2.split(':').map(Number);
  const minutes1 = h1 * 60 + m1;
  const minutes2 = h2 * 60 + m2;
  return minutes1 - minutes2;
}

/**
 * Convierte un string de tiempo (HH:MM:SS) a una fecha Date en UTC,
 * usando la fecha base proporcionada.
 */
export function timeStringToDate(baseDate: Date, timeString: string): Date {
  const [hours, minutes, seconds = '0'] = timeString.split(':');
  const date = new Date(baseDate);
  date.setUTCHours(Number(hours), Number(minutes), Number(seconds), 0);
  return date;
}

/**
 * Verifica si un slot de tiempo está ocupado por alguna reserva existente.
 * Versión optimizada que asume que las reservas están ordenadas por timeStart
 * y ya fueron filtradas para la ventana relevante.
 * 
 * Utiliza early exit: si una reserva comienza después del slot, 
 * todas las siguientes también lo harán (reservas ordenadas).
 * 
 * Dos intervalos se solapan si: start1 < end2 && start2 < end1
 */
function isSlotOccupied(
  slotStart: Date,
  slotEnd: Date,
  sortedBookings: Booking[],
): boolean {
  const slotStartTime = slotStart.getTime();
  const slotEndTime = slotEnd.getTime();

  // Early exit: si no hay reservas, el slot está disponible
  if (sortedBookings.length === 0) {
    return false;
  }

  // Early exit: si la primera reserva empieza después del slot, no hay solapamiento
  if (sortedBookings[0].timeStart.getTime() >= slotEndTime) {
    return false;
  }

  // Early exit: si la última reserva termina antes del slot, no hay solapamiento
  const lastBooking = sortedBookings[sortedBookings.length - 1];
  if (lastBooking.timeEnd.getTime() <= slotStartTime) {
    return false;
  }

  // Verificar solapamiento con early exit
  // Como están ordenadas, podemos detenernos cuando encontramos una que empieza después del slot
  for (const booking of sortedBookings) {
    const bookingStartTime = booking.timeStart.getTime();
    const bookingEndTime = booking.timeEnd.getTime();

    // Early exit: si esta reserva empieza después del slot, las siguientes también
    if (bookingStartTime >= slotEndTime) {
      break;
    }

    // Verificar solapamiento: start1 < end2 && start2 < end1
    if (slotStartTime < bookingEndTime && bookingStartTime < slotEndTime) {
      return true;
    }
  }

  return false;
}

/**
 * Filtra y retorna solo las reservas que podrían solaparse con la ventana especificada.
 * Aprovecha que las reservas están ordenadas por timeStart para un filtrado eficiente.
 * 
 * Una reserva es relevante si:
 * - Su tiempo de inicio es antes del final de la ventana, Y
 * - Su tiempo de fin es después del inicio de la ventana
 */
function getRelevantBookingsForWindow(
  sortedBookings: Booking[],
  windowStart: Date,
  windowEnd: Date,
): Booking[] {
  const windowStartTime = windowStart.getTime();
  const windowEndTime = windowEnd.getTime();

  // Early exit: si no hay reservas
  if (sortedBookings.length === 0) {
    return [];
  }

  // Early exit: si todas las reservas están fuera de la ventana
  const firstBooking = sortedBookings[0];
  const lastBooking = sortedBookings[sortedBookings.length - 1];

  if (firstBooking.timeStart.getTime() >= windowEndTime) {
    return []; // Todas las reservas empiezan después de la ventana
  }

  if (lastBooking.timeEnd.getTime() <= windowStartTime) {
    return []; // Todas las reservas terminan antes de la ventana
  }

  // Filtrar reservas relevantes
  // Como están ordenadas, podemos optimizar el proceso
  const relevantBookings: Booking[] = [];

  for (const booking of sortedBookings) {
    const bookingStartTime = booking.timeStart.getTime();
    const bookingEndTime = booking.timeEnd.getTime();

    // Early exit: si esta reserva empieza después de la ventana, las siguientes también
    if (bookingStartTime >= windowEndTime) {
      break;
    }

    // Una reserva es relevante si se solapa con la ventana
    // Dos intervalos se solapan si: start1 < end2 && start2 < end1
    if (bookingStartTime < windowEndTime && windowStartTime < bookingEndTime) {
      relevantBookings.push(booking);
    }
  }

  return relevantBookings;
}

/**
 * Valida que no haya servicios duplicados en el array.
 * @throws HttpException si hay servicios duplicados
 */
export function validateNoDuplicateServices(serviceIds: number[]): void {
  const uniqueServices = new Set(serviceIds);
  if (uniqueServices.size !== serviceIds.length) {
    throw new HttpException(
      'No se permiten servicios duplicados en la solicitud',
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * Valida que el usuario pertenezca al comercio.
 * @param user - Resultado de la consulta findUserByCommerce (puede ser null)
 * @throws HttpException si el usuario no existe o no pertenece al comercio
 */
export function validateUserBelongsToCommerce(user: unknown): void {
  if (!user) {
    throw new HttpException(
      'El usuario no existe o no pertenece al comercio especificado',
      HttpStatus.NOT_FOUND,
    );
  }
}

/**
 * Valida que todos los servicios pertenezcan al usuario.
 * @param services - Array de servicios obtenidos de findServicesByUser
 * @param serviceIds - Array de IDs de servicios solicitados
 * @returns Los servicios validados
 * @throws HttpException si algún servicio no pertenece al usuario
 */
export function validateServicesBelongToUser(
  services: Service[],
  serviceIds: number[],
): Service[] {
  if (services.length !== serviceIds.length) {
    throw new HttpException(
      'Al menos uno de los servicios no pertenece al empleado especificado',
      HttpStatus.NOT_FOUND,
    );
  }

  return services;
}

/**
 * Verifica si hay patrones de trabajo disponibles para el comercio y usuario.
 * Retorna false si no hay patrones o si alguno está en estado "off".
 */
export function hasAvailablePatterns(
  commercePattern: CommerceWorkingPattern | undefined,
  userPattern: UserWorkingPattern | undefined,
): boolean {
  // Si no hay patrones disponibles, retornar false
  if (!commercePattern || !userPattern) {
    return false;
  }

  // Si alguno está "off", no hay disponibilidad
  if (
    commercePattern.availabilityType === AvailabilityType.off ||
    userPattern.availabilityType === AvailabilityType.off
  ) {
    return false;
  }

  return true;
}

/**
 * Crea la respuesta estándar cuando no hay disponibilidad para una fecha.
 */
export function createNoAvailabilityResponse() {
  return {
    message: 'No hay disponibilidad para esta fecha',
    statusCode: HttpStatus.OK,
    data: [],
  };
}

