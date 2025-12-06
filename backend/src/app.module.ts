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
import { CatalogModule } from './catalog/catalog.module';
import { SystemConfigModule } from './system-config/system-config.module';
import { AdminMetricsModule } from './admin-metrics/admin-metrics.module';
import { VehicleCasesModule } from './vehicle-cases/vehicle-cases.module';
import { CustomersModule } from './customers/customers.module';
import { VehicleTasksModule } from './vehicle-tasks/vehicle-tasks.module';
import { CasesModule } from './cases/cases.module';

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
    CatalogModule,
    SystemConfigModule,
    AdminMetricsModule,
    VehicleCasesModule,
    CustomersModule,
    VehicleTasksModule,
    CasesModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
