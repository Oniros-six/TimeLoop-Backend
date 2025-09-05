import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ICommerceRepository } from '@/domain/repositories/commerce.repository';
import { Commerce as DomainClient } from '@/domain/entities/commerce.entity';
import { BusinessCategory } from '@/domain/dbEnums/BusinessCategory.enum';
import { CommerceUpdateData } from '@/domain/common/CommerceUpdateData';

@Injectable()
export class PrismaCommerceRepository implements ICommerceRepository {
  constructor(private readonly prisma: PrismaService) { }

  private toDomain(commerce: {
    id: number;
    name: string;
    email: string;
    phone: string;
    address: string;
    businessCategory: BusinessCategory;
    active: boolean;
  }): DomainClient {
    return new DomainClient(
      commerce.id,
      commerce.name,
      commerce.email,
      commerce.phone,
      commerce.address,
      commerce.businessCategory,
      commerce.active,
    );
  }

  async findCommerce(data: {
    commerceId: number;
  }): Promise<DomainClient | null> {
    const result = await this.prisma.commerce.findUnique({
      where: { id: data.commerceId },
    });

    if (!result) return null;
    return this.toDomain(result);
  }

  async findAllActive(): Promise<DomainClient[] | null> {
    const result = await this.prisma.commerce.findMany({
      where: {
        active: true
      },
    });

    if (!result) return null;
    return result.map((commerce) => this.toDomain(commerce));
  }

  async findCommerceByName(data: {
    name: string;
  }): Promise<DomainClient | null> {
    const result = await this.prisma.commerce.findFirst({
      where: { name: data.name },
    });

    if (!result) return null;
    return this.toDomain(result);
  }

  async findCommerceByEmail(data: { email: string }): Promise<boolean> {
    const result = await this.prisma.commerce.findUnique({
      where: { email: data.email },
    });

    return !!result;
  }

  async findCommerceByPhone(data: { phone: string; }): Promise<boolean> {
    const result = await this.prisma.commerce.findUnique({
      where: { phone: data.phone },
    });

    return !!result;
  }

  async suspendCommerce(data: {
    commerceId: number;
  }): Promise<DomainClient | null> {
    const result = await this.prisma.$transaction(async (tx) => {
      return await tx.commerce.update({
        where: { id: data.commerceId },
        data: {
          active: false,
        },
      });
    });

    if (!result) return null;
    return this.toDomain(result);
  }

  async reinstateCommerce(data: {
    commerceId: number;
  }): Promise<DomainClient | null> {
    const result = await this.prisma.$transaction(async (tx) => {
      return await tx.commerce.update({
        where: { id: data.commerceId },
        data: {
          active: true,
        },
      });
    });

    if (!result) return null;
    return this.toDomain(result);
  }

  async createCommerce(data: DomainClient): Promise<DomainClient | null> {
    const result = await this.prisma.$transaction(async (tx) => {
      return await tx.commerce.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          businessCategory: data.businessCategory,
          active: data.active,
        },
      });
    });

    if (!result) return null;
    return this.toDomain(result);
  }

  async updateCommerce(data: {
    id: number;
    newCommerceData: CommerceUpdateData;
  }): Promise<DomainClient | null> {
    const result = await this.prisma.$transaction(async (tx) => {
      return await tx.commerce.update({
        where: { id: data.id },
        data: data.newCommerceData,
      });
    });

    if (!result) return null;

    return this.toDomain(result);
  }
}
