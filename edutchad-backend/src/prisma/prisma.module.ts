import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // @Global permet de ne pas avoir à réimporter PrismaModule partout
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}