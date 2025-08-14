type StatusValue =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'no_show'
  | 'completed'
  | 'rescheduled';

export class BookingStatus {

  // Mapeo entre Value Objects y IDs de base de datos
  private static readonly STATUS_MAPPING = {
    pending: 1,
    confirmed: 2,
    cancelled: 3,
    no_show: 4,
    completed: 5,
    rescheduled: 6,
  } as const;

  // Mapeo inverso
  private static readonly ID_TO_STATUS = {
    1: 'pending',
    2: 'confirmed',
    3: 'cancelled',
    4: 'no_show',
    5: 'completed',
    6: 'rescheduled',
  } as const;

  constructor(public readonly value: StatusValue) {
    // No necesitas validación ni cast porque TypeScript garantiza que value es válido
    // TypeScript garantiza que solo valores válidos se pasen
  }

  // Obtener el ID de base de datos
  getDatabaseId(): number {
    return BookingStatus.STATUS_MAPPING[
      this.value as keyof typeof BookingStatus.STATUS_MAPPING
    ];
  }

  // Crear desde ID de base de datos
  static fromDatabaseId(id: number): BookingStatus {
    const status =
      BookingStatus.ID_TO_STATUS[id as keyof typeof BookingStatus.ID_TO_STATUS];
    if (!status) {
      throw new Error(`ID de estado no válido: ${id}`);
    }
    return new BookingStatus(status);
  }

  isPending(): boolean {
    return this.value === 'pending';
  }

  isConfirmed(): boolean {
    return this.value === 'confirmed';
  }

  isCancelled(): boolean {
    return this.value === 'cancelled';
  }

  isCompleted(): boolean {
    return this.value === 'completed';
  }

  canTransitionTo(newStatus: BookingStatus): boolean {
    const validTransitions: Record<string, string[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['completed', 'cancelled', 'no_show'],
      cancelled: [],
      no_show: [],
      completed: [],
      rescheduled: ['confirmed', 'cancelled'],
    };

    return validTransitions[this.value]?.includes(newStatus.value) || false;
  }

  static getPending(): BookingStatus {
    return new BookingStatus('pending');
  }

  static getConfirmed(): BookingStatus {
    return new BookingStatus('confirmed');
  }

  static getCancelled(): BookingStatus {
    return new BookingStatus('cancelled');
  }

  static getRescheduled(): BookingStatus {
    return new BookingStatus('rescheduled');
  }
}
