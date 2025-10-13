import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchAndPagingEmployeeDto {
  @ApiPropertyOptional({
    description: 'Từ khóa tìm kiếm (tên nhân viên, mã nhân viên, email)',
    example: 'Nguyễn Văn A',
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    description: 'Trang hiện tại',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  currentPage?: number;

  @ApiPropertyOptional({
    description: 'Số lượng bản ghi mỗi trang',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  pageSize?: number;

  @ApiPropertyOptional({
    description: 'Danh sách ID vị trí công việc',
    example: [1, 2, 3],
    type: 'array',
    items: {
      type: 'number',
    },
    isArray: true,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ each: true })
  positionIds?: number[];
}
