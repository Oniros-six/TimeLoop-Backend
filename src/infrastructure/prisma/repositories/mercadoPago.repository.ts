import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IMercadoPagoRepository } from '@/domain/repositories/mercadoPago.repository';
import { MercadoPago as DomainClient } from '@/domain/entities/mercadoPago.entity';

@Injectable()
export class PrismaMercadoPagoRepository implements IMercadoPagoRepository {
    constructor(private readonly prisma: PrismaService) { }

    private toDomain(response: {
        id: number,
        commerceId: number,
        accessToken: string
        refreshToken: string,
        publicKey: string | null,
        mpUserId: string,
        tokenExpires: Date,
        createdAt: Date,
        updatedAt: Date
    }): DomainClient {
        return new DomainClient(
            response.id,
            response.commerceId,
            response.accessToken,
            response.refreshToken,
            response.publicKey,
            response.mpUserId,
            response.tokenExpires,
            response.createdAt,
            response.updatedAt
        );
    }

    async create(token: InstanceType<typeof DomainClient.Token>): Promise<DomainClient> {
        const mp = await this.prisma.mercadoPago.create({
            data: {
                commerceId: token.commerceId,
                accessToken: token.accessToken,
                refreshToken: token.refreshToken,
                publicKey: token.publicKey,
                mpUserId: token.mpUserId,
                tokenExpires: token.tokenExpires,
            },
        });
        return this.toDomain(mp)
    }

    async findByCommerceId(commerceId: number): Promise<DomainClient> {
        const mp = await this.prisma.mercadoPago.findFirstOrThrow({ where: { commerceId: commerceId } });

        return this.toDomain(mp);
    }

    async update(existingId: number, token: InstanceType<typeof DomainClient.Token>): Promise<DomainClient> {
        const updated = await this.prisma.mercadoPago.update({
            where: { id: existingId },
            data: {
                accessToken: token.accessToken,
                refreshToken: token.refreshToken,
                publicKey: token.publicKey,
                mpUserId: token.mpUserId,
                tokenExpires: token.tokenExpires,
                updatedAt: token.tokenExpires,
            },
        });
        return this.toDomain(updated);
    }

}
