import { Position } from 'src/modules/positions/entities/position.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';
import { EmployeeStatus } from '../enums/employee-status';
import { User } from 'src/modules/users/entities/user.entity';

@Entity('employees')
export class Employee {
  @Column({ unique: true })
  employeeCode: string;

  @Column({
    type: 'enum',
    enum: EmployeeStatus,
    default: EmployeeStatus.WORKING,
  })
  employeeStatus: EmployeeStatus;

  @PrimaryColumn({ name: 'user_id' })
  userId: number;

  @OneToOne(() => User, { cascade: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Position, (position) => position.employees)
  position: Position;

  @Column({ name: 'created_by', nullable: true })
  createdBy: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: User;
}
