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
import { SeederRunner } from './seeds/seeder-runner';
import { RoleSeederService } from './seeds/role.seeder';
import { AccountsModule } from './modules/accounts/accounts.module';
import { ProductsModule } from './modules/products/products.module';
import { ArticleCategoriesModule } from './modules/article-categories/article-categories.module';
import { ArticlesModule } from './modules/articles/articles.module';
import { CommentsModule } from './modules/comments/comments.module';
import { LikesModule } from './modules/likes/likes.module';
import { CartsModule } from './modules/carts/carts.module';
import { ChatModule } from './modules/chats/chat.module';
import { FriendModule } from './modules/friends/friend.module';
import { NotificationModule } from './modules/notifications/notification.module';
import { seconds, ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ContactsModule } from './modules/contacts/contact.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'development' ? '.env.development' : '.env',
    }),

    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: seconds(60),
          limit: 120, // Giới hạn: 120 requests/phút cho MỖI người dùng/IP riêng lẻ
          // Lưu ý: Đây là giới hạn theo từng user/IP, không phải tổng thể hệ thống
          // Ví dụ: 130 người, mỗi người gửi 1 request → không ai bị chặn
          // Nếu muốn giới hạn tổng thể, cần dùng Redis storage và custom logic
        },
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
    AccountsModule,
    ProductsModule,
    ArticleCategoriesModule,
    ArticlesModule,
    CommentsModule,
    LikesModule,
    CartsModule,
    ChatModule,
    FriendModule,
    NotificationModule,
    ContactsModule,
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
