import { Module } from '@nestjs/common';
import { ImpactService } from './impact.service';
import { ImpactResolver } from './impact.resolver';

@Module({
  providers: [ImpactService, ImpactResolver],
  exports: [ImpactService],
})
export class ImpactModule {}
