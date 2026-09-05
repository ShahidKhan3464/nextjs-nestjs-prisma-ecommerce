import { Injectable } from '@nestjs/common';
import { compare, genSalt, hash } from 'bcrypt';
import { HashingProvider } from './hashing.provider';

export const BCRYPT_COST = 12;

@Injectable()
export class BcryptProvider extends HashingProvider {
  public async hash(data: string | Buffer): Promise<string> {
    const salt = await genSalt(BCRYPT_COST);
    return hash(data, salt);
  }

  public async compare(data: string, hash: string): Promise<boolean> {
    return await compare(data, hash);
  }

  public verify(data: string, hash: string): Promise<boolean> {
    return this.compare(data, hash);
  }
}
