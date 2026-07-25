import { Injectable } from '@nestjs/common';
import { Category } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoryDto } from '../dto/create-category.dto';

@Injectable()
export class CreateCategoryProvider {
  constructor(private readonly prisma: PrismaService) {}

  public async create(dto: CreateCategoryDto): Promise<Category> {
    return await this.prisma.category.create({
      data: dto,
    });
  }
}
