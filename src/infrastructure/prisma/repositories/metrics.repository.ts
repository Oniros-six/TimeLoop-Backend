import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { HistoryItem, RecentItem } from '@/domain/common/dashboard.types';
import { IMetricsRepository } from '@/domain/repositories/metrics.repository';


@Injectable()
export class PrismaMetricsRepository implements IMetricsRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findFirstReservation(data: {
        commerceId: number;
        startDate: Date;
        endDate: Date;
    }): Promise<number> {
        const result = await this.prisma.customerCommerce.count({
            where: {
                commerceId: data.commerceId,
                firstReservationAt: {
                    gte: data.startDate,
                    lte: data.endDate,
                },
            },
        });
        return result
    }
}
