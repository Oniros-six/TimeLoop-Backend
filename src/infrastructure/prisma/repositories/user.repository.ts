import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { User as DomainClient } from '@/domain/entities/user.entity';
import { UserUpdateData } from '@/domain/common/UserUpdateData';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(user: {
    id: number;
    name: string;
    email: string;
    password: string;
    roleId: number;
    commerceId: number;
    active: boolean;
  }): DomainClient {
    return new DomainClient(
      user.id,
      user.name,
      user.email,
      user.password,
      user.roleId,
      user.commerceId,
      user.active,
    );
  }

  async findUser(data: { userId: number }): Promise<DomainClient | null> {
    const result = await this.prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!result) return null;
    return this.toDomain(result);
  }

  async findAllUsers(data: {
    commerceId: number;
  }): Promise<DomainClient[] | null> {
    const result = await this.prisma.user.findMany({
      where: { commerceId: data.commerceId },
    });

    if (!result) return null;
    return result.map((user) => this.toDomain(user));
  }

  async suspendUser(data: {
    commerceId: number;
    userId: number;
  }): Promise<DomainClient | null> {
    const result = await this.prisma.user.update({
      where: { id: data.userId },
      data: {
        active: false,
      },
    });

    if (!result) return null;
    return this.toDomain(result);
  }

  async reinstateUser(data: {
    commerceId: number;
    userId: number;
  }): Promise<DomainClient | null> {
    const result = await this.prisma.user.update({
      where: { id: data.userId },
      data: {
        active: true,
      },
    });

    if (!result) return null;
    return this.toDomain(result);
  }

  async createUser(data: DomainClient): Promise<DomainClient | null> {
    const result = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: data.password,
        roleId: data.roleId,
        commerceId: data.commerceId,
        active: data.active,
      },
    });

    if (!result) return null;
    return this.toDomain(result);
  }

  async updateUser(data: {
    userId: number;
    newUserData: UserUpdateData;
  }): Promise<DomainClient | null> {
    const result = await this.prisma.user.update({
      where: { id: data.userId },
      data: data.newUserData,
    });

    if (!result) return null;
    return this.toDomain(result);
  }

  async findUserByName(data: {
    commerceId: number;
    name: string;
  }): Promise<DomainClient | null> {
    const result = await this.prisma.user.findFirst({
      where: { commerceId: data.commerceId, name: data.name },
    });

    if (!result) return null;
    return this.toDomain(result);
  }

  async findUserByEmail(data: { email: string }): Promise<DomainClient | null> {
    const result = await this.prisma.user.findFirst({
      where: {
        email: data.email,
      },
    });

    if (!result) return null;
    return this.toDomain(result);
  }
}
