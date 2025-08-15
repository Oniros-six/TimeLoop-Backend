import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IServiceRepository } from '@/domain/repositories/services.repository';
import { Service as DomainClient } from '@/domain/entities/service.entity';
import { ServiceUpdateData } from '@/domain/common/ServiceUpdateData';

@Injectable()
export class PrismaServicesRepository implements IServiceRepository {
  constructor(private readonly prisma: PrismaService) { }

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

  async findAllServices(data: { commerceId: number }): Promise<DomainClient[] | null> {
    const result = await this.prisma.service.findMany({
      where: {
        commerceId: data.commerceId,
      },
    });
    if (!result) return null;
    return result.map((service) => this.toDomain(service));
  }

  async createService(data: DomainClient): Promise<DomainClient | null> {
    const result = await this.prisma.service.create({
      data: data,
    });

    if (!result) return null;

    return this.toDomain(result);
  }
  async updateService(data: { serviceId: number, commerceId: number, data: ServiceUpdateData }): Promise<DomainClient | null> {
    const result = await this.prisma.service.update({
      where: { id: data.serviceId, commerceId: data.commerceId },
      data: data.data,
    });

    if (!result) return null;

    return this.toDomain(result);
  }
  async deleteService(data: { serviceId: number, commerceId: number }): Promise<DomainClient | null> {
    const result = await this.prisma.service.delete({
      where: { id: data.serviceId, commerceId: data.commerceId },
    });

    if (!result) return null;

    return this.toDomain(result);
  }
}
