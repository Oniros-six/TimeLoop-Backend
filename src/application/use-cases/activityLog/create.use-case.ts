import { Inject, Injectable } from '@nestjs/common';
import { IActivityLogRepository } from '@/domain/repositories/activityLog.repository';
import { CreateLogDto } from '@/interfaces/controllers/activityLog/dto/create-log.dto';
import {
    ACTIVITY_LOG_REPOSITORY,
} from '@/application/constants/providers';

@Injectable()
export class CreateActivityLog {
    constructor(
        @Inject(ACTIVITY_LOG_REPOSITORY)
        private readonly activityLogRepository: IActivityLogRepository,
    ) { }

    async execute(data: CreateLogDto) {

        await this.activityLogRepository.create({
            entityTypeId: data.entityTypeId,
            entityId: data.entityId,
            userId: null,
            commerceId: data.commerceId,
            customerId: data.customerId,
            changeTypeId: 1, // Created
            detail: data.detail,
        });
    }
}

