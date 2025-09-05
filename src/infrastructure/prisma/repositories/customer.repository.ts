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
    name: string;
    email: string;
    phone: string;
  }): DomainClient {
    return new DomainClient(
      customer.id,
      customer.name,
      customer.email,
      customer.phone,
    );
  }

  async createCustomer(data: {
    name: string;
    email: string;
    phone: string;
  }): Promise<DomainClient | null> {
    const result = await this.prisma.$transaction(async (tx) => {
      return await tx.customer.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
        },
      });
    });

    if (!result) return null;
    return this.toDomain(result);
  }

  async findCustomers(): Promise<DomainClient[] | null> {
    const result = await this.prisma.customer.findMany();

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

  async findCustomerByEmail(data: {
    email: string;
  }): Promise<DomainClient | null> {
    const result = await this.prisma.customer.findFirst({
      where: {
        email: data.email,
      },
    });

    if (!result) return null;
    return this.toDomain(result);
  }
}
