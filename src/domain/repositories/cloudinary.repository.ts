export interface IFileStorageRepository {
    uploadImage(file: Express.Multer.File, commerceName?: string, commerceId?: number, folder?: string): Promise<string>;
  }
