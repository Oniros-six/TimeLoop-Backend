import { MercadoPago } from "../entities/mercadoPago.entity";

export interface IMercadoPagoRepository {
    create(token: InstanceType<typeof MercadoPago.Token>): Promise<MercadoPago>;
    findByCommerceId(commerceId: number): Promise<MercadoPago | null>;
    update(existingId: number, token: InstanceType<typeof MercadoPago.Token>): Promise<MercadoPago>;
}
