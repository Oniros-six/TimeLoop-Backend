import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IFileStorageRepository } from '@/domain/repositories/cloudinary.repository';
import { COMMERCE_REPOSITORY, CLOUDINARY_REPOSITORY } from '@/application/providers';
import { ICommerceRepository } from '@/domain/repositories/commerce.repository';

@Injectable()
export class UploadCommerceLogo {
  constructor(
    @Inject(CLOUDINARY_REPOSITORY)
    private readonly fileStorage: IFileStorageRepository,

    @Inject(COMMERCE_REPOSITORY)
    private readonly commerceRepository: ICommerceRepository,
  ) { }

  async execute(commerceId: number, file: Express.Multer.File) {

    // 1. Conseguir el nombre del comercio
    const commerce = await this.commerceRepository.findCommerce({commerceId}) 

    // 2. Subir imagen
    const url = await this.fileStorage.uploadImage(file, commerce?.name, commerceId, 'timeloop');

    // 3. Guardar URL en la DB
    const updated = await this.commerceRepository.updateLogo(commerceId, url);

    if (!updated) {
      throw new HttpException(
        'Error guardar el logo',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
// TODO Deuda tecnica, activity log
    return {
      message: 'Logo actualizado',
      logoUrl: updated.logo,
    };
  }
}
