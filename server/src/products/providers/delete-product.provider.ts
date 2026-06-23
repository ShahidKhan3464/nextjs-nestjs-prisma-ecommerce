import { join } from 'path';
import { unlink } from 'fs/promises';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from '../entities/product.entity';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class DeleteProductProvider {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  public async remove(id: number): Promise<void> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    await this.productRepository.softRemove(product);
  }

  public async restore(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    if (!product.deletedAt) {
      throw new BadRequestException('Product is not removed');
    }
    await this.productRepository.recover(product);
    return product;
  }

  public async safeUnlinkPublicPath(urlPath: string): Promise<void> {
    const relative = urlPath.replace(/^\//, '');
    const abs = join(process.cwd(), relative);
    try {
      await unlink(abs);
    } catch {
      /* file may already be gone */
    }
  }
}
