import { BaseEntity } from 'src/common/entities/base.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity({ name: 'password_histories' })
export class PasswordHistory extends BaseEntity {
  @ManyToOne(() => User, (user) => user.passwordHistories, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    eager: false,
  })
  user: User;

  @Column()
  hashedPassword: string;
}
