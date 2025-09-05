import { MercadoPago } from '../entities/mercadoPago.entity';

export interface IMercadoPagoRepository {
  create(token: InstanceType<typeof MercadoPago.Token>): Promise<MercadoPago>;
  findByCommerceId(commerceId: number): Promise<MercadoPago>;
  update(
    existingId: number,
    token: InstanceType<typeof MercadoPago.Token>,
  ): Promise<MercadoPago>;
}
