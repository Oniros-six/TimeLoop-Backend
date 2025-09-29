// import { Metrics } from '../entities/metrics.entity';

export interface IMetricsRepository {
    findFirstReservation(data: {
        commerceId: number;
        startDate: Date;
        endDate: Date;
    }): Promise<number>;
}
