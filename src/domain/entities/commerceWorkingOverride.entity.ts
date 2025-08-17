import { AvailabilityType } from '@/domain/common/AvailabilityType';

export class CommerceWorkingOverride {
  constructor(
    public readonly id: number,
    public readonly commerceId: number,
    public readonly date: Date,
    public readonly overrideType: AvailabilityType,
    public readonly morningStart: Date | null,
    public readonly morningEnd: Date | null,
    public readonly afternoonStart: Date | null,
    public readonly afternoonEnd: Date | null,
    public readonly notes: string,
  ) {}

  static validate(value: Date | null | undefined): boolean {
    if (!value || !(value instanceof Date) || isNaN(value.getTime())) {
      return false;
    }

    const now = new Date();

    // Normalizamos al día en UTC (sin horas)
    const inputTime = Date.UTC(
      value.getUTCFullYear(),
      value.getUTCMonth(),
      value.getUTCDate(),
    );
    const todayTime = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
    );

    return inputTime >= todayTime;
  }

  // Factory method
  static create(props: {
    commerceId: number;
    date: Date;
    overrideType: AvailabilityType;
    morningStart: Date | null;
    morningEnd: Date | null;
    afternoonStart: Date | null;
    afternoonEnd: Date | null;
    notes: string;
  }): CommerceWorkingOverride {
    if (!props.commerceId || props.commerceId <= 0) {
      throw new Error('El ID de comercio no es válido.');
    }

    if (!props.date || !CommerceWorkingOverride.validate(props.date)) {
      throw new Error('La fecha debe ser en el futuro');
    }

    if (
      !props.overrideType ||
      (props.overrideType !== AvailabilityType.full &&
        props.overrideType !== AvailabilityType.off &&
        props.overrideType !== AvailabilityType.half)
    ) {
      throw new Error('El valor de overrideType debe ser full, off o half.');
    }

    if (
      props.overrideType === AvailabilityType.full &&
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
      props.overrideType === AvailabilityType.half &&
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

    return new CommerceWorkingOverride(
      0,
      props.commerceId,
      props.date,
      props.overrideType,
      props.morningStart ?? null,
      props.morningEnd ?? null,
      props.afternoonStart ?? null,
      props.afternoonEnd ?? null,
      props.notes,
    );
  }
}
