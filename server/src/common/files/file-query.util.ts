import { FileOwnerModule } from './file.constants';
import { StoredFile } from './entities/stored-file.entity';
import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

export function joinProductImages<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  productAlias = 'product',
): SelectQueryBuilder<T> {
  return qb
    .leftJoinAndMapMany(
      `${productAlias}.images`,
      StoredFile,
      'images',
      `images.ownerModule = :productFileModule AND images.ownerId = ${productAlias}.id`,
      { productFileModule: FileOwnerModule.PRODUCT },
    )
    .addOrderBy('images.sortOrder', 'ASC');
}
