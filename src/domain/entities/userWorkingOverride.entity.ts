import { AvailabilityType } from '@/domain/dbEnums/AvailabilityType.enum';

export class UserWorkingOverride {
  constructor(
    public readonly id: number,
    public readonly userId: number,
    public readonly date: Date,
    public readonly overrideType: AvailabilityType,
    public readonly morningStart: string | null,
    public readonly morningEnd: string | null,
    public readonly afternoonStart: string | null,
    public readonly afternoonEnd: string | null,
    public readonly notes: string,
  ) {}

  // Factory method
  static create(props: {
    userId: number;
    date: Date;
    overrideType: AvailabilityType;
    morningStart: string | null;
    morningEnd: string | null;
    afternoonStart: string | null;
    afternoonEnd: string | null;
    notes: string;
  }): UserWorkingOverride {
    if (!props.userId || props.userId <= 0) {
      throw new Error('El ID de usuario no es válido.');
    }

    if (
      !props.overrideType ||
      !Object.values(AvailabilityType).includes(props.overrideType)
    ) {
      throw new Error(
        'El valor de availabilityType debe ser full, off o half.',
      );
    }

    if (props.overrideType === AvailabilityType.full) {
      const hasMorning = props.morningStart && props.morningEnd;
      const hasAfternoon = props.afternoonStart && props.afternoonEnd;

      if (!hasMorning || !hasAfternoon) {
        throw new Error(
          'Debes enviar horarios de mañana y de tarde para tipo full.',
        );
      }
    }

    if (props.overrideType === AvailabilityType.half) {
      const hasMorning = props.morningStart && props.morningEnd;
      const hasAfternoon = props.afternoonStart && props.afternoonEnd;

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

    if (props.overrideType === AvailabilityType.off) {
      props.morningStart = null;
      props.morningEnd = null;
      props.afternoonStart = null;
      props.afternoonEnd = null;
    }

    return new UserWorkingOverride(
      0,
      props.userId,
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
