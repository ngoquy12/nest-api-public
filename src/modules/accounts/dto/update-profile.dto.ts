import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  Length,
  IsPhoneNumber,
  MaxLength,
  MinLength,
  IsNotEmpty,
} from 'class-validator';
import { Gender } from 'src/common/enums/gender.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBeforeToday } from 'src/common/validators/index';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'Họ và tên đầy đủ',
    example: 'Nguyễn Văn A',
  })
  @IsOptional()
  @IsString()
  @Length(1, 100, { message: 'Họ và tên phải có từ 1 đến 100 ký tự' })
  fullName?: string;

  @ApiPropertyOptional({ example: 'example@gmail.com', description: 'Email' })
  @IsOptional()
  @IsString({ message: 'Email phải là một chuỗi.' })
  @IsEmail({}, { message: 'Email không hợp lệ.' })
  @MinLength(10, {
    message: 'Email tối thiểu 10 ký tự.',
  })
  @MaxLength(100, { message: 'Email không được quá 100 ký tự.' })
  email?: string;

  @ApiProperty({ example: '0898987654', description: 'Số điện thoại' })
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @IsPhoneNumber('VN', { message: 'Số điện thoại không hợp lệ' })
  phoneNumber: string;

  @ApiPropertyOptional({ example: '1990-01-01', description: 'Ngày sinh' })
  @IsOptional()
  @IsBeforeToday({ message: 'Ngày sinh phải nhỏ hơn ngày hiện tại' })
  dateBirth?: string;

  @ApiProperty({ example: Gender.MALE, description: 'Giới tính' })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ApiPropertyOptional({
    example: 'Số 1, Đường ABC, Phường XYZ, Quận 1, TP.HCM',
    description: 'Địa chỉ',
  })
  @IsOptional()
  @IsString({ message: 'Địa chỉ phải là chuỗi.' })
  @MinLength(10, {
    message: 'Địa chỉ tối thiểu 10 ký tự.',
  })
  @MaxLength(200, {
    message: 'Địa chỉ tối đa 200 ký tự.',
  })
  address?: string;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Ảnh đại diện cá nhân',
  })
  avatar?: Express.Multer.File;
}
