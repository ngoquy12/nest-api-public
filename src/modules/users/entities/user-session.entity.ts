import { BaseEntity } from 'src/common/entities/base.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity('user_sessions')
export class UserSession extends BaseEntity {
  @ManyToOne(() => User, (user) => user.sessions, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'varchar', length: 512, unique: true }) // RefreshToken: string;
  refreshToken: string;

  @Column()
  deviceInfo: string; // Tên thiết bị hoặc trình duyệt

  @Column({ type: 'varchar', length: 255 }) // Id của thiết bị (UUID hoặc ID duy nhất)
  deviceId: string;

  @Column({ type: 'varchar', length: 64, nullable: true }) // IP nếu có
  ipAddress: string;

  @Column({ default: false })
  isRemembered: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number; // Vĩ độ của thiết bị

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number; // Kinh độ của thiết bị

  @Column({ default: true })
  isActive: boolean; // Trạng thái session có đang hoạt động không

  @Column({ type: 'timestamp', nullable: true })
  logoutAt: Date; // Thời gian đăng xuất

  @Column({ type: 'timestamp', nullable: true })
  lastSeenAt: Date; // Thời gian hoạt động cuối cùng (heartbeat)
}
