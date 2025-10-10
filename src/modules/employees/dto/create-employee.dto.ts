import {
  IsEnum,
  IsOptional,
  IsString,
  IsNotEmpty,
  IsEmail,
  IsPhoneNumber,
  Matches,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Gender } from 'src/common/enums/gender.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBeforeToday } from 'src/common/validators/is-before-today.validator';
import { IsAgeBetween18And60 } from 'src/common/validators/is-age-between-16-and-60.validator';
import { EmployeeStatus } from '../enums/employee-status';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'NV0001', description: 'Mã nhân viên' })
  @IsNotEmpty({ message: 'Mã nhân viên không được để trống.' })
  @MaxLength(30, { message: 'Mã nhân viên không được quá 30 ký tự.' })
  @IsString({ message: 'Mã nhân viên phải là chuỗi.' })
  @Matches(/^[\p{L}0-9\s]+$/u, {
    message: 'Mã nhân viên không đúng định dạng.',
  })
  employeeCode: string;

  @ApiProperty({ example: 'Nguyễn Văn Nam', description: 'Tên nhân viên' })
  @IsNotEmpty({ message: 'Tên nhân viên không được để trống.' })
  @MinLength(10, { message: 'Tên nhân viên tối thiểu 10 ký tự.' })
  @MaxLength(200, { message: 'Tên nhân viên không được quá 200 ký tự.' })
  @IsString({ message: 'Tên nhân viên phải là chuỗi.' })
  @Matches(/^[\p{L}\d\s-]+$/u, {
    message: 'Tên nhân viên không được chứa ký tự đặc biệt.',
  })
  employeeName: string;

  @ApiProperty({
    example: EmployeeStatus.WORKING,
    description: 'Trạng thái hoạt động của nhân viên',
  })
  @IsNotEmpty({ message: 'Trạng thái không được để trống.' })
  @IsEnum(EmployeeStatus, {
    message: 'Trạng thái không hợp lệ',
  })
  employeeStatus?: EmployeeStatus;

  @ApiPropertyOptional({ example: 'Hà Nội', description: 'Địa chỉ' })
  @IsOptional()
  @IsString({ message: 'Địa chỉ phải là chuỗi.' })
  @MinLength(10, {
    message: 'Địa chỉ tối thiểu 10 ký tự.',
  })
  @MaxLength(200, {
    message: 'Địa chỉ tối đa 200 ký tự.',
  })
  address?: string;

  @ApiPropertyOptional({ example: '1999-01-01', description: 'Ngày sinh' })
  @IsOptional()
  @IsBeforeToday({ message: 'Ngày sinh phải nhỏ hơn ngày hiện tại' })
  @IsAgeBetween18And60({ message: 'Tuổi phải từ 18 đến dưới 60' })
  dateBirth?: string;

  @ApiProperty({ example: Gender.MALE, description: 'Giới tính' })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ApiPropertyOptional({ example: 'example@gmail.com', description: 'Email' })
  @IsOptional()
  @IsString({ message: 'Email phải là một chuỗi.' })
  @IsEmail({}, { message: 'Email không hợp lệ.' })
  @MinLength(10, {
    message: 'Email tối thiểu 10 ký tự.',
  })
  @MaxLength(100, { message: 'Email không được quá 200 ký tự.' })
  email?: string;

  @ApiProperty({ example: '0898987654', description: 'Số điện thoại' })
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @IsPhoneNumber('VN', { message: 'Số điện thoại không hợp lệ' })
  phoneNumber: string;
}
