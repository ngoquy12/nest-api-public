import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class LogoutDto {
  @ApiProperty({
    description: 'Refresh token của người dùng',
    example: 'my_refresh_token',
  })
  @IsNotEmpty({ message: 'Refresh token không được để trống.' })
  refreshToken: string;
}
