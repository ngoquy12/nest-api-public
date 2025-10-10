import { BaseEntity } from 'src/common/entities/base.entity';
import { Employee } from 'src/modules/employees/entities/employee.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { PositionStatus } from '../enums/position.enum';

@Entity('positions')
export class Position extends BaseEntity {
  @Column()
  positionName: string;

  @Column({ nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: PositionStatus,
    default: PositionStatus.ACTIVE,
  })
  positionStatus: PositionStatus;

  @OneToMany(() => Employee, (employee) => employee.position)
  employees: Employee[];
}
