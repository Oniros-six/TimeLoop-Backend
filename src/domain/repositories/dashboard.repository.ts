import { Dashboard } from '../entities/dashboard.entity';

export interface IDashboardRepository {
    findDashboardInfo(data: { commerceId: number }): Promise<Dashboard | null>;
}
