import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsPhoneNumber, Length } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'Họ và tên đệm của người dùng.',
    example: 'Nguyễn Văn',
  })
  @IsNotEmpty({ message: 'Vui lòng nhập Họ và tên đệm.' })
  @Length(2, 50, {
    message: 'Họ và tên đệm phải từ 2 đến 50 ký tự',
  })
  firstName: string;

  @ApiProperty({
    description: 'Tên của người dùng',
    example: 'A',
  })
  @IsNotEmpty({ message: 'Tên không được để trống.' })
  lastName: string;

  @ApiProperty({
    description: 'Email của người dùng',
    example: 'example@gmail.com',
  })
  @IsNotEmpty({ message: 'Email không được để trống.' })
  @IsEmail({}, { message: 'Email không đúng định dạng.' })
  email: string;

  @ApiProperty({
    description: 'Số điện thoại của người dùng',
    example: '0898987871',
  })
  @IsNotEmpty({ message: 'Số điện thoại không được để trống.' })
  @IsPhoneNumber('VN', { message: 'Số điện thoại không hợp lệ.' })
  phoneNumber: string;

  @ApiProperty({
    description: 'Mật khẩu của người dùng',
    example: 'P@ssw0rd123',
  })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống.' })
  password: string;

  @ApiProperty({
    description: 'Id của thiết bị',
    example: '123456',
  })
  @IsNotEmpty({ message: 'Id của thiết bị không được để trống.' })
  deviceId: string;
}
