import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';
import { IsArray, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @ApiProperty({
    description: 'Danh sách id của ảnh cần giữ lại',
  })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map((v) => parseInt(v, 10)).filter((v) => !isNaN(v));
    }
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((v) => parseInt(v, 10))
        .filter((v) => !isNaN(v));
    }
    return [];
  })
  keepImageIds: number[];
}
