import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IDashboardRepository } from '@/domain/repositories/dashboard.repository';
import { Dashboard as DomainClient } from '@/domain/entities/dashboard.entity';
import { BookingStatus } from '@prisma/client';
import { DashboardData, HistoryItem, RecentItem } from '@/domain/common/dashboard.types';


@Injectable()
export class PrismaDashboardRepository implements IDashboardRepository {
    constructor(private readonly prisma: PrismaService) { }

    private toDomain(dashboard: {
        commerceId: number,
        commerceName: string,
        history: HistoryItem[],
        recentActivity: RecentItem[]
    }): DomainClient {
        return new DomainClient(
            dashboard.commerceId,
            dashboard.commerceName,
            dashboard.history,
            dashboard.recentActivity
        );
    }

    async findDashboardInfo(data: { commerceId: number }): Promise<DomainClient | null> {
        const commerceId = data.commerceId
        const commerce = await this.prisma.commerce.findUnique({
            select: {
                id: true,
                name: true
            },
            where: { id: commerceId },
        });
        const recent = await this.prisma.booking.findMany({
            select: {
                id: true,
                customerId: true,
                timeStart: true,
                status: true,
                bookingServices: {
                    select: {
                        service: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
                customer: {
                    select: {
                        name: true,
                    },
                },
                user: {
                    select: {
                        name: true,
                    },
                },
            },
            where: {
                commerceId: commerceId,
                status: {
                    notIn: [BookingStatus.COMPLETED, BookingStatus.NO_SHOW]
                },
                timeStart: {
                    gte: new Date()
                }
            },
            orderBy: {
                timeStart: 'desc',
            },
            take: 10,
        });
        const history = await this.prisma.bookingHistory.findMany({
            select: {
                id: true,
                bookingId: true,
                customerId: true,
                priceAtBooking: true,
                timeStart: true,
                booking: {
                    select: {
                        bookingServices: {
                            select: {
                                service: {
                                    select: {
                                        name: true,
                                    },
                                },
                            },
                        },
                    },
                },
                customer: {
                    select: {
                        name: true,
                    },
                },
                user: {
                    select: {
                        name: true,
                    },
                },
            },
            where: {
                commerceId: commerceId,
                status: BookingStatus.COMPLETED
            },
            orderBy: {
                timeStart: 'desc',
            },
            take: 10,
        });

        if (!commerce) return null;

        const result: DashboardData = {
            commerceId: commerce.id,
            commerceName: commerce.name,
            history: history,
            recentActivity: recent
        }
        return this.toDomain(result);
    }
}
