import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import {
  Conversation,
  ConversationParticipant,
} from './entities/conversation.entity';
import { Message, MessageStatus } from './entities/message.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { CreateConversationDto, SendMessageDto } from './dto/chat.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(ConversationParticipant)
    private participantRepository: Repository<ConversationParticipant>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async verifyToken(token: string): Promise<User | null> {
    try {
      const decoded = this.jwtService.verify(token.replace('Bearer ', ''));
      return await this.userRepository.findOne({ where: { id: decoded.sub } });
    } catch (error) {
      return null;
    }
  }

  async createConversation(
    userId: number,
    createConversationDto: CreateConversationDto,
  ): Promise<Conversation> {
    const conversation = this.conversationRepository.create({
      ...createConversationDto,
      createdBy: userId,
    });

    const savedConversation =
      await this.conversationRepository.save(conversation);

    // Add creator as participant
    await this.addParticipant(savedConversation.id, userId, true);

    // Add other participants
    for (const participantId of createConversationDto.participantIds) {
      if (participantId !== userId) {
        await this.addParticipant(savedConversation.id, participantId, false);
      }
    }

    return this.getConversationById(savedConversation.id, userId);
  }

  async addParticipant(
    conversationId: number,
    userId: number,
    isAdmin: boolean = false,
  ): Promise<void> {
    const participant = this.participantRepository.create({
      conversationId,
      userId,
      isAdmin,
      joinedAt: new Date(),
    });

    await this.participantRepository.save(participant);
  }

  async getConversationById(
    conversationId: number,
    userId: number,
  ): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['participants', 'participants.user', 'creator'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Check if user is participant
    const isParticipant = conversation.participants.some(
      (p) => p.userId === userId,
    );
    if (!isParticipant) {
      throw new ForbiddenException(
        'You are not a participant of this conversation',
      );
    }

    return conversation;
  }

  async getUserConversations(userId: number): Promise<Conversation[]> {
    return await this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.participants', 'participant')
      .leftJoinAndSelect('participant.user', 'user')
      .leftJoinAndSelect('conversation.creator', 'creator')
      .leftJoinAndSelect('conversation.messages', 'message')
      .where('participant.userId = :userId', { userId })
      .andWhere('participant.leftAt IS NULL')
      .orderBy('conversation.updatedAt', 'DESC')
      .getMany();
  }

  async sendMessage(
    userId: number,
    sendMessageDto: SendMessageDto,
  ): Promise<Message> {
    // Verify user is participant
    await this.getConversationById(sendMessageDto.conversationId, userId);

    const message = this.messageRepository.create({
      ...sendMessageDto,
      senderId: userId,
    });

    return await this.messageRepository.save(message);
  }

  async getConversationMessages(
    conversationId: number,
    userId: number,
    page: number = 1,
    limit: number = 50,
  ): Promise<Message[]> {
    // Verify user is participant
    await this.getConversationById(conversationId, userId);

    return await this.messageRepository.find({
      where: { conversationId },
      relations: ['sender', 'replyTo'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async markMessagesAsRead(
    userId: number,
    conversationId: number,
  ): Promise<void> {
    await this.messageRepository.update(
      {
        conversationId,
        senderId: Not(userId),
        status: MessageStatus.SENT,
      },
      { status: MessageStatus.READ },
    );
  }

  async getConversationParticipants(
    conversationId: number,
  ): Promise<ConversationParticipant[]> {
    return await this.participantRepository.find({
      where: { conversationId, leftAt: null },
      relations: ['user'],
    });
  }

  async leaveConversation(
    userId: number,
    conversationId: number,
  ): Promise<void> {
    await this.participantRepository.update(
      { conversationId, userId },
      { leftAt: new Date() },
    );
  }

  async createPrivateConversation(
    userId1: number,
    userId2: number,
  ): Promise<Conversation> {
    // Check if private conversation already exists
    const existingConversation = await this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoin('conversation.participants', 'p1')
      .leftJoin('conversation.participants', 'p2')
      .where('conversation.type = :type', { type: 'private' })
      .andWhere('p1.userId = :userId1', { userId1 })
      .andWhere('p2.userId = :userId2', { userId2 })
      .andWhere('p1.leftAt IS NULL')
      .andWhere('p2.leftAt IS NULL')
      .getOne();

    if (existingConversation) {
      return existingConversation;
    }

    // Create new private conversation
    return await this.createConversation(userId1, {
      type: 'private' as any,
      participantIds: [userId2],
    });
  }
}
