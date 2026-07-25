import { Injectable } from '@nestjs/common';

@Injectable()
export abstract class HashingProvider {
  abstract hash(data: string | Buffer): Promise<string>;
  abstract verify(data: string, hash: string): Promise<boolean>;
  abstract compare(data: string, hash: string): Promise<boolean>;
}
