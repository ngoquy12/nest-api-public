import {
  IsEnum,
  IsOptional,
  IsString,
  IsNotEmpty,
  IsPhoneNumber,
  Matches,
  MinLength,
  MaxLength,
  IsDateString,
} from 'class-validator';
import { Gender } from 'src/common/enums/gender.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBeforeToday } from 'src/common/validators/is-before-today.validator';

export class CreateEmployeeDto {
  @ApiProperty({
    example: 'NV0001',
    description: 'Mã nhân viên duy nhất',
    maxLength: 30,
  })
  @IsNotEmpty({ message: 'Mã nhân viên không được để trống.' })
  @MaxLength(30, { message: 'Mã nhân viên không được quá 30 ký tự.' })
  @IsString({ message: 'Mã nhân viên phải là chuỗi.' })
  @Matches(/^[A-Z0-9]+$/, {
    message: 'Mã nhân viên chỉ được chứa chữ hoa và số.',
  })
  employeeCode: string;

  @ApiProperty({
    example: 'Nguyễn Văn Nam',
    description: 'Tên đầy đủ của nhân viên',
    minLength: 2,
    maxLength: 200,
  })
  @IsNotEmpty({ message: 'Tên nhân viên không được để trống.' })
  @MinLength(2, { message: 'Tên nhân viên tối thiểu 2 ký tự.' })
  @MaxLength(200, { message: 'Tên nhân viên không được quá 200 ký tự.' })
  @IsString({ message: 'Tên nhân viên phải là chuỗi.' })
  @Matches(/^[\p{L}\s-]+$/u, {
    message:
      'Tên nhân viên chỉ được chứa chữ cái, khoảng trắng và dấu gạch ngang.',
  })
  employeeName: string;

  @ApiProperty({
    example: '0123456789',
    description: 'Số điện thoại của nhân viên',
    maxLength: 15,
  })
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @IsPhoneNumber('VN', { message: 'Số điện thoại không hợp lệ' })
  @MaxLength(15, { message: 'Số điện thoại không được quá 15 ký tự.' })
  phoneNumber: string;

  @ApiPropertyOptional({
    example: Gender.MALE,
    description: 'Giới tính của nhân viên',
    enum: Gender,
  })
  @IsOptional()
  @IsEnum(Gender, { message: 'Giới tính không hợp lệ.' })
  gender?: Gender;

  @ApiPropertyOptional({
    example: '1990-01-01',
    description: 'Ngày sinh của nhân viên (định dạng YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Ngày sinh phải có định dạng YYYY-MM-DD.' })
  @IsBeforeToday({ message: 'Ngày sinh phải nhỏ hơn ngày hiện tại' })
  dateBirth?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'ID của vị trí công việc',
    type: 'number',
  })
  @IsOptional()
  positionId?: number;
}
