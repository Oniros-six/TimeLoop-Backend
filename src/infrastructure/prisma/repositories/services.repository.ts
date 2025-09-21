import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IServiceRepository } from '@/domain/repositories/services.repository';
import { Service as DomainClient } from '@/domain/entities/service.entity';
import { ServiceUpdateData } from '@/domain/common/ServiceUpdateData';

@Injectable()
export class PrismaServicesRepository implements IServiceRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(service: {
    id: number;
    userId: number;
    name: string;
    price: number;
    durationMinutes: number;
  }): DomainClient {
    return new DomainClient(
      service.id,
      service.userId,
      service.name,
      service.price,
      service.durationMinutes,
    );
  }

  async findServices(data: {
    serviceIds: number[];
  }): Promise<DomainClient[]> {
    const { serviceIds } = data;
    const result = await this.prisma.service.findMany({
      where: {
        id: { in: serviceIds },
      },
    });
    if (!result || result.length == 0) return [];
    return result.map((service) => this.toDomain(service));
  }

  async findOne(data: {
    serviceId: number;
  }): Promise<DomainClient | null> {
    const { serviceId } = data;
    const result = await this.prisma.service.findFirst({
      where: {
        id: serviceId,
      },
    });

    if (!result) return null;

    return this.toDomain(result);
  }

  async findAllServices(data: {
    userId: number;
  }): Promise<DomainClient[] | null> {
    const result = await this.prisma.service.findMany({
      where: {
        userId: data.userId,
      },
    });
    if (!result) return null;
    return result.map((service) => this.toDomain(service));
  }

  async createService(data: DomainClient): Promise<DomainClient | null> {
    const { id, ...rest } = data; // removing id
    const result = await this.prisma.service.create({
      data: rest,
    });

    if (!result) return null;

    return this.toDomain(result);
  }

  async updateService(data: {
    serviceId: number;
    data: ServiceUpdateData;
  }): Promise<DomainClient | null> {
    const result = await this.prisma.service.update({
      where: { id: data.serviceId },
      data: data.data,
    });

    if (!result) return null;

    return this.toDomain(result);
  }
  async deleteService(data: {
    serviceId: number;
  }): Promise<DomainClient | null> {
    const result = await this.prisma.service.delete({
      where: { id: data.serviceId },
    });

    if (!result) return null;

    return this.toDomain(result);
  }
}
