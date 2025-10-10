import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { PositionStatus } from '../enums/position.enum';

export class CreatePositionDto {
  @ApiProperty({
    description: 'Tên vị trí công việc',
    example: 'Kế toán',
  })
  @IsNotEmpty({ message: 'Tên vị trí không được để trống' })
  @MaxLength(100, {
    message: 'Tên vị trí không được vượt quá 100 ký tự',
  })
  positionName: string;

  @ApiProperty({
    description: 'Trang thái của vị trí',
    example: PositionStatus.ACTIVE,
  })
  @IsNotEmpty({ message: 'Trạng thái không được để trống' })
  @IsEnum(PositionStatus, {
    message: 'Trạng thái không hợp lệ',
  })
  positionStatus: PositionStatus;

  @ApiProperty({
    description: 'Mô tả thông tin vị trí công việc',
    example: 'Mô tả vị trí',
  })
  @IsOptional()
  description?: string;
}
