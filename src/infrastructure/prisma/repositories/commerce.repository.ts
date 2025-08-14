import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ICommerceRepository } from '@/domain/repositories/commerce.repository';
import { Commerce as DomainClient } from '@/domain/entities/commerce.entity';
import { BusinessCategory } from '@/domain/common/BusinessCategory';

@Injectable()
export class PrismaCommerceRepository implements ICommerceRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(commerce: {
    id: number;
    name: string;
    email: string;
    phone: string;
    address: string;
    businessCategory: BusinessCategory;
  }): DomainClient {
    return new DomainClient(
      commerce.id,
      commerce.name,
      commerce.email,
      commerce.phone,
      commerce.address,
      commerce.businessCategory,
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
}
