import { CategoriesService } from './categories.service';
import { UserRole } from 'src/common/enums/user-role.enum';
import { QueryCategoryDto } from './dto/query-category.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import {
  CategoryResponseDto,
  PaginatedCategoryResponseDto,
} from './dto/category-response.dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import {
  Get,
  Body,
  Post,
  Param,
  Patch,
  Query,
  Delete,
  Controller,
  ParseIntPipe,
} from '@nestjs/common';

@ApiTags('categories')
@ApiBearerAuth('access-token')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOkResponse({ type: PaginatedCategoryResponseDto })
  findAll(@Query() query: QueryCategoryDto) {
    return this.categoriesService.findAllPaginated(query);
  }

  @Get(':id')
  @ApiOkResponse({ type: CategoryResponseDto })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.findOne(id);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiCreatedResponse({ type: CategoryResponseDto })
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOkResponse({ type: CategoryResponseDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.delete(id);
  }

  @Patch(':id/restore')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOkResponse({ type: CategoryResponseDto })
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.restore(id);
  }
}
