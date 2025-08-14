import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IServiceRepository } from '@/domain/repositories/services.repository';
import { Service as DomainClient } from '@/domain/entities/service.entity';

@Injectable()
export class PrismaServicesRepository implements IServiceRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(service: {
    id: number;
    commerceId: number;
    name: string;
    price: number;
    durationMinutes: number;
  }): DomainClient {
    return new DomainClient(
      service.id,
      service.commerceId,
      service.name,
      service.price,
      service.durationMinutes,
    );
  }

  async findService(data: {
    serviceId: number;
    commerceId: number;
  }): Promise<DomainClient | null> {
    const { serviceId, commerceId } = data;
    const result = await this.prisma.service.findUnique({
      where: {
        id: serviceId,
        commerceId: commerceId,
      },
    });
    if (!result) return null;
    return this.toDomain(result);
  }
}
