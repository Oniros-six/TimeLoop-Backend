import { Service } from '../entities/service.entity';

export interface IServiceRepository {
  findService(data: {
    serviceId: number;
    commerceId: number;
  }): Promise<Service | null>;
}
