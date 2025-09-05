import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class TokenEncryptionService {
  private readonly algorithm = 'aes-256-gcm';

  constructor() {
    // Validar que existe la clave de encriptación
    if (!process.env.ENCRYPTION_KEY) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }

    // Validar longitud de la clave (64 caracteres hex = 32 bytes = 256 bits)
    const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
    if (key.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
    }
  }

  /**
   * Encripta un texto usando AES-256-GCM y retorna un string Base64
   * Formato: IV(16) + TAG(16) + ENCRYPTED_DATA
   */
  encrypt(text: string): string {
    try {
      const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
      const iv = crypto.randomBytes(16); // 128 bits

      const cipher = crypto.createCipheriv(this.algorithm, key, iv);
      let encrypted = cipher.update(text, 'utf8');
      encrypted = Buffer.concat([encrypted, cipher.final()]);

      const tag = cipher.getAuthTag();

      // Combinar IV + TAG + ENCRYPTED en un solo Base64
      return Buffer.concat([iv, tag, encrypted]).toString('base64');
    } catch (error) {
      throw new Error(
        `Error encrypting data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Desencripta un string Base64 usando AES-256-GCM
   */
  decrypt(encryptedData: string): string {
    try {
      const buffer = Buffer.from(encryptedData, 'base64');
      const iv = buffer.subarray(0, 16);
      const tag = buffer.subarray(16, 32);
      const encrypted = buffer.subarray(32);

      const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      decipher.setAuthTag(tag);

      let decrypted = decipher.update(encrypted, undefined, 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error(
        `Error decrypting data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Genera una nueva clave de encriptación (para setup inicial)
   */
  static generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Valida si una clave de encriptación es válida
   */
  static validateEncryptionKey(key: string): boolean {
    try {
      const buffer = Buffer.from(key, 'hex');
      return buffer.length === 32; // 256 bits
    } catch {
      return false;
    }
  }
}
