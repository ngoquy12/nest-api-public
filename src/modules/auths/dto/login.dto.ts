import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Length, IsBoolean, IsPhoneNumber } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Số điện thoại của người dùng.',
    example: '0898987871',
  })
  @IsNotEmpty({ message: 'Số điện thoại không được để trống.' })
  @IsPhoneNumber('VN', { message: 'Số điện thoại không đúng định dạng' })
  phoneNumber: string;

  @ApiProperty({
    description: 'Mật khẩu của người dùng',
    example: 'P@ssw0rd123',
  })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @Length(8, 20, {
    message:
      'Mật khẩu tối thiểu 8-20 ký tự bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt',
  })
  password: string;

  @ApiProperty({
    description: 'Id thiết bị của người dùng.',
    example: '1f025e94-34a0-6ee0-9ea8-30bb204232cf',
  })
  @IsNotEmpty({ message: 'Id thiết bị không được để trống' })
  deviceId?: string;

  @ApiProperty({
    description: 'Ghi nhớ đăng nhập trên thiết bị',
    example: true,
    default: true,
  })
  @IsBoolean({ message: 'Giá trị không hợp lệ' })
  isRemembered: boolean;
}
