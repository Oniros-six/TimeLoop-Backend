import { ServiceUpdateData } from '../common/ServiceUpdateData';
import { Service } from '../entities/service.entity';

export interface IServiceRepository {
  findServices(data: {
    serviceIds: number[];
    commerceId: number;
  }): Promise<Service[]>;

  findOne(data: {
    serviceId: number;
    commerceId: number;
  }): Promise<Service | null>;

  findAllServices(data: { commerceId: number }): Promise<Service[] | null>;

  createService(data: Service): Promise<Service | null>;

  updateService(data: {
    serviceId: number;
    commerceId: number;
    data: ServiceUpdateData;
  }): Promise<Service | null>;

  deleteService(data: {
    serviceId: number;
    commerceId: number;
  }): Promise<Service | null>;
}
