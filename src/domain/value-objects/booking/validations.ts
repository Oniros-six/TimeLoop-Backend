import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Normaliza cualquier fecha a UTC.
 * Convierte una fecha a su representación UTC asegurando consistencia.
 * 
 * @param date - Fecha a normalizar
 * @returns Fecha en UTC
 * 
 * @example
 * const localDate = new Date('2025-07-15T15:00:00-03:00');
 * const utcDate = toUTC(localDate); // 2025-07-15T18:00:00.000Z
 */
export function toUTC(date: Date): Date {
  return new Date(date.toISOString());
}

/**
 * Suma minutos a una fecha manteniendo UTC.
 * 
 * @param dateTime - Fecha base
 * @param minutes - Minutos a sumar
 * @returns Nueva fecha en UTC
 * 
 * @example
 * const start = new Date('2025-07-15T18:00:00.000Z');
 * const end = addMinutesToTime(start, 60); // 2025-07-15T19:00:00.000Z
 */
export function addMinutesToTime(dateTime: Date, minutes: number): Date {
  const utcDate = toUTC(dateTime);
  const timeEnd = new Date(utcDate.getTime() + minutes * 60000); // 60000 ms = 1 minuto
  return toUTC(timeEnd);
}

/**
 * Valida que la fecha no esté en el pasado (comparación en UTC).
 * 
 * @param date - Fecha a validar
 * @returns Fecha normalizada en UTC si es válida
 * @throws HttpException si la fecha está en el pasado
 * 
 * @example
 * const futureDate = new Date('2025-12-31T15:00:00-03:00');
 * const validated = ensureNotPast(futureDate); // OK, retorna en UTC
 * 
 * const pastDate = new Date('2020-01-01T15:00:00-03:00');
 * ensureNotPast(pastDate); // Throws HttpException
 */
export function ensureNotPast(date: Date): Date {
  const utcDate = toUTC(date);
  const utcNow = toUTC(new Date());
  
  if (utcDate < utcNow) {
    throw new HttpException(
      'La fecha/hora está en el pasado',
      HttpStatus.BAD_REQUEST,
    );
  }
  
  return utcDate; // Retorna siempre en UTC
}
