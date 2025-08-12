import CryptoJS from 'crypto-js';

export class EncryptionService {
  private encryptionKey: string;

  constructor(encryptionKey: string) {
    this.encryptionKey = encryptionKey;
  }

  encrypt(text: string): string {
    try {
      const encrypted = CryptoJS.AES.encrypt(text, this.encryptionKey).toString();
      return encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  decrypt(encryptedText: string): string {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedText, this.encryptionKey);
      const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!plaintext) {
        throw new Error('Decryption failed - invalid key or corrupted data');
      }
      
      return plaintext;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  generateKey(): string {
    return CryptoJS.lib.WordArray.random(256/8).toString();
  }
}

export const createEncryptionService = (key: string) => new EncryptionService(key);