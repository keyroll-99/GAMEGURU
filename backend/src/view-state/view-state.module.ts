import { Module } from '@nestjs/common'
import { ViewStateController } from './view-state.controller'
import { ViewStateService } from './view-state.service'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [ViewStateController],
  providers: [ViewStateService],
  exports: [ViewStateService],
})
export class ViewStateModule {}
