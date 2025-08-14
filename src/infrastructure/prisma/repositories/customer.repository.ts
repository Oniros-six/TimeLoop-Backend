import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ICustomerRepository } from '@/domain/repositories/customer.repository';
import { Customer as DomainClient } from '@/domain/entities/customer.entity';
import { CustomerUpdateData } from '@/domain/common/CustomerUpdateData';

@Injectable()
export class PrismaCustomerRepository implements ICustomerRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(customer: {
    id: number;
    commerceId: number;
    name: string;
    email: string;
    phone: string;
    internalNote: string;
  }): DomainClient {
    return new DomainClient(
      customer.id,
      customer.commerceId,
      customer.name,
      customer.email,
      customer.phone,
      customer.internalNote,
    );
  }

  async createCustomer(data: {
    name: string;
    email: string;
    phone: string;
    internalNote: string;
    commerceId: number;
  }): Promise<DomainClient | null> {
    const result = await this.prisma.$transaction(async (tx) => {
      return await tx.customer.create({
        data: {
          commerceId: data.commerceId,
          name: data.name,
          email: data.email || '',
          phone: data.phone || '',
          internalNote: data.internalNote || '',
        },
      });
    });

    if (!result) return null;
    return this.toDomain(result);
  }

  async findCustomersByCommerce(data: {
    commerceId: number;
  }): Promise<DomainClient[] | null> {
    const result = await this.prisma.customer.findMany({
      where: {
        commerceId: data.commerceId,
      },
    });

    if (!result || result.length === 0) return null;

    return result.map((customer) => this.toDomain(customer));
  }

  async findCustomer(data: { id: number }): Promise<DomainClient | null> {
    const result = await this.prisma.customer.findUnique({
      where: { id: data.id },
    });

    if (!result) return null;
    return this.toDomain(result);
  }

  async updateCustomer(data: {
    id: number;
    newCustomerData: CustomerUpdateData;
  }): Promise<DomainClient | null> {
    const result = await this.prisma.$transaction(async (tx) => {
      return await tx.customer.update({
        where: { id: data.id },
        data: data.newCustomerData,
      });
    });

    if (!result) return null;

    return this.toDomain(result);
  }

  async findCustomerByEmailAndCommerce(data: {
    email: string;
    commerceId: number;
  }): Promise<DomainClient | null> {
    const result = await this.prisma.customer.findFirst({
      where: {
        email: data.email,
        commerceId: data.commerceId,
      },
    });

    if (!result) return null;
    return this.toDomain(result);
  }
}
