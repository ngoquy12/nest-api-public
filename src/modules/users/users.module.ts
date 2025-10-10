import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Position } from '../positions/entities/position.entity';
import { PositionsService } from '../positions/positions.service';
import { EmployeesModule } from '../employees/employees.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Position]), EmployeesModule],
  controllers: [UsersController],
  providers: [UsersService, PositionsService],
  exports: [UsersService],
})
export class UsersModule {}
