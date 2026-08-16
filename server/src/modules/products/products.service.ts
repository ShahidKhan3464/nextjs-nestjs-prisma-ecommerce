import { Injectable } from '@nestjs/common';
import { QueryProductDto } from './dto/query-product.dto';
import { UserRole } from 'src/common/enums/user-role.enum';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductWithRelations } from 'src/common/types/domain.types';
import { GetProductsProvider } from './providers/get-products.provider';
import { CreateProductProvider } from './providers/create-product.provider';
import { UpdateProductProvider } from './providers/update-product.provider';
import { DeleteProductProvider } from './providers/delete-product.provider';
import { ProductStatusProvider } from './providers/product-status.provider';
import { PaginateQueryResult } from 'src/common/pagination/interfaces/paginated.interfaces';

@Injectable()
export class ProductsService {
  constructor(
    private readonly getProductsProvider: GetProductsProvider,
    private readonly createProductProvider: CreateProductProvider,
    private readonly updateProductProvider: UpdateProductProvider,
    private readonly deleteProductProvider: DeleteProductProvider,
    private readonly productStatusProvider: ProductStatusProvider,
  ) {}

  public async findAllPaginated(
    query: QueryProductDto,
  ): Promise<PaginateQueryResult<ProductWithRelations>> {
    return await this.getProductsProvider.findAllPaginated(query);
  }

  public async findMinePaginated(
    userId: number,
    query: QueryProductDto,
  ): Promise<PaginateQueryResult<ProductWithRelations>> {
    return await this.getProductsProvider.findMinePaginated(userId, query);
  }

  public async findOne(id: number): Promise<ProductWithRelations> {
    return await this.getProductsProvider.findOne(id);
  }

  public async findBySlug(slug: string): Promise<ProductWithRelations> {
    return await this.getProductsProvider.findBySlug(slug);
  }

  public async create(
    dto: CreateProductDto,
    files: Express.Multer.File[],
    userId: number,
    roles: UserRole[],
  ): Promise<ProductWithRelations> {
    return await this.createProductProvider.create(dto, files, userId, roles);
  }

  public async update(
    id: number,
    dto: UpdateProductDto,
    files: Express.Multer.File[] = [],
    userId: number,
    roles: UserRole[],
  ): Promise<ProductWithRelations> {
    return await this.updateProductProvider.update(
      id,
      dto,
      files,
      userId,
      roles,
    );
  }

  public async remove(
    id: number,
    userId: number,
    roles: UserRole[],
  ): Promise<void> {
    return await this.deleteProductProvider.remove(id, userId, roles);
  }

  public async restore(
    id: number,
    userId: number,
    roles: UserRole[],
  ): Promise<ProductWithRelations> {
    return await this.productStatusProvider.restore(id, userId, roles);
  }

  public async publish(
    id: number,
    userId: number,
    roles: UserRole[],
  ): Promise<ProductWithRelations> {
    return await this.productStatusProvider.publish(id, userId, roles);
  }
}
