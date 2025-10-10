import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { CloudinaryService } from 'src/services/cloudinary.service';
import { ImagesService } from '../images/services/images.service';
import { Image } from '../images/entities/image.entity';
import { Employee } from '../employees/entities/employee.entity';
import { ChangeLogsService } from '../change-logs/change-logs.service';
import { ChangeLog } from '../change-logs/entities/change-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Category, Image, Employee, ChangeLog]),
  ],
  controllers: [ProductsController],
  providers: [
    ProductsService,
    CloudinaryService,
    ImagesService,
    ChangeLogsService,
  ],
})
export class ProductsModule {}
