import { ServiceUpdateData } from '../common/ServiceUpdateData';
import { Service } from '../entities/service.entity';

export interface IServiceRepository {
  findServices(data: {
    serviceIds: number[];
  }): Promise<Service[]>;

  findOne(data: {
    serviceId: number;
  }): Promise<Service | null>;

  findAllServices(data: { userId: number }): Promise<Service[] | null>;

  createService(data: Service): Promise<Service | null>;

  updateService(data: {
    serviceId: number;
    data: ServiceUpdateData;
  }): Promise<Service | null>;

  deleteService(data: {
    serviceId: number;
  }): Promise<Service | null>;
}
