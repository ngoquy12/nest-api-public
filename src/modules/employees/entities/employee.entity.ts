import { Position } from 'src/modules/positions/entities/position.entity';
import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Gender } from 'src/common/enums/gender.enum';

@Entity('employees')
export class Employee extends BaseEntity {
  @ApiProperty({
    description: 'Mã nhân viên duy nhất',
    example: 'NV0001',
  })
  @Column({ unique: true, length: 30 })
  employeeCode: string;

  @ApiProperty({
    description: 'Tên đầy đủ của nhân viên',
    example: 'Nguyễn Văn Nam',
  })
  @Column({ length: 200 })
  employeeName: string;

  @ApiProperty({
    description: 'Giới tính của nhân viên',
    enum: Gender,
    example: Gender.MALE,
  })
  @Column({ type: 'enum', enum: Gender, default: Gender.MALE })
  gender: Gender;

  @ApiProperty({
    description: 'Ngày sinh của nhân viên',
    example: '1990-01-01',
    nullable: true,
  })
  @Column({ type: 'date', nullable: true })
  dateBirth: Date;

  @ApiProperty({
    description: 'Số điện thoại của nhân viên',
    example: '0123456789',
  })
  @Column({ unique: true, length: 15 })
  phoneNumber: string;

  @ApiProperty({
    description: 'ID của vị trí công việc',
    example: 1,
    nullable: true,
  })
  @Column({ nullable: true })
  positionId: number;

  // Quan hệ với Position (Many-to-One)
  @ManyToOne(() => Position, (position) => position.employees, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'positionId' })
  position: Position;
}
