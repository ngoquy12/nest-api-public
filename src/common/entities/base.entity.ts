import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export class BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt?: Date;

  @Column({ nullable: true })
  createdBy?: number;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt?: Date;

  @Column({ nullable: true })
  updatedBy?: number;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt?: Date;

  @Column({ nullable: true })
  deletedBy?: number;
}
