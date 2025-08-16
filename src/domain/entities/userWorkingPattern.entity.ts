import { UserAvailabilityType } from '@/domain/common/UserAvailabilityType';

export class UserWorkingPattern {
  constructor(
    public readonly id: number,
    public readonly userId: number,
    public readonly weekday: number,
    public readonly availabilityType: UserAvailabilityType,
    public readonly morningStart: Date | null,
    public readonly morningEnd: Date | null,
    public readonly afternoonStart: Date | null,
    public readonly afternoonEnd: Date | null,
  ) {}

  // Factory method
  static create(props: {
    userId: number;
    weekday: number;
    availabilityType: UserAvailabilityType;
    morningStart: Date | null;
    morningEnd: Date | null;
    afternoonStart: Date | null;
    afternoonEnd: Date | null;
  }): UserWorkingPattern {
    if (!props.userId || props.userId <= 0) {
      throw new Error('El ID de usuario no es válido.');
    }

    if (!props.weekday || props.weekday <= 0 || props.weekday > 6) {
      throw new Error('Weekday debe ser un numero positivo, no mayor a 6');
    }

    if (
      !props.availabilityType ||
      (props.availabilityType !== UserAvailabilityType.workFull &&
        props.availabilityType !== UserAvailabilityType.off &&
        props.availabilityType !== UserAvailabilityType.workHalf)
    ) {
      throw new Error(
        'El valor de availabilityType debe ser workFull, off o workHalf.',
      );
    }

    if (
      props.availabilityType === UserAvailabilityType.workFull &&
      (!props.morningStart ||
        !props.morningEnd ||
        !props.afternoonStart ||
        !props.afternoonEnd)
    ) {
      throw new Error(
        'La hora de inicio y fin de la mañana y la hora de inicio y fin de la tarde son obligatorias si el tipo de disponibilidad es workFull.',
      );
    }

    if (
      props.availabilityType === UserAvailabilityType.workHalf &&
      (!props.morningStart ||
        !props.morningEnd ||
        !props.afternoonStart ||
        !props.afternoonEnd)
    ) {
      throw new Error(
        'La hora de inicio y fin de la mañana o la hora de inicio y fin de la tarde son obligatorias si el tipo de disponibilidad es workHalf.',
      );
    }

    if (
      props.morningStart &&
      props.morningEnd &&
      props.morningStart >= props.morningEnd
    ) {
      throw new Error(
        'La hora de inicio de la mañana no puede ser mayor o igual a la hora de fin de la mañana.',
      );
    }

    if (
      props.afternoonStart &&
      props.afternoonEnd &&
      props.afternoonStart >= props.afternoonEnd
    ) {
      throw new Error(
        'La hora de inicio de la tarde no puede ser mayor o igual a la hora de fin de la tarde.',
      );
    }

    return new UserWorkingPattern(
      0,
      props.userId,
      props.weekday,
      props.availabilityType,
      props.morningStart ?? null,
      props.morningEnd ?? null,
      props.afternoonStart ?? null,
      props.afternoonEnd ?? null,
    );
  }
}
