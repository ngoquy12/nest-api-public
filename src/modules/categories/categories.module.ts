import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { User } from '../users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { ChangeLog } from '../change-logs/entities/change-log.entity';
import { ChangeLogsModule } from '../change-logs/change-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Category, User, ChangeLog]),
    ChangeLogsModule,
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService, JwtService, UsersService],
})
export class CategoriesModule {}
