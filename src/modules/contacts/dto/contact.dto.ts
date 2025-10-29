import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContactTag } from '../entities/contact.entity';

const PHONE_REGEX = /^\+?[0-9]{7,15}$/;

export class CreateContactDto {
  @ApiProperty({ example: 'Nguyen Van A', maxLength: 255 })
  @IsNotEmpty({ message: 'Tên liên hệ không được để trống' })
  @IsString({ message: 'Tên liên hệ phải là chuỗi' })
  @Length(1, 255, { message: 'Tên liên hệ phải có từ 1 đến 100 ký tự' })
  contactName: string;

  @ApiProperty({
    example: '+84901234567',
    description: '7-15 chữ số, cho phép + đầu',
  })
  @IsNotEmpty({ message: 'Số liên hệ không được để trống' })
  @IsString({ message: 'Số liên hệ phải là chuỗi' })
  @Length(7, 15, { message: 'Số liên hệ phải có từ 7 đến 15 ký tự' })
  @Matches(PHONE_REGEX, { message: 'Số liên hệ không hợp lệ' })
  phoneNumber: string;

  @ApiProperty({ enum: ContactTag, example: 'FRIEND' })
  @IsEnum(ContactTag, { message: 'Tag không hợp lệ' })
  tag: ContactTag;
}

export class UpdateContactDto {
  @ApiPropertyOptional({ example: 'Nguyen Van B', maxLength: 255 })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  contactName?: string;

  @ApiPropertyOptional({ example: '0901234567' })
  @IsOptional()
  @IsString()
  @Matches(PHONE_REGEX, {
    message: 'phone must be a valid international phone number',
  })
  phoneNumber?: string;

  @ApiPropertyOptional({ enum: ContactTag, example: 'COLLEAGUE' })
  @IsOptional()
  @IsEnum(ContactTag)
  tag?: ContactTag;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isBlocked?: boolean;
}
