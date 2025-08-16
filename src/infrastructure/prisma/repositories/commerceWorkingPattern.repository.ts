import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ICommerceWorkingPatternRepository } from '@/domain/repositories/commerceWorkingPattern.repository';
import { CommerceWorkingPattern as DomainClient } from '@/domain/entities/commerceWorkingPattern.entity';
import { AvailabilityType as CommerceAvailabilityType } from '@/domain/common/CommerceAvailabilityType';

@Injectable()
export class PrismaCommerceWorkingPatternRepository
  implements ICommerceWorkingPatternRepository
{
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(pattern: {
    id: number;
    commerceId: number;
    weekday: number;
    availabilityType: CommerceAvailabilityType;
    morningStart: Date | null;
    morningEnd: Date | null;
    afternoonStart: Date | null;
    afternoonEnd: Date | null;
  }): DomainClient {
    return new DomainClient(
      pattern.id,
      pattern.commerceId,
      pattern.weekday,
      pattern.availabilityType,
      pattern.morningStart,
      pattern.morningEnd,
      pattern.afternoonStart,
      pattern.afternoonEnd,
    );
  }

  async findCommerceWorkingPattern(data: {
    commerceId: number;
  }): Promise<DomainClient[] | null> {
    const result = await this.prisma.commerceWorkingPattern.findMany({
      where: { commerceId: data.commerceId },
    });
    if (!result) return null;
    return result.map((pattern) => this.toDomain(pattern));
  }

  async findCommerceWorkingPatternById(data: {
    id: number;
  }): Promise<DomainClient | null> {
    const result = await this.prisma.commerceWorkingPattern.findUnique({
      where: { id: data.id },
    });
    if (!result) return null;
    return this.toDomain(result);
  }

  async createCommerceWorkingPattern(
    data: DomainClient,
  ): Promise<DomainClient | null> {
    const result = await this.prisma.commerceWorkingPattern.create({
      data: data,
    });
    if (!result) return null;
    return this.toDomain(result);
  }

  async verifyCommerceWorkingPattern(data: {
    commerceId: number;
    weekday: number;
  }): Promise<boolean> {
    const result = await this.prisma.commerceWorkingPattern.findFirst({
      where: { commerceId: data.commerceId, weekday: data.weekday },
    });
    if (!result) return false;
    return true;
  }

  async updateCommerceWorkingPattern(data: {
    id: number;
    newCommerceWorkingPatternData: DomainClient;
  }): Promise<DomainClient | null> {
    const result = await this.prisma.commerceWorkingPattern.update({
      where: { id: data.id },
      data: data.newCommerceWorkingPatternData,
    });
    if (!result) return null;
    return this.toDomain(result);
  }
}
