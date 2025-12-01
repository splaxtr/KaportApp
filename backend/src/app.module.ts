import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { ActivitiesModule } from './activities/activities.module';
import { PartStatusModule } from './part-status/part-status.module';
import { PartsModule } from './parts/parts.module';
import { PdfModule } from './pdf/pdf.module';
import { PhotosModule } from './photos/photos.module';
import { PrismaModule } from './prisma/prisma.module';
import { ShopsModule } from './shops/shops.module';
import { UsersModule } from './users/users.module';
import { VehiclesModule } from './vehicles/vehicles.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    ShopsModule,
    VehiclesModule,
    PartsModule,
    PartStatusModule,
    PhotosModule,
    ActivitiesModule,
    PdfModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
