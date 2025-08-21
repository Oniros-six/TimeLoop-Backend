import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ICommerceConfigRepository } from '@/domain/repositories/commerceConfig.repository';
import { CommerceConfig as DomainClient } from '@/domain/entities/commerceConfig.entity';

@Injectable()
export class PrismaCommerceConfigRepository
  implements ICommerceConfigRepository
{
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(commerce: {
    id: number;
    commerceId: number;
    standardDurationMinutes: number;
    allowCancel: boolean;
    allowReschedule: boolean;
    allowNotifications: boolean;
    openTime: Date;
    closeTime: Date;
    welcomeMessage: string;
  }): DomainClient {
    return new DomainClient(
      commerce.id,
      commerce.commerceId,
      commerce.standardDurationMinutes,
      commerce.allowCancel,
      commerce.allowReschedule,
      commerce.allowNotifications,
      commerce.openTime,
      commerce.closeTime,
      commerce.welcomeMessage,
    );
  }

  async findCommerceConfig(data: {
    commerceId: number;
  }): Promise<DomainClient | null> {
    const result = await this.prisma.commerceConfig.findUnique({
      where: { commerceId: data.commerceId },
    });
    if (!result) return null;
    return this.toDomain(result);
  }

  async createCommerceConfig(data: DomainClient): Promise<DomainClient | null> {
    const { id, ...rest } = data; // removing id
    const result = await this.prisma.commerceConfig.create({
      data: rest,
    });
    if (!result) return null;
    return this.toDomain(result);
  }

  async updateCommerceConfig(data: {
    commerceId: number;
    newCommerceConfigData: DomainClient;
  }): Promise<DomainClient | null> {
    const { id, ...rest } = data.newCommerceConfigData; // removing id
    const result = await this.prisma.commerceConfig.update({
      where: { commerceId: data.commerceId },
      data: rest,
    });
    if (!result) return null;
    return this.toDomain(result);
  }
}
