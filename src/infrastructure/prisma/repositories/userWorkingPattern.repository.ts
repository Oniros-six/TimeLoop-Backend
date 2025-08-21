import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IUserWorkingPatternRepository } from '@/domain/repositories/userWorkingPattern.repository';
import { UserWorkingPattern as DomainClient } from '@/domain/entities/userWorkingPattern.entity';
import { AvailabilityType } from '@/domain/common/AvailabilityType';

@Injectable()
export class PrismaUserWorkingPatternRepository
  implements IUserWorkingPatternRepository
{
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(pattern: {
    id: number;
    userId: number;
    weekday: number;
    availabilityType: AvailabilityType;
    morningStart: Date | null;
    morningEnd: Date | null;
    afternoonStart: Date | null;
    afternoonEnd: Date | null;
  }): DomainClient {
    return new DomainClient(
      pattern.id,
      pattern.userId,
      pattern.weekday,
      pattern.availabilityType,
      pattern.morningStart,
      pattern.morningEnd,
      pattern.afternoonStart,
      pattern.afternoonEnd,
    );
  }

  async findUserWorkingPattern(data: {
    userId: number;
  }): Promise<DomainClient[] | null> {
    const result = await this.prisma.userWorkingPattern.findMany({
      where: { userId: data.userId },
    });
    if (!result) return null;
    return result.map((pattern) => this.toDomain(pattern));
  }

  async findUserWorkingPatternById(data: {
    id: number;
  }): Promise<DomainClient | null> {
    const result = await this.prisma.userWorkingPattern.findUnique({
      where: { id: data.id },
    });
    if (!result) return null;
    return this.toDomain(result);
  }

  async createUserWorkingPattern(
    data: DomainClient,
  ): Promise<DomainClient | null> {
    const { id, ...rest } = data; // removing id
    const result = await this.prisma.userWorkingPattern.create({
      data: rest,
    });
    if (!result) return null;
    return this.toDomain(result);
  }

  async verifyUserWorkingPattern(data: {
    userId: number;
    weekday: number;
  }): Promise<boolean> {
    const result = await this.prisma.userWorkingPattern.findFirst({
      where: { userId: data.userId, weekday: data.weekday },
    });
    if (!result) return false;
    return true;
  }

  async updateUserWorkingPattern(data: {
    id: number;
    newUserWorkingPatternData: DomainClient;
  }): Promise<DomainClient | null> {
    const { id, ...rest } = data.newUserWorkingPatternData;
    const result = await this.prisma.userWorkingPattern.update({
      where: { id: data.id },
      data: rest,
    });
    if (!result) return null;
    return this.toDomain(result);
  }
}
