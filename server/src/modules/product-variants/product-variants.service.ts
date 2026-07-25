import { Injectable } from '@nestjs/common';
import { UserRole } from 'src/common/enums/user-role.enum';
import { QueryProductVariantDto } from './dto/query-product-variant.dto';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
import { ProductVariantWithRelations } from 'src/common/types/domain.types';
import { GetProductVariantsProvider } from './providers/get-product-variants.provider';
import { CreateProductVariantProvider } from './providers/create-product-variant.provider';
import { UpdateProductVariantProvider } from './providers/update-product-variant.provider';
import { DeleteProductVariantProvider } from './providers/delete-product-variant.provider';
import { PaginateQueryResult } from 'src/common/pagination/interfaces/paginated.interfaces';

@Injectable()
export class ProductVariantsService {
  constructor(
    private readonly getProductVariantsProvider: GetProductVariantsProvider,
    private readonly createProductVariantProvider: CreateProductVariantProvider,
    private readonly updateProductVariantProvider: UpdateProductVariantProvider,
    private readonly deleteProductVariantProvider: DeleteProductVariantProvider,
  ) {}

  public async findAllPaginated(
    query: QueryProductVariantDto,
  ): Promise<PaginateQueryResult<ProductVariantWithRelations>> {
    return await this.getProductVariantsProvider.findAllPaginated(query);
  }

  public async findMinePaginated(
    userId: number,
    query: QueryProductVariantDto,
  ): Promise<PaginateQueryResult<ProductVariantWithRelations>> {
    return await this.getProductVariantsProvider.findMinePaginated(
      userId,
      query,
    );
  }

  public async findByProductId(
    productId: number,
    query: QueryProductVariantDto,
  ): Promise<PaginateQueryResult<ProductVariantWithRelations>> {
    return await this.getProductVariantsProvider.findByProductId(
      productId,
      query,
    );
  }

  public async findOne(id: number): Promise<ProductVariantWithRelations> {
    return await this.getProductVariantsProvider.findOne(id);
  }

  public async create(
    dto: CreateProductVariantDto,
    userId: number,
    roles: UserRole[],
  ): Promise<ProductVariantWithRelations> {
    return await this.createProductVariantProvider.create(dto, userId, roles);
  }

  public async update(
    id: number,
    dto: UpdateProductVariantDto,
    userId: number,
    roles: UserRole[],
  ): Promise<ProductVariantWithRelations> {
    return await this.updateProductVariantProvider.update(
      id,
      dto,
      userId,
      roles,
    );
  }

  public async remove(
    id: number,
    userId: number,
    roles: UserRole[],
  ): Promise<void> {
    return await this.deleteProductVariantProvider.remove(id, userId, roles);
  }
}
