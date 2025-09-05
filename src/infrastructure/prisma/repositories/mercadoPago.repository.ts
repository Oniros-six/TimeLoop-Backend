import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IMercadoPagoRepository } from '@/domain/repositories/mercadoPago.repository';
import { MercadoPago as DomainClient } from '@/domain/entities/mercadoPago.entity';
import { TokenEncryptionService } from '../../payments/TokenEncryptationService';

@Injectable()
export class PrismaMercadoPagoRepository implements IMercadoPagoRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: TokenEncryptionService,
  ) {}

  private toDomain(response: {
    id: number;
    commerceId: number;
    accessToken: string;
    refreshToken: string;
    publicKey: string | null;
    mpUserId: string;
    tokenExpires: Date;
    createdAt: Date;
    updatedAt: Date;
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
      response.updatedAt,
    );
  }

  async create(
    token: InstanceType<typeof DomainClient.Token>,
  ): Promise<DomainClient> {
    // Encriptar tokens sensibles
    const encryptedAccessToken = this.encryptionService.encrypt(
      token.accessToken,
    );
    const encryptedRefreshToken = this.encryptionService.encrypt(
      token.refreshToken,
    );
    const encryptedPublicKey = token.publicKey
      ? this.encryptionService.encrypt(token.publicKey)
      : null;

    const mp = await this.prisma.mercadoPago.create({
      data: {
        commerceId: token.commerceId,
        accessToken: encryptedAccessToken, // String Base64 simple
        refreshToken: encryptedRefreshToken, // String Base64 simple
        publicKey: encryptedPublicKey, // String Base64 simple o null
        mpUserId: token.mpUserId,
        tokenExpires: token.tokenExpires,
      },
    });

    // Retornar con tokens desencriptados para el dominio
    return this.toDomain({
      ...mp,
      accessToken: token.accessToken, // Token original
      refreshToken: token.refreshToken, // Token original
      publicKey: token.publicKey, // Key original
    });
  }

  async findByCommerceId(commerceId: number): Promise<DomainClient> {
    const mp = await this.prisma.mercadoPago.findFirstOrThrow({
      where: { commerceId: commerceId },
    });

    // Desencriptar tokens
    const decryptedAccessToken = this.encryptionService.decrypt(mp.accessToken);
    const decryptedRefreshToken = this.encryptionService.decrypt(
      mp.refreshToken,
    );
    const decryptedPublicKey = mp.publicKey
      ? this.encryptionService.decrypt(mp.publicKey)
      : null;

    return this.toDomain({
      ...mp,
      accessToken: decryptedAccessToken,
      refreshToken: decryptedRefreshToken,
      publicKey: decryptedPublicKey,
    });
  }

  async update(
    existingId: number,
    token: InstanceType<typeof DomainClient.Token>,
  ): Promise<DomainClient> {
    // Encriptar tokens sensibles
    const encryptedAccessToken = this.encryptionService.encrypt(
      token.accessToken,
    );
    const encryptedRefreshToken = this.encryptionService.encrypt(
      token.refreshToken,
    );
    const encryptedPublicKey = token.publicKey
      ? this.encryptionService.encrypt(token.publicKey)
      : null;

    const updated = await this.prisma.mercadoPago.update({
      where: { id: existingId },
      data: {
        accessToken: encryptedAccessToken, // String Base64 simple
        refreshToken: encryptedRefreshToken, // String Base64 simple
        publicKey: encryptedPublicKey, // String Base64 simple o null
        mpUserId: token.mpUserId,
        tokenExpires: token.tokenExpires,
        updatedAt: new Date(),
      },
    });

    // Retornar con tokens desencriptados para el dominio
    return this.toDomain({
      ...updated,
      accessToken: token.accessToken, // Token original
      refreshToken: token.refreshToken, // Token original
      publicKey: token.publicKey, // Key original
    });
  }
}
