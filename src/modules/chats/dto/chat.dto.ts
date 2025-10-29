import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConversationType } from '../entities/conversation.entity';
import { MessageType } from '../entities/message.entity';

export class CreateConversationDto {
  @ApiProperty({
    enum: ConversationType,
    example: 'private',
    description: 'Loại cuộc trò chuyện',
  })
  @IsEnum(ConversationType)
  type: ConversationType;

  @ApiPropertyOptional({
    example: 'Team A',
    description: 'Tên nhóm (chỉ dùng cho group)',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Nhóm thảo luận sprint 12' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    type: [Number],
    example: [2, 3],
    description: 'Danh sách userId tham gia',
  })
  @IsArray()
  @IsNumber({}, { each: true })
  participantIds: number[];
}

export class SendMessageDto {
  @ApiProperty({ example: 10 })
  @IsNumber()
  conversationId: number;

  @ApiProperty({ example: 'Hello' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ enum: MessageType, example: 'text' })
  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;

  @ApiPropertyOptional({ example: 501 })
  @IsOptional()
  @IsNumber()
  replyToId?: number;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/files/file.pdf' })
  @IsOptional()
  @IsString()
  fileUrl?: string;

  @ApiPropertyOptional({ example: 'file.pdf' })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional({ example: 12345 })
  @IsOptional()
  @IsNumber()
  fileSize?: number;
}

export class JoinConversationDto {
  @ApiProperty({ example: 10 })
  @IsNumber()
  conversationId: number;
}

export class LeaveConversationDto {
  @ApiProperty({ example: 10 })
  @IsNumber()
  conversationId: number;
}
