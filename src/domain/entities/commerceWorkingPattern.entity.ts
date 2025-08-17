import { AvailabilityType  } from '@/domain/common/AvailabilityType';

export class CommerceWorkingPattern {
  constructor(
    public readonly id: number,
    public readonly commerceId: number,
    public readonly weekday: number,
    public readonly availabilityType: AvailabilityType,
    public readonly morningStart: Date | null,
    public readonly morningEnd: Date | null,
    public readonly afternoonStart: Date | null,
    public readonly afternoonEnd: Date | null,
  ) {}

  // Factory method
  static create(props: {
    commerceId: number;
    weekday: number;
    availabilityType: AvailabilityType;
    morningStart: Date | null;
    morningEnd: Date | null;
    afternoonStart: Date | null;
    afternoonEnd: Date | null;
  }): CommerceWorkingPattern {
    if (!props.commerceId || props.commerceId <= 0) {
      throw new Error('El ID de usuario no es válido.');
    }

    if (!props.weekday || props.weekday <= 0 || props.weekday > 6) {
      throw new Error('Weekday debe ser un numero positivo, no mayor a 6');
    }

    if (
      !props.availabilityType ||
      (props.availabilityType !== AvailabilityType.full &&
        props.availabilityType !== AvailabilityType.off &&
        props.availabilityType !== AvailabilityType.half)
    ) {
      throw new Error(
        'El valor de availabilityType debe ser full, off o half.',
      );
    }

    if (
      props.availabilityType === AvailabilityType.full &&
      (!props.morningStart ||
        !props.morningEnd ||
        !props.afternoonStart ||
        !props.afternoonEnd)
    ) {
      throw new Error(
        'La hora de inicio y fin de la mañana y la hora de inicio y fin de la tarde son obligatorias si el tipo de disponibilidad es full.',
      );
    }

    if (
      props.availabilityType === AvailabilityType.half &&
      (!props.morningStart ||
        !props.morningEnd ||
        !props.afternoonStart ||
        !props.afternoonEnd)
    ) {
      throw new Error(
        'La hora de inicio y fin de la mañana o la hora de inicio y fin de la tarde son obligatorias si el tipo de disponibilidad es half.',
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
