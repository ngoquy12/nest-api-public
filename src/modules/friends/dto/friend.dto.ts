import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FriendStatus } from '../entities/friend.entity';

export class SendFriendRequestDto {
  @ApiProperty({ example: 2, description: 'User nhận lời mời' })
  @IsNumber()
  addresseeId: number;

  @ApiPropertyOptional({ example: "Hi, let's connect!" })
  @IsOptional()
  @IsString()
  message?: string;
}

export class RespondToFriendRequestDto {
  @ApiProperty({ example: 300 })
  @IsNumber()
  friendId: number;

  @ApiProperty({ enum: FriendStatus, example: 'accepted' })
  @IsEnum(FriendStatus)
  status: FriendStatus;
}

export class BlockUserDto {
  @ApiProperty({ example: 5 })
  @IsNumber()
  userId: number;
}

export class UnblockUserDto {
  @ApiProperty({ example: 5 })
  @IsNumber()
  userId: number;
}
