import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateProductDto } from './create-product.dto';
import { UpdateProductDto } from './update-product.dto';

function variant(index: number) {
  return {
    size: 'M',
    color: `Color-${index}`,
    sku: `SKU-${index}`,
    stockQuantity: 1,
    price: 10,
  };
}

describe('product variant array size', () => {
  it('rejects create payloads with more than 50 variants', async () => {
    const dto = plainToInstance(CreateProductDto, {
      categoryId: 1,
      name: 'Widget',
      variants: Array.from({ length: 51 }, (_, i) => variant(i)),
    });

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'variants')).toBe(true);
  });

  it('accepts create payloads with 50 variants', async () => {
    const dto = plainToInstance(CreateProductDto, {
      categoryId: 1,
      name: 'Widget',
      variants: Array.from({ length: 50 }, (_, i) => variant(i)),
    });

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'variants')).toBe(false);
  });

  it('rejects update payloads with more than 50 variants', async () => {
    const dto = plainToInstance(UpdateProductDto, {
      variants: Array.from({ length: 51 }, (_, i) => variant(i)),
    });

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'variants')).toBe(true);
  });

  it('accepts update payloads with 50 variants', async () => {
    const dto = plainToInstance(UpdateProductDto, {
      variants: Array.from({ length: 50 }, (_, i) => variant(i)),
    });

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'variants')).toBe(false);
  });
});
