import { Global, Module } from '@nestjs/common';
import { PaginationProviders } from './providers/pagination.providers';

@Global()
@Module({
  exports: [PaginationProviders],
  providers: [PaginationProviders],
})
export class PaginationModule {}
