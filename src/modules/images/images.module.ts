import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Image } from './entities/image.entity';
import { ImagesService } from './services/images.service';
import { CloudinaryService } from 'src/services/cloudinary.service';

@Module({
  imports: [TypeOrmModule.forFeature([Image])],
  controllers: [],
  providers: [ImagesService, CloudinaryService],
  exports: [],
})
export class ImagesModule {}
