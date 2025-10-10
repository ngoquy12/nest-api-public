import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Matches } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Mật khẩu cũ',
    example: 'P@ssw0rd123',
  })
  @IsNotEmpty({ message: 'Mật khẩu cũ không được để trống.' })
  oldPassword: string;

  @ApiProperty({
    description: 'Mật khẩu mới',
    example: 'P@ssw0rd1234',
  })
  @IsNotEmpty({ message: 'Mật khẩu mới không được để trống.' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>/?]).{8,}$/,
    {
      message:
        'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.',
    },
  )
  newPassword: string;
}
