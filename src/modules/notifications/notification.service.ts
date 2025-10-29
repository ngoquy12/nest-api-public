import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Notification,
  NotificationStatus,
} from './entities/notification.entity';
import {
  CreateNotificationDto,
  MarkNotificationAsReadDto,
  MarkAllNotificationsAsReadDto,
} from './dto/notification.dto';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async createNotification(
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create(
      createNotificationDto,
    );
    return await this.notificationRepository.save(notification);
  }

  async getUserNotifications(
    userId: number,
    page: number = 1,
    limit: number = 20,
  ): Promise<Notification[]> {
    return await this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async getUnreadNotifications(userId: number): Promise<Notification[]> {
    return await this.notificationRepository.find({
      where: { userId, status: NotificationStatus.UNREAD },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(
    markAsReadDto: MarkNotificationAsReadDto,
  ): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id: markAsReadDto.notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.status = NotificationStatus.READ;
    notification.readAt = new Date();

    return await this.notificationRepository.save(notification);
  }

  async markAllAsRead(
    markAllAsReadDto: MarkAllNotificationsAsReadDto,
  ): Promise<void> {
    await this.notificationRepository.update(
      { userId: markAllAsReadDto.userId, status: NotificationStatus.UNREAD },
      { status: NotificationStatus.READ, readAt: new Date() },
    );
  }

  async getUnreadCount(userId: number): Promise<number> {
    return await this.notificationRepository.count({
      where: { userId, status: NotificationStatus.UNREAD },
    });
  }

  async deleteNotification(
    notificationId: number,
    userId: number,
  ): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.notificationRepository.remove(notification);
  }

  async deleteAllNotifications(userId: number): Promise<void> {
    await this.notificationRepository.delete({ userId });
  }
}
