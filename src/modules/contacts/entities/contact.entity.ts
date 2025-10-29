import { Column, Entity } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';

export enum ContactTag {
  FAMILY = 'FAMILY',
  FRIEND = 'FRIEND',
  COLLEAGUE = 'COLLEAGUE',
  OTHER = 'OTHER',
}

@Entity('contacts')
export class Contact extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  contactName: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  phoneNumber: string;

  @Column({ type: 'enum', enum: ContactTag, default: ContactTag.OTHER })
  tag: ContactTag;

  @Column({ type: 'boolean', default: false })
  isBlocked: boolean;
}
