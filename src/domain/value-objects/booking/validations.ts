import { HttpException, HttpStatus } from '@nestjs/common';

//* Aca se consigue el TIMEEND
export function addMinutesToTime(dateTime: Date, minutes: number): Date {
  const timeEnd = new Date(dateTime.getTime() + minutes * 60000); // 60000 ms = 1 minuto
  return timeEnd;
}

//* Aca validamos que la fecha no sea anterior a hoy, incluida la hora
export function ensureNotPast(date: Date): Date {
  const now = new Date();
  if (date < now) {
    throw new HttpException(
      'La fecha/hora está en el pasado',
      HttpStatus.BAD_REQUEST,
    );
  }
  return date;
}
