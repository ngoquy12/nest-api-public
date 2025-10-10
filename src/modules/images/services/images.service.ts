import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Image } from '../entities/image.entity';
import { Repository } from 'typeorm';
import { CloudinaryService } from 'src/services/cloudinary.service';
import { TypeImage } from 'src/common/enums/type-image.enum';

@Injectable()
export class ImagesService {
  constructor(
    @InjectRepository(Image)
    private readonly imageRepository: Repository<Image>,

    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async updateAvatar(
    refId: number,
    file: Express.Multer.File, // Ảnh mới upload
    type: TypeImage, // Loại hình ảnh
  ) {
    // 1. Tìm ảnh cũ
    const oldImage = await this.imageRepository.findOne({
      where: { refId, type },
    });

    // 2. Nếu có ảnh cũ thì xóa
    if (oldImage) {
      try {
        await this.cloudinaryService.deleteImage(oldImage.publicId);
      } catch (error) {
        console.log('Lỗi xóa ảnh cũ trên Cloudinary:', error.message);
      }
      await this.imageRepository.delete(oldImage.id);
    }

    // 3. Upload ảnh mới
    const uploadResult = await this.cloudinaryService.uploadImage(file);

    // 4. Lưu ảnh mới
    const newImage = this.imageRepository.create({
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      refId,
      type,
    });
    await this.imageRepository.save(newImage);

    // Trả về URL ảnh mới
    return newImage.url;
  }
}
