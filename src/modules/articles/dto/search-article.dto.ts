import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class SearchArticleDto {
  @ApiProperty({
    description: 'Từ khóa tìm kiếm',
    example: 'NestJS',
    required: false,
  })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiProperty({
    description: 'ID danh mục bài viết',
    example: 1,
    required: false,
  })
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsOptional()
  categoryId?: number;

  @ApiProperty({
    description: 'ID tác giả',
    example: 1,
    required: false,
  })
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsOptional()
  authorId?: number;

  @ApiProperty({
    description: 'Trang hiện tại',
    example: 1,
    minimum: 1,
    required: false,
  })
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsOptional()
  @Min(1)
  currentPage?: number = 1;

  @ApiProperty({
    description: 'Số bản ghi trên mỗi trang',
    example: 10,
    minimum: 1,
    maximum: 100,
    required: false,
  })
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  pageSize?: number = 10;
}
