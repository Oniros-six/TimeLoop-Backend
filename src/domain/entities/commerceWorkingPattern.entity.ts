import { AvailabilityType } from '@/domain/dbEnums/AvailabilityType.enum';
import { WeekDays } from '@/domain/dbEnums/Weekdays.enum';

export class CommerceWorkingPattern {
  constructor(
    public readonly id: number,
    public readonly commerceId: number,
    public readonly weekday: WeekDays,
    public readonly availabilityType: AvailabilityType,
    public morningStart: string | null,
    public morningEnd: string | null,
    public afternoonStart: string | null,
    public afternoonEnd: string | null,
  ) {}

  // Factory method
  static create(props: {
    commerceId: number;
    weekday: WeekDays;
    availabilityType: AvailabilityType;
    morningStart: string | null;
    morningEnd: string | null;
    afternoonStart: string | null;
    afternoonEnd: string | null;
  }): CommerceWorkingPattern {
    if (!props.commerceId || props.commerceId <= 0) {
      throw new Error('El ID de usuario no es válido.');
    }

    if (!props.weekday || !Object.values(WeekDays).includes(props.weekday)) {
      throw new Error(
        'Weekday debe ser un día válido de la semana en inglés (ej: MONDAY, TUESDAY...)',
      );
    }

    if (
      !props.availabilityType ||
      !Object.values(AvailabilityType).includes(props.availabilityType)
    ) {
      throw new Error(
        'El valor de availabilityType debe ser full, off o half.',
      );
    }

    if (props.availabilityType === AvailabilityType.full) {
      const hasMorning = Boolean(props.morningStart && props.morningEnd);
      const hasAfternoon = Boolean(props.afternoonStart && props.afternoonEnd);

      if (!hasMorning || !hasAfternoon) {
        throw new Error(
          'Debes enviar horarios de mañana y de tarde para tipo full.',
        );
      }
    }

    if (props.availabilityType === AvailabilityType.half) {
      const hasMorning = Boolean(props.morningStart || props.morningEnd);
      const hasAfternoon = Boolean(props.afternoonStart || props.afternoonEnd);
      
      if (!hasMorning && !hasAfternoon) {
        throw new Error(
          'Debes enviar horarios de mañana o de tarde para tipo half.',
        );
      }
      if (hasMorning && hasAfternoon) {
        throw new Error(
          'Para tipo half solo se permite mañana o tarde, no ambos.',
        );
      }
    }

    if (props.availabilityType === AvailabilityType.off) {
      props.morningStart = null;
      props.morningEnd = null;
      props.afternoonStart = null;
      props.afternoonEnd = null;
    }

    return new CommerceWorkingPattern(
      0,
      props.commerceId,
      props.weekday,
      props.availabilityType,
      props.morningStart ?? null,
      props.morningEnd ?? null,
      props.afternoonStart ?? null,
      props.afternoonEnd ?? null,
    );
  }
}
