import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IUserWorkingOverrideRepository } from '@/domain/repositories/userWorkingOverride.repository';
import { UserWorkingOverride as DomainClient } from '@/domain/entities/userWorkingOverride.entity';
import { AvailabilityType } from '@/domain/common/AvailabilityType';

@Injectable()
export class PrismaUserWorkingOverrideRepository
  implements IUserWorkingOverrideRepository
{
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(pattern: {
    id: number;
    userId: number;
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
      pattern.userId,
      pattern.date,
      pattern.overrideType,
      pattern.morningStart,
      pattern.morningEnd,
      pattern.afternoonStart,
      pattern.afternoonEnd,
      pattern.notes,
    );
  }

  async findUserWorkingOverride(data: {
    userId: number;
  }): Promise<DomainClient[] | null> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1); // retrocede un día
    yesterday.setHours(0, 0, 0, 0); // inicio del día

    const result = await this.prisma.userWorkingOverride.findMany({
      where: {
        userId: data.userId,
        date: {
          gte: yesterday,
        },
      },
    });

    if (!result || result.length === 0) return null;
    return result.map((pattern) => this.toDomain(pattern));
  }

  async findUserWorkingOverrideById(data: {
    id: number;
  }): Promise<DomainClient | null> {
    const result = await this.prisma.userWorkingOverride.findUnique({
      where: { id: data.id },
    });
    if (!result) return null;
    return this.toDomain(result);
  }

  async createUserWorkingOverride(
    data: DomainClient,
  ): Promise<DomainClient | null> {
    const { id, ...rest } = data; // removing id
    const result = await this.prisma.userWorkingOverride.create({
      data: rest,
    });
    if (!result) return null;
    return this.toDomain(result);
  }

  async verifyUserWorkingOverride(data: {
    userId: number;
    date: Date;
  }): Promise<boolean> {
    const result = await this.prisma.userWorkingOverride.findFirst({
      where: { userId: data.userId, date: data.date },
    });
    if (!result) return false;
    return true;
  }

  async updateUserWorkingOverride(data: {
    id: number;
    newUserWorkingOverrideData: DomainClient;
  }): Promise<DomainClient | null> {
    const { id, ...rest } = data.newUserWorkingOverrideData;
    const result = await this.prisma.userWorkingOverride.update({
      where: { id: data.id },
      data: rest,
    });
    if (!result) return null;
    return this.toDomain(result);
  }
}
