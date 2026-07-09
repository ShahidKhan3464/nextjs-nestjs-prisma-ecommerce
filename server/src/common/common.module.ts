import { Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './guards/roles/roles.guard';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { PrismaExceptionFilter } from './filters/prisma-exception.filter';

@Global()
@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: PrismaExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class CommonModule {}
