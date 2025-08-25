import { AvailabilityType } from '@/domain/dbEnums/AvailabilityType';

export class CommerceWorkingOverride {
  constructor(
    public readonly id: number,
    public readonly commerceId: number,
    public readonly date: Date,
    public readonly overrideType: AvailabilityType,
    public morningStart: string | null,
    public morningEnd: string | null,
    public afternoonStart: string | null,
    public afternoonEnd: string | null,
    public readonly notes: string,
  ) { }

  // Factory method
  static create(props: {
    commerceId: number;
    date: Date;
    overrideType: AvailabilityType;
    morningStart: string | null;
    morningEnd: string | null;
    afternoonStart: string | null;
    afternoonEnd: string | null;
    notes: string;
  }): CommerceWorkingOverride {
    if (!props.commerceId || props.commerceId <= 0) {
      throw new Error('El ID de comercio no es válido.');
    }

    if (!props.overrideType || !Object.values(AvailabilityType).includes(props.overrideType)) {
      throw new Error('El valor de overrideType debe ser full, off o half.');
    }

    if (props.overrideType === AvailabilityType.full) {
      const hasMorning = props.morningStart && props.morningEnd;
      const hasAfternoon = props.afternoonStart && props.afternoonEnd;

      if (!hasMorning || !hasAfternoon) {
        throw new Error('Debes enviar horarios de mañana y de tarde para tipo full.');
      }
    }

    if (props.overrideType === AvailabilityType.half) {
      const hasMorning = props.morningStart && props.morningEnd;
      const hasAfternoon = props.afternoonStart && props.afternoonEnd;

      if (!hasMorning && !hasAfternoon) {
        throw new Error('Debes enviar horarios de mañana o de tarde para tipo half.');
      }
      if (hasMorning && hasAfternoon) {
        throw new Error('Para tipo half solo se permite mañana o tarde, no ambos.');
      }
    }

    if (props.overrideType === AvailabilityType.off) {
      props.morningStart = null;
      props.morningEnd = null;
      props.afternoonStart = null;
      props.afternoonEnd = null;
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
