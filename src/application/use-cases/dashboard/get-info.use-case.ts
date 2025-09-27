import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { DASHBOARD_REPOSITORY, USER_REPOSITORY } from '@/application/providers';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { IDashboardRepository } from '@/domain/repositories/dashboard.repository';

@Injectable()
export class GetDashboardInfo {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
        @Inject(DASHBOARD_REPOSITORY)
        private readonly dashboardRepository: IDashboardRepository,
    ) { }

    async execute(id: number) {
       
        const user = await this.userRepository.findUser({ userId: id });

        if (!user) {
            throw new HttpException('Cliente no encontrado', HttpStatus.NOT_FOUND);
        }

        const dashboardInfo = await this.dashboardRepository.findDashboardInfo({ commerceId: user.commerceId });

        if (!dashboardInfo) {
            throw new HttpException('No hay información', HttpStatus.NOT_FOUND);
        }

        return {
            message: 'Información encontrada',
            statusCode: HttpStatus.OK,
            data: dashboardInfo,
        };
    }
}
