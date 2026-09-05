import { CreateProductVariantDto } from '../dto/create-product-variant.dto';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'UniqueVariantSku', async: false })
export class UniqueVariantSkuConstraint implements ValidatorConstraintInterface {
  validate(variants: CreateProductVariantDto[]) {
    if (!Array.isArray(variants)) {
      return false;
    }

    const skus = variants.map((v) => v.sku);
    return new Set(skus).size === skus.length;
  }

  defaultMessage() {
    return 'Duplicate SKU values in payload';
  }
}
