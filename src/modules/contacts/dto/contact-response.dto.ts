import { ApiProperty } from '@nestjs/swagger';
import { ContactTag } from '../entities/contact.entity';

export class ContactResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Nguyen Van A' })
  contactName: string;

  @ApiProperty({ example: '+84901234567' })
  phoneNumber: string;

  @ApiProperty({ enum: ContactTag, example: 'FRIEND' })
  tag: ContactTag;

  @ApiProperty({ example: 'Bạn bè' })
  tagText: string;

  @ApiProperty({ example: false })
  isBlocked: boolean;

  @ApiProperty({ example: '2025-10-29T12:00:00.000Z' })
  createdAt?: Date;
}
