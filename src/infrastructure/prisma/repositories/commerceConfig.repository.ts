import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ICommerceConfigRepository } from '@/domain/repositories/commerceConfig.repository';
import { CommerceConfig as DomainClient } from '@/domain/entities/commerceConfig.entity';
import { PaymentMethod } from '@/domain/dbEnums/PaymentMethods.enum';

@Injectable()
export class PrismaCommerceConfigRepository
  implements ICommerceConfigRepository
{
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(commerce: {
    id: number;
    commerceId: number;
    cancellationDeadlineMinutes: number;
    openTime: string;
    closeTime: string;
    welcomeMessage: string;
    acceptedPaymentMethods: PaymentMethod[];
  }): DomainClient {
    return new DomainClient(
      commerce.id,
      commerce.commerceId,
      commerce.cancellationDeadlineMinutes,
      commerce.openTime,
      commerce.closeTime,
      commerce.welcomeMessage,
      commerce.acceptedPaymentMethods,
    );
  }

  async findCommerceConfig(data: {
    commerceId: number;
  }): Promise<DomainClient> {
    const result = await this.prisma.commerceConfig.findUniqueOrThrow({
      where: { commerceId: data.commerceId },
    });

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
