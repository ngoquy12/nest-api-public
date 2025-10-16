import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LogoutDeviceDto {
  @ApiProperty({
    description: 'ID của thiết bị cần đăng xuất',
    example: 'device-123-456-789',
  })
  @IsString()
  @IsNotEmpty()
  deviceId: string;
}
