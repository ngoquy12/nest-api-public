import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class SearchPositionDto {
  @ApiPropertyOptional({
    description: 'Từ khóa tìm kiếm theo tên vị trí',
    example: 'Developer',
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    description: 'Số trang hiện tại',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  currentPage?: number = 1;

  @ApiPropertyOptional({
    description: 'Số lượng bản ghi trên mỗi trang',
    example: 10,
    minimum: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  pageSize?: number = 10;
}
