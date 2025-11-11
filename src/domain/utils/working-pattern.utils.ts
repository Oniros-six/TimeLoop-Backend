import { AvailabilityType } from '@/domain/dbEnums/AvailabilityType.enum';
import { WeekDays } from '@/domain/dbEnums/Weekdays.enum';

export type WorkingPatternWindow = {
  availabilityType: AvailabilityType;
  morningStart: string | null;
  morningEnd: string | null;
  afternoonStart: string | null;
  afternoonEnd: string | null;
};

const MINUTES_PER_HOUR = 60;

const WEEKDAY_BY_INDEX: Record<number, WeekDays> = {
  0: WeekDays.SUNDAY,
  1: WeekDays.MONDAY,
  2: WeekDays.TUESDAY,
  3: WeekDays.WEDNESDAY,
  4: WeekDays.THURSDAY,
  5: WeekDays.FRIDAY,
  6: WeekDays.SATURDAY,
};

const toMinutesFromMidnight = (date: Date): number => {
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const seconds = date.getUTCSeconds();

  return hours * MINUTES_PER_HOUR + minutes + seconds / MINUTES_PER_HOUR;
};

const parseTimeToMinutes = (time: string | null): number | null => {
  if (!time) {
    return null;
  }

  const [hours = '0', minutes = '0', seconds = '0'] = time.split(':');
  const totalMinutes =
    Number(hours) * MINUTES_PER_HOUR +
    Number(minutes) +
    Number(seconds) / MINUTES_PER_HOUR;

  return Number.isNaN(totalMinutes) ? null : totalMinutes;
};

const isWithinWindow = (
  windowStart: string | null,
  windowEnd: string | null,
  reservationStartMinutes: number,
  reservationEndMinutes: number,
): boolean => {
  const start = parseTimeToMinutes(windowStart);
  const end = parseTimeToMinutes(windowEnd);

  if (start === null || end === null) {
    return false;
  }

  return start <= reservationStartMinutes && reservationEndMinutes <= end;
};

export const resolveWeekdayFromUtcDate = (date: Date): WeekDays => {
  const dayIndex = date.getUTCDay();
  const weekday = WEEKDAY_BY_INDEX[dayIndex];

  if (!weekday) {
    throw new Error(`Índice de día inválido: ${dayIndex}`);
  }

  return weekday;
};

export const isScheduleWithinWorkingPattern = (
  pattern: WorkingPatternWindow,
  timeStart: Date,
  timeEnd: Date,
): boolean => {
  if (pattern.availabilityType === AvailabilityType.off) {
    return false;
  }

  const reservationStartMinutes = toMinutesFromMidnight(timeStart);
  const reservationEndMinutes = toMinutesFromMidnight(timeEnd);

  const fitsMorning = isWithinWindow(
    pattern.morningStart,
    pattern.morningEnd,
    reservationStartMinutes,
    reservationEndMinutes,
  );

  const fitsAfternoon = isWithinWindow(
    pattern.afternoonStart,
    pattern.afternoonEnd,
    reservationStartMinutes,
    reservationEndMinutes,
  );

  return fitsMorning || fitsAfternoon;
};

