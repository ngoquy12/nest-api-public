import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ChangeLogType } from '../enums/change-log-type.enum';
import { ChangeLogAction } from '../enums/change-log-action.enum';

@Entity('change_logs')
export class ChangeLog {
  @PrimaryGeneratedColumn()
  id: number; // Primary key

  @Column()
  entityType: ChangeLogType; // Loại của thực thể (PRODUCT, EMPLOYEE,...)

  @Column()
  entityId: number; // Id của thực thể mà thay đổi

  @Column({ type: 'longtext' })
  changeData: string; // Dữ liệu thay đổi, lưu dưới dạng JSON

  @Column({ type: 'int', default: 1 })
  version: number; // Phiên bản thay đổi dữ liệu của thực thể

  @Column({
    type: 'enum',
    enum: ChangeLogAction,
    default: ChangeLogAction.CREATE, // Hành động thay đổi (CREATE, UPDATE, DELETE)
  })
  action: ChangeLogAction; // Hành động thay đổi

  @Column({ type: 'int', nullable: true })
  changedById?: number; // Người thực hiện thay đổi

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  changedAt: Date; // Thời gian thay đổi

  @Column({ type: 'timestamp', nullable: true })
  deletedAt?: Date; // Thời gian xóa bản ghi log

  @Column({ type: 'int', nullable: true })
  deletedById?: number; // Người xóa bản ghi log
}
