import { ServiceUpdateData } from '../common/ServiceUpdateData';
import { Service } from '../entities/service.entity';

export interface IServiceRepository {
  findServices(data: {
    serviceIds: number[];
    userId: number;
  }): Promise<Service[]>;

  findOne(data: {
    serviceId: number;
    userId: number;
  }): Promise<Service | null>;

  findAllServices(data: { userId: number }): Promise<Service[] | null>;

  createService(data: Service): Promise<Service | null>;

  updateService(data: {
    serviceId: number;
    userId: number;
    data: ServiceUpdateData;
  }): Promise<Service | null>;

  deleteService(data: {
    serviceId: number;
    userId: number;
  }): Promise<Service | null>;
}
