import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import { IFileStorageRepository } from '@/domain/repositories/cloudinary.repository';

@Injectable()
export class CloudinaryService implements IFileStorageRepository {
  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadImage(
    file: Express.Multer.File,
    commerceName: string,
    commerceId: number,
    folder = 'timeloop',
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder,
            public_id: `${commerceName}-${commerceId}_logo`, // 👈 nombre fijo
            overwrite: true, // 👈 reemplaza si ya existía
          },
          (error, result) => {
            if (error) return reject(error);
            if (!result) return reject(new Error('No se recibió resultado de Cloudinary'));
            resolve(result.secure_url);
          },
        )
        .end(file.buffer);
    });
  }
  
}
