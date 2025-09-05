import { AvailabilityType } from '@/domain/dbEnums/AvailabilityType.enum';
import { HttpException, HttpStatus } from '@nestjs/common';

export function validateOpenCloseTime(openTime: string, closeTime: string): void {
  const [openH, openM] = openTime.split(':').map(Number);
  const [closeH, closeM] = closeTime.split(':').map(Number);

  if (openH > closeH || (openH === closeH && openM >= closeM)) {
    throw new HttpException(
      'La hora de apertura debe ser menor a la de cierre',
      HttpStatus.BAD_REQUEST,
    );
  }
}

export function validateAvailabilityTimes(data: {
  availabilityType: AvailabilityType;
  morningStart?: string;
  morningEnd?: string;
  afternoonStart?: string;
  afternoonEnd?: string;
}) {
  if (data.availabilityType === AvailabilityType.full) {
    if (data.morningStart && data.morningEnd) {
      validateOpenCloseTime(data.morningStart, data.morningEnd);
    }
    if (data.afternoonStart && data.afternoonEnd) {
      validateOpenCloseTime(data.afternoonStart, data.afternoonEnd);
    }
  } // Validate half time (mañana) 
  if (data.availabilityType === AvailabilityType.half && data.morningStart && data.morningEnd) {
    validateOpenCloseTime(data.morningStart, data.morningEnd);
  } // Validate half time (tarde)
  if (data.availabilityType === AvailabilityType.half && data.afternoonStart && data.afternoonEnd) {
    validateOpenCloseTime(data.afternoonStart, data.afternoonEnd);
  }
}
