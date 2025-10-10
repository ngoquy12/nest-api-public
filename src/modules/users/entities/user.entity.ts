import { Gender } from 'src/common/enums/gender.enum';
import { UserStatus } from 'src/modules/users/enums/user-status.enum';
import { Column, Entity, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { UserSession } from 'src/modules/users/entities/user-session.entity';
import { PasswordHistory } from 'src/modules/password-histories/entities/password-history.entity';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Role } from 'src/modules/roles/entities/role.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ default: null })
  dateBirth: Date;

  @Column({ type: 'enum', enum: Gender, default: Gender.MALE })
  gender: Gender;

  @Column({ default: null })
  email: string;

  @Column({ nullable: true })
  password?: string;

  @Column({ unique: true })
  phoneNumber: string;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Column({ nullable: true, length: 255 })
  address: string;

  @Column({ nullable: true, name: 'role_id' })
  roleId: number;

  @ManyToOne(() => Role, (role) => role.users)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @OneToMany(() => UserSession, (userSession) => userSession.user)
  sessions: UserSession[];

  @OneToMany(() => PasswordHistory, (passwordHistory) => passwordHistory.user)
  passwordHistories: PasswordHistory[];
}
