import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './modules/users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from './database/database.config';
import { AuthsModule } from './modules/auths/auths.module';
import { APP_GUARD, RouterModule } from '@nestjs/core';
import { routes } from './routes';
import { EmployeesModule } from './modules/employees/employees.module';
import { PositionsModule } from './modules/positions/positions.module';
import { RolesModule } from './modules/roles/roles.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ChangeLogsModule } from './modules/change-logs/change-logs.module';
import { SeederRunner } from './seeds/seeder-runner';
import { RoleSeederService } from './seeds/role.seeder';
import { AccountsModule } from './modules/accounts/accounts.module';
import { ProductsModule } from './modules/products/products.module';
import { seconds, ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'development' ? '.env.development' : '.env',
    }),

    ThrottlerModule.forRoot({
      throttlers: [
        { ttl: seconds(60), limit: 120 }, // mặc định: 120 req/phút
      ],
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        getDatabaseConfig(configService),
    }),
    RouterModule.register(routes),
    AuthsModule,
    UsersModule,
    CategoriesModule,
    PositionsModule,
    RolesModule,
    EmployeesModule,
    ChangeLogsModule,
    AccountsModule,
    ProductsModule,
  ],
  providers: [
    RoleSeederService,
    SeederRunner,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
