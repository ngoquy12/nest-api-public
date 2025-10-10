import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtPayloadUser } from '../auths/interfaces/jwt-payload-user';
import { User } from '../users/entities/user.entity';
import { Repository, Not, DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserSession } from '../users/entities/user-session.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { BaseResponse } from 'src/common/responses/base-response';
import { HttpStatus } from '@nestjs/common';
import { Image } from '../images/entities/image.entity';
import { CloudinaryService } from 'src/services/cloudinary.service';
import { TypeImage } from 'src/common/enums/type-image.enum';
import { ChangeLogsService } from '../change-logs/change-logs.service';
import { ChangeLogType } from '../change-logs/enums/change-log-type.enum';
import { ChangeLogAction } from '../change-logs/enums/change-log-action.enum';
import { EnumConverterUtil } from 'src/common/utils/enum-converter.util';
import * as dayjs from 'dayjs';

@Injectable()
export class AccountsService {
  private readonly OPENCAGE_API_KEY = '48033604234641ea921d9b06b6f1612f';

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(UserSession)
    private readonly userSessionRepository: Repository<UserSession>,

    @InjectRepository(Image)
    private readonly imageRepository: Repository<Image>,

    private readonly cloudinaryService: CloudinaryService,
    private readonly dataSource: DataSource,
    private readonly changeLogsService: ChangeLogsService,
  ) {}

  async getProfile(user: JwtPayloadUser) {
    const { id } = user;
    const userEntity = await this.userRepository.findOne({
      where: { id, deletedAt: null },
      relations: ['role'],
    });

    if (!userEntity) {
      throw new Error('User not found');
    }

    // Lấy avatar URL
    const avatar = await this.imageRepository.findOne({
      where: {
        refId: userEntity.id,
        type: TypeImage.USER,
        deletedAt: null,
      },
    });

    return new BaseResponse(HttpStatus.OK, 'Lấy thông tin cá nhân thành công', {
      id: userEntity.id,
      firstName: userEntity.firstName,
      lastName: userEntity.lastName,
      fullName: `${userEntity.firstName} ${userEntity.lastName}`,
      email: userEntity.email,
      phoneNumber: userEntity.phoneNumber,
      dateBirth: userEntity.dateBirth,
      gender: userEntity.gender,
      address: userEntity.address,
      status: userEntity.status,
      avatar: avatar?.url || null,
      createdAt: userEntity.createdAt,
      role: userEntity.role
        ? {
            id: userEntity.role.id,
            roleName: userEntity.role.roleName,
            roleCode: userEntity.role.roleCode,
          }
        : null,
    });
  }

  async updateProfile(
    user: JwtPayloadUser,
    updateProfileDto: UpdateProfileDto,
    avatarFile?: Express.Multer.File,
  ) {
    const { id } = user;
    const { fullName, email, phoneNumber, dateBirth, gender, address } =
      updateProfileDto;

    // Xử lý cắt fullName thành firstName và lastName
    let firstName: string | undefined;
    let lastName: string | undefined;

    if (fullName) {
      const nameParts = fullName.trim().split(/\s+/);
      if (nameParts.length === 1) {
        // Nếu chỉ có 1 từ, đặt toàn bộ vào firstName
        firstName = nameParts[0];
        lastName = '';
      } else {
        // Lấy từ cuối làm lastName, phần còn lại làm firstName
        lastName = nameParts[nameParts.length - 1];
        firstName = nameParts.slice(0, -1).join(' ');
      }
    }

    // Tìm user hiện tại
    const userEntity = await this.userRepository.findOne({
      where: { id, deletedAt: null },
    });

    if (!userEntity) {
      throw new NotFoundException('Không tìm thấy thông tin người dùng');
    }

    // Kiểm tra email đã tồn tại (trừ chính user hiện tại)
    if (email && email !== userEntity.email) {
      const existingEmailUser = await this.userRepository.findOne({
        where: {
          email,
          id: Not(id),
          deletedAt: null,
        },
      });

      if (existingEmailUser) {
        throw new BadRequestException(
          'Email đã được sử dụng bởi tài khoản khác',
        );
      }
    }

    // Kiểm tra số điện thoại đã tồn tại (trừ chính user hiện tại)
    if (phoneNumber && phoneNumber !== userEntity.phoneNumber) {
      const existingPhoneUser = await this.userRepository.findOne({
        where: {
          phoneNumber,
          id: Not(id),
          deletedAt: null,
        },
      });

      if (existingPhoneUser) {
        throw new BadRequestException(
          'Số điện thoại đã được sử dụng bởi tài khoản khác',
        );
      }
    }

    // Validate và upload avatar lên Cloudinary trước (nếu có)
    let uploadedAvatar: { secure_url: string; public_id: string } | null = null;
    let oldImageToDelete: Image | null = null;

    if (avatarFile) {
      // Validate file
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      const maxSize = 2 * 1024 * 1024; // 2MB

      const isValidImage = allowedMimeTypes.includes(avatarFile.mimetype);
      const isTooLarge = avatarFile.size > maxSize;

      if (!isValidImage) {
        throw new BadRequestException(
          'Ảnh không đúng định dạng (chỉ cho phép jpg, jpeg, png)',
        );
      }
      if (isTooLarge) {
        throw new BadRequestException('Ảnh vượt quá dung lượng tối đa 2MB');
      }

      try {
        // Upload ảnh mới lên Cloudinary trước khi bắt đầu transaction
        uploadedAvatar = await this.cloudinaryService.uploadImage(avatarFile);

        // Lấy ảnh cũ để xóa sau (trong transaction)
        oldImageToDelete = await this.imageRepository.findOne({
          where: {
            refId: userEntity.id,
            type: TypeImage.USER,
            deletedAt: null,
          },
        });
      } catch (err) {
        console.error('Upload ảnh lên Cloudinary thất bại:', err);
        throw new BadRequestException(
          'Upload ảnh thất bại. Vui lòng thử lại sau.',
        );
      }
    }

    // Bắt đầu transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // ✅ BƯỚC 1: LƯU OLD DATA TRƯỚC KHI UPDATE
      const oldAvatar = await queryRunner.manager.findOne(Image, {
        where: {
          refId: userEntity.id,
          type: TypeImage.USER,
          deletedAt: null,
        },
      });

      const oldUserData = {
        fullName:
          userEntity.firstName && userEntity.lastName
            ? `${userEntity.firstName} ${userEntity.lastName}`
            : null,
        email: userEntity.email,
        phoneNumber: userEntity.phoneNumber,
        dateBirth: userEntity.dateBirth
          ? dayjs(userEntity.dateBirth).format('DD/MM/YYYY')
          : null,
        gender: userEntity.gender
          ? EnumConverterUtil.convertGender(userEntity.gender)
          : null,
        address: userEntity.address,
        avatar: oldAvatar?.url || null,
      };

      // ✅ BƯỚC 2: CÂP NHẬT THÔNG TIN USER
      const updateData: any = {};

      // Chỉ cập nhật firstName và lastName nếu fullName được cung cấp
      if (fullName) {
        updateData.firstName = firstName;
        updateData.lastName = lastName;
      }
      if (email !== undefined) updateData.email = email;
      if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
      if (dateBirth !== undefined)
        updateData.dateBirth = dateBirth ? new Date(dateBirth) : null;
      if (gender !== undefined) updateData.gender = gender;
      if (address !== undefined) updateData.address = address;

      Object.assign(userEntity, updateData);

      // Lưu user trong transaction
      await queryRunner.manager.save(User, userEntity);

      // ✅ BƯỚC 3: XỬ LÝ ẢNH
      let avatarUrl: string | null = null;

      if (uploadedAvatar) {
        // Soft delete ảnh cũ trong database
        if (oldImageToDelete) {
          oldImageToDelete.deletedAt = new Date();
          await queryRunner.manager.save(Image, oldImageToDelete);
        }

        // Lưu ảnh mới trong database
        const newImage = queryRunner.manager.create(Image, {
          url: uploadedAvatar.secure_url,
          publicId: uploadedAvatar.public_id,
          refId: userEntity.id,
          type: TypeImage.USER,
        });
        await queryRunner.manager.save(Image, newImage);

        avatarUrl = uploadedAvatar.secure_url;
      } else {
        // Lấy avatar hiện tại
        const currentAvatar = await queryRunner.manager.findOne(Image, {
          where: {
            refId: userEntity.id,
            type: TypeImage.USER,
            deletedAt: null,
          },
        });
        avatarUrl = currentAvatar?.url || null;
      }

      // ✅ BƯỚC 4: LƯU NEW DATA SAU KHI UPDATE
      const newUserData = {
        fullName:
          userEntity.firstName && userEntity.lastName
            ? `${userEntity.firstName} ${userEntity.lastName}`
            : null,
        email: userEntity.email,
        phoneNumber: userEntity.phoneNumber,
        dateBirth: userEntity.dateBirth
          ? dayjs(userEntity.dateBirth).format('DD/MM/YYYY')
          : null,
        gender: userEntity.gender
          ? EnumConverterUtil.convertGender(userEntity.gender)
          : null,
        address: userEntity.address,
        avatar: avatarUrl,
      };

      // Lưu change logs nếu có sự thay đổi
      await this.changeLogsService.logChange(
        ChangeLogAction.UPDATE,
        ChangeLogType.USER,
        userEntity.id,
        oldUserData,
        newUserData,
        user.id,
      );

      // Commit transaction
      await queryRunner.commitTransaction();

      // Xóa ảnh cũ trên Cloudinary sau khi transaction thành công
      if (oldImageToDelete && uploadedAvatar) {
        try {
          await this.cloudinaryService.deleteImage(oldImageToDelete.publicId);
        } catch (err) {
          console.warn(
            'Không thể xóa ảnh cũ trên Cloudinary (không ảnh hưởng):',
            err.message,
          );
        }
      }

      return new BaseResponse(
        HttpStatus.OK,
        'Cập nhật thông tin cá nhân thành công',
        {
          id: userEntity.id,
          firstName: userEntity.firstName,
          lastName: userEntity.lastName,
          fullName: `${userEntity.firstName} ${userEntity.lastName}`,
          email: userEntity.email,
          phoneNumber: userEntity.phoneNumber,
          dateBirth: userEntity.dateBirth,
          gender: userEntity.gender,
          address: userEntity.address,
          status: userEntity.status,
          avatar: avatarUrl,
        },
      );
    } catch (error) {
      // Rollback transaction nếu có lỗi
      await queryRunner.rollbackTransaction();

      // Xóa ảnh đã upload trên Cloudinary nếu transaction thất bại
      if (uploadedAvatar) {
        try {
          await this.cloudinaryService.deleteImage(uploadedAvatar.public_id);
        } catch (err) {
          console.warn(
            'Không thể xóa ảnh trên Cloudinary sau khi rollback:',
            err.message,
          );
        }
      }

      console.error('Lỗi khi cập nhật profile:', error);
      throw new BadRequestException(
        'Có lỗi xảy ra khi cập nhật thông tin. Vui lòng thử lại.',
      );
    } finally {
      // Release query runner
      await queryRunner.release();
    }
  }

  async getLoginHistory(user: JwtPayloadUser) {
    const { id } = user;

    // Query cơ bản để lấy user sessions
    const queryBuilder = this.userSessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.user', 'user')
      .where('user.id = :userId', { userId: id })
      .andWhere('session.deletedAt IS NULL')
      .orderBy(`session.createdAt`, 'DESC');

    // Lấy dữ liệu và đếm tổng số bản ghi
    const [sessions] = await queryBuilder.getManyAndCount();

    // Map kết quả với địa chỉ đã được xử lý
    const result = sessions.map((session) => {
      return {
        id: session.id,
        deviceInfo: session.deviceInfo,
        deviceId: session.deviceId,
        ip: session.ipAddress,
        loginTime: session.createdAt,
      };
    });

    return new BaseResponse(
      HttpStatus.OK,
      'Lấy lịch sử đăng nhập thành công',
      result,
    );
  }
}
