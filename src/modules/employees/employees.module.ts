import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';
import { Employee } from './entities/employee.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { Position } from '../positions/entities/position.entity';
import { CloudinaryService } from 'src/services/cloudinary.service';
import { Image } from '../images/entities/image.entity';
import { ImagesService } from '../images/services/images.service';
import { ChangeLogsModule } from '../change-logs/change-logs.module';
import { PasswordHistory } from '../password-histories/entities/password-history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Employee,
      User,
      Role,
      Position,
      Image,
      PasswordHistory,
    ]),
    ChangeLogsModule,
  ],
  controllers: [EmployeesController],
  providers: [EmployeesService, CloudinaryService, ImagesService],
  exports: [TypeOrmModule, EmployeesService],
})
export class EmployeesModule {}
