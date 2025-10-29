import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '../entities/notification.entity';

export class CreateNotificationDto {
  @ApiProperty({ example: 1, description: 'User nhận thông báo' })
  @IsNumber()
  userId: number;

  @ApiProperty({ enum: NotificationType, example: 'friend_request' })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ example: 'New Friend Request' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'You have a new friend request' })
  @IsString()
  content: string;

  @ApiPropertyOptional({
    example: '{"friendRequestId":123}',
    description: 'JSON string',
  })
  @IsOptional()
  @IsString()
  data?: string;

  @ApiPropertyOptional({ example: 'https://...' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ example: 'https://app.example.com/notifications/123' })
  @IsOptional()
  @IsString()
  actionUrl?: string;
}

export class MarkNotificationAsReadDto {
  @ApiProperty({ example: 900 })
  @IsNumber()
  notificationId: number;
}

export class MarkAllNotificationsAsReadDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  userId: number;
}
