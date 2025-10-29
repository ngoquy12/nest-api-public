import { Gender } from 'src/common/enums/gender.enum';
import { UserStatus } from 'src/modules/users/enums/user-status.enum';
import { Column, Entity, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { UserSession } from 'src/modules/users/entities/user-session.entity';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Role } from 'src/modules/roles/entities/role.entity';
import { Article } from 'src/modules/articles/entities/article.entity';
import { Comment } from 'src/modules/comments/entities/comment.entity';
import { Like } from 'src/modules/likes/entities/like.entity';
import { Cart } from 'src/modules/carts/entities/cart.entity';
import { Conversation } from 'src/modules/chats/entities/conversation.entity';
import { Message } from 'src/modules/chats/entities/message.entity';
import { Friend } from 'src/modules/friends/entities/friend.entity';
import { Notification } from 'src/modules/notifications/entities/notification.entity';

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

  @OneToMany(() => Article, (article) => article.author)
  articles: Article[];

  @OneToMany(() => Comment, (comment) => comment.user)
  comments: Comment[];

  @OneToMany(() => Like, (like) => like.user)
  likes: Like[];

  @OneToMany(() => Cart, (cart) => cart.user)
  carts: Cart[];

  @OneToMany(() => Conversation, (conversation) => conversation.creator)
  conversations: Conversation[];

  @OneToMany(() => Message, (message) => message.sender)
  messages: Message[];

  @OneToMany(() => Friend, (friend) => friend.requester)
  sentFriendRequests: Friend[];

  @OneToMany(() => Friend, (friend) => friend.addressee)
  receivedFriendRequests: Friend[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];
}
