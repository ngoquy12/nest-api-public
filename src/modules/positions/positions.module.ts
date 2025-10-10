import { Module } from '@nestjs/common';
import { PositionsService } from './positions.service';
import { PositionsController } from './positions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Position } from './entities/position.entity';
import { Employee } from '../employees/entities/employee.entity';
import { EmployeesModule } from '../employees/employees.module';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Position, Employee]), EmployeesModule],
  controllers: [PositionsController],
  providers: [PositionsService, JwtAuthGuard],
})
export class PositionsModule {}
