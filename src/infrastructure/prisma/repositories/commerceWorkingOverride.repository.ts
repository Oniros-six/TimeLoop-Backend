import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ICommerceWorkingOverrideRepository } from '@/domain/repositories/commerceWorkingOverride.repository';
import { CommerceWorkingOverride as DomainClient } from '@/domain/entities/commerceWorkingOverride.entity';
import { AvailabilityType } from '@/domain/dbEnums/AvailabilityType.enum';

@Injectable()
export class PrismaCommerceWorkingOverrideRepository
  implements ICommerceWorkingOverrideRepository
{
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(pattern: {
    id: number;
    commerceId: number;
    date: Date;
    overrideType: AvailabilityType;
    morningStart: string | null;
    morningEnd: string | null;
    afternoonStart: string | null;
    afternoonEnd: string | null;
    notes: string;
  }): DomainClient {
    return new DomainClient(
      pattern.id,
      pattern.commerceId,
      pattern.date,
      pattern.overrideType,
      pattern.morningStart,
      pattern.morningEnd,
      pattern.afternoonStart,
      pattern.afternoonEnd,
      pattern.notes,
    );
  }

  async findCommerceWorkingOverride(data: {
    commerceId: number;
  }): Promise<DomainClient[] | null> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1); // retrocede un día
    yesterday.setHours(0, 0, 0, 0); // inicio del día

    const result = await this.prisma.commerceWorkingOverride.findMany({
      where: {
        commerceId: data.commerceId,
        date: {
          gte: yesterday,
        },
      },
    });

    if (!result || result.length === 0) return null;
    return result.map((pattern) => this.toDomain(pattern));
  }

  async findCommerceWorkingOverrideById(data: {
    id: number;
  }): Promise<DomainClient | null> {
    const result = await this.prisma.commerceWorkingOverride.findUnique({
      where: { id: data.id },
    });
    if (!result) return null;
    return this.toDomain(result);
  }

  async createCommerceWorkingOverride(
    data: DomainClient,
  ): Promise<DomainClient | null> {
    const { id, ...rest } = data; // removing id
    const result = await this.prisma.commerceWorkingOverride.create({
      data: rest,
    });
    if (!result) return null;
    return this.toDomain(result);
  }

  async verifyCommerceWorkingOverride(data: {
    commerceId: number;
    date: Date;
  }): Promise<boolean> {
    const result = await this.prisma.commerceWorkingOverride.findFirst({
      where: { commerceId: data.commerceId, date: data.date },
    });
    if (!result) return false;
    return true;
  }

  async updateCommerceWorkingOverride(data: {
    id: number;
    newCommerceWorkingOverrideData: DomainClient;
  }): Promise<DomainClient | null> {
    const { id, ...rest } = data.newCommerceWorkingOverrideData; // removing id
    const result = await this.prisma.commerceWorkingOverride.update({
      where: { id: data.id },
      data: rest,
    });
    if (!result) return null;
    return this.toDomain(result);
  }
}
