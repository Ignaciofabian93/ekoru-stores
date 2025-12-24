import { Resolver, Query, Args, ID } from '@nestjs/graphql';
import { ImpactService } from './impact.service';
import {
  MaterialImpactEstimate,
  EnvironmentalImpact,
} from '../catalog/entities';
import { Co2ImpactMessage, WaterImpactMessage } from './entities';

@Resolver()
export class ImpactResolver {
  constructor(private readonly impactService: ImpactService) {}

  // Impact queries are now only in marketplace subgraph to avoid duplication
  // Store products can still access impact data through field resolvers
}
