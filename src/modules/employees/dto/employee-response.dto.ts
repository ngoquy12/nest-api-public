import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from 'src/common/enums/gender.enum';

export class EmployeeResponseDto {
  @ApiProperty({
    description: 'ID của nhân viên',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Mã nhân viên',
    example: 'NV0001',
  })
  employeeCode: string;

  @ApiProperty({
    description: 'Tên đầy đủ của nhân viên',
    example: 'Nguyễn Văn Nam',
  })
  employeeName: string;

  @ApiProperty({
    description: 'Số điện thoại',
    example: '0123456789',
  })
  phoneNumber: string;

  @ApiProperty({
    description: 'Giới tính',
    enum: Gender,
    example: Gender.MALE,
  })
  gender: Gender;

  @ApiPropertyOptional({
    description: 'Ngày sinh',
    example: '1990-01-01',
  })
  dateBirth?: string;

  @ApiProperty({
    description: 'Ngày tạo',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: string;

  @ApiPropertyOptional({
    description: 'ID vị trí công việc',
    example: 1,
  })
  positionId?: number;

  @ApiPropertyOptional({
    description: 'Tên vị trí công việc',
    example: 'Nhân viên bán hàng',
  })
  positionName?: string;
}
