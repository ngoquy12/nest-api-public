import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Friend, FriendStatus } from './entities/friend.entity';
import { User } from 'src/modules/users/entities/user.entity';
import {
  SendFriendRequestDto,
  RespondToFriendRequestDto,
} from './dto/friend.dto';
import {
  INotificationService,
  IChatGateway,
} from './interfaces/services.interface';

@Injectable()
export class FriendService {
  constructor(
    @InjectRepository(Friend)
    private friendRepository: Repository<Friend>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @Inject('NOTIFICATION_SERVICE')
    private notificationService: INotificationService,
    @Inject('CHAT_GATEWAY')
    private chatGateway: IChatGateway,
  ) {}

  async sendFriendRequest(
    userId: number,
    sendFriendRequestDto: SendFriendRequestDto,
  ): Promise<Friend> {
    const { addresseeId, message } = sendFriendRequestDto;

    if (addresseeId === userId) {
      throw new BadRequestException('Cannot send friend request to yourself');
    }

    // Check if user exists
    const addressee = await this.userRepository.findOne({
      where: { id: addresseeId },
    });
    if (!addressee) {
      throw new NotFoundException('User not found');
    }

    // Check if friend request already exists
    const existingRequest = await this.friendRepository.findOne({
      where: [
        { requesterId: userId, addresseeId },
        { requesterId: addresseeId, addresseeId: userId },
      ],
    });

    if (existingRequest) {
      throw new BadRequestException('Friend request already exists');
    }

    const friendRequest = this.friendRepository.create({
      requesterId: userId,
      addresseeId,
      message,
      status: FriendStatus.PENDING,
    });

    const savedRequest = await this.friendRepository.save(friendRequest);

    // Create notification
    await this.notificationService.createNotification({
      userId: addresseeId,
      type: 'friend_request' as any,
      title: 'New Friend Request',
      content: `You have a new friend request`,
      data: JSON.stringify({
        friendRequestId: savedRequest.id,
        requesterId: userId,
      }),
    });

    // Send real-time notification if user is online
    if (this.chatGateway.isUserOnline(addresseeId)) {
      await this.chatGateway.sendNotificationToUser(addresseeId, {
        type: 'friend_request',
        title: 'New Friend Request',
        content: `You have a new friend request`,
        data: {
          friendRequestId: savedRequest.id,
          requesterId: userId,
        },
      });
    }

    return savedRequest;
  }

  async respondToFriendRequest(
    userId: number,
    respondDto: RespondToFriendRequestDto,
  ): Promise<Friend> {
    const { friendId, status } = respondDto;

    const friendRequest = await this.friendRepository.findOne({
      where: { id: friendId, addresseeId: userId },
      relations: ['requester'],
    });

    if (!friendRequest) {
      throw new NotFoundException('Friend request not found');
    }

    if (friendRequest.status !== FriendStatus.PENDING) {
      throw new BadRequestException(
        'Friend request has already been responded to',
      );
    }

    friendRequest.status = status;
    if (status === FriendStatus.ACCEPTED) {
      friendRequest.acceptedAt = new Date();
    }

    const updatedRequest = await this.friendRepository.save(friendRequest);

    // Create notification for requester
    const notificationTitle =
      status === FriendStatus.ACCEPTED
        ? 'Friend Request Accepted'
        : 'Friend Request Declined';
    const notificationContent =
      status === FriendStatus.ACCEPTED
        ? 'Your friend request has been accepted'
        : 'Your friend request has been declined';

    await this.notificationService.createNotification({
      userId: friendRequest.requesterId,
      type: 'friend_accepted' as any,
      title: notificationTitle,
      content: notificationContent,
      data: JSON.stringify({
        friendRequestId: friendId,
        addresseeId: userId,
        status,
      }),
    });

    // Send real-time notification if requester is online
    if (this.chatGateway.isUserOnline(friendRequest.requesterId)) {
      await this.chatGateway.sendNotificationToUser(friendRequest.requesterId, {
        type: 'friend_accepted',
        title: notificationTitle,
        content: notificationContent,
        data: {
          friendRequestId: friendId,
          addresseeId: userId,
          status,
        },
      });
    }

    return updatedRequest;
  }

  async getFriendRequests(userId: number): Promise<Friend[]> {
    return await this.friendRepository.find({
      where: { addresseeId: userId, status: FriendStatus.PENDING },
      relations: ['requester'],
      order: { createdAt: 'DESC' },
    });
  }

  async getSentFriendRequests(userId: number): Promise<Friend[]> {
    return await this.friendRepository.find({
      where: { requesterId: userId },
      relations: ['addressee'],
      order: { createdAt: 'DESC' },
    });
  }

  async getFriends(userId: number): Promise<User[]> {
    const friends = await this.friendRepository.find({
      where: [
        { requesterId: userId, status: FriendStatus.ACCEPTED },
        { addresseeId: userId, status: FriendStatus.ACCEPTED },
      ],
      relations: ['requester', 'addressee'],
    });

    return friends.map((friend) =>
      friend.requesterId === userId ? friend.addressee : friend.requester,
    );
  }

  async removeFriend(userId: number, friendId: number): Promise<void> {
    const friend = await this.friendRepository.findOne({
      where: [
        {
          requesterId: userId,
          addresseeId: friendId,
          status: FriendStatus.ACCEPTED,
        },
        {
          requesterId: friendId,
          addresseeId: userId,
          status: FriendStatus.ACCEPTED,
        },
      ],
    });

    if (!friend) {
      throw new NotFoundException('Friend relationship not found');
    }

    await this.friendRepository.remove(friend);
  }

  async blockUser(userId: number, targetUserId: number): Promise<Friend> {
    if (targetUserId === userId) {
      throw new BadRequestException('Cannot block yourself');
    }

    // Check if user exists
    const targetUser = await this.userRepository.findOne({
      where: { id: targetUserId },
    });
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // Remove existing friend relationship if exists
    await this.friendRepository.delete([
      { requesterId: userId, addresseeId: targetUserId },
      { requesterId: targetUserId, addresseeId: userId },
    ]);

    // Create block relationship
    const block = this.friendRepository.create({
      requesterId: userId,
      addresseeId: targetUserId,
      status: FriendStatus.BLOCKED,
    });

    return await this.friendRepository.save(block);
  }

  async unblockUser(userId: number, targetUserId: number): Promise<void> {
    const block = await this.friendRepository.findOne({
      where: {
        requesterId: userId,
        addresseeId: targetUserId,
        status: FriendStatus.BLOCKED,
      },
    });

    if (!block) {
      throw new NotFoundException('Block relationship not found');
    }

    await this.friendRepository.remove(block);
  }

  async isBlocked(userId: number, targetUserId: number): Promise<boolean> {
    const block = await this.friendRepository.findOne({
      where: [
        {
          requesterId: userId,
          addresseeId: targetUserId,
          status: FriendStatus.BLOCKED,
        },
        {
          requesterId: targetUserId,
          addresseeId: userId,
          status: FriendStatus.BLOCKED,
        },
      ],
    });

    return !!block;
  }
}
