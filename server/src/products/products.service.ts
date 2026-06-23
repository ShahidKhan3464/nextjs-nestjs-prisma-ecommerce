import { Injectable } from '@nestjs/common';
import { Product } from './entities/product.entity';
import { QueryProductDto } from './dto/query-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { GetProductsProvider } from './providers/get-products.provider';
import { CreateProductProvider } from './providers/create-product.provider';
import { UpdateProductProvider } from './providers/update-product.provider';
import { DeleteProductProvider } from './providers/delete-product.provider';
import { PaginateQueryResult } from 'src/common/pagination/interfaces/paginated.interfaces';

@Injectable()
export class ProductsService {
  constructor(
    private readonly getProductsProvider: GetProductsProvider,
    private readonly createProductProvider: CreateProductProvider,
    private readonly updateProductProvider: UpdateProductProvider,
    private readonly deleteProductProvider: DeleteProductProvider,
  ) {}

  public async findAllPaginated(
    query: QueryProductDto,
  ): Promise<PaginateQueryResult<Product>> {
    return await this.getProductsProvider.findAllPaginated(query);
  }

  public async findOne(id: number): Promise<Product> {
    return await this.getProductsProvider.findOne(id);
  }

  public async findBySlug(slug: string): Promise<Product> {
    return await this.getProductsProvider.findBySlug(slug);
  }

  public async create(
    dto: CreateProductDto,
    files: Express.Multer.File[],
  ): Promise<Product> {
    return await this.createProductProvider.create(dto, files);
  }

  public async update(
    id: number,
    dto: UpdateProductDto,
    files: Express.Multer.File[] = [],
  ): Promise<Product> {
    return await this.updateProductProvider.update(id, dto, files);
  }

  public async remove(id: number): Promise<void> {
    return await this.deleteProductProvider.remove(id);
  }

  public async restore(id: number): Promise<Product> {
    return await this.deleteProductProvider.restore(id);
  }
}
