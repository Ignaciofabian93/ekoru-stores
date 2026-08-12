import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ReviewsService } from './reviews.service';
import { ReviewsResolver } from './reviews.resolver';

/**
 * Buyer reviews of store products. Kept out of ProductsModule because the write
 * path depends on orders (a different subgraph's tables) rather than on the
 * catalogue itself.
 */
@Module({
  imports: [PrismaModule],
  providers: [ReviewsService, ReviewsResolver],
  exports: [ReviewsService],
})
export class ReviewsModule {}
