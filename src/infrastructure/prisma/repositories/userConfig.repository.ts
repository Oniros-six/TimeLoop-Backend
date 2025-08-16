import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IUserConfigRepository } from '@/domain/repositories/userConfig.repository';
import { UserConfig as DomainClient } from '@/domain/entities/userConfig.entity';

@Injectable()
export class PrismaUserConfigRepository implements IUserConfigRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(user: {
    id: number;
    userId: number;
    darkMode: boolean;
    reminder: boolean;
    reminderFrequency: number;
  }): DomainClient {
    return new DomainClient(
      user.id,
      user.userId,
      user.darkMode,
      user.reminder,
      user.reminderFrequency,
    );
  }

  async findUserConfig(data: { userId: number }): Promise<DomainClient | null> {
    const result = await this.prisma.userConfig.findUnique({
      where: { userId: data.userId },
    });
    if (!result) return null;
    return this.toDomain(result);
  }

  async createUserConfig(data: DomainClient): Promise<DomainClient | null> {
    const result = await this.prisma.userConfig.create({
      data: data,
    });
    if (!result) return null;
    return this.toDomain(result);
  }

  async updateUserConfig(data: {
    userId: number;
    newUserConfigData: DomainClient;
  }): Promise<DomainClient | null> {
    const result = await this.prisma.userConfig.update({
      where: { userId: data.userId },
      data: data.newUserConfigData,
    });
    if (!result) return null;
    return this.toDomain(result);
  }
}
