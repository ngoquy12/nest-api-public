import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSession } from 'src/modules/users/entities/user-session.entity';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class SessionActiveGuard implements CanActivate {
  constructor(
    @InjectRepository(UserSession)
    private userSessionRepository: Repository<UserSession>,
    private jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token không được cung cấp');
    }

    try {
      // Giải mã token để lấy thông tin
      const payload = this.jwtService.verify(token);
      const userId = payload.sub;
      const deviceId = payload.deviceId;

      // Kiểm tra session có active không
      const session = await this.userSessionRepository.findOne({
        where: {
          user: { id: userId },
          deviceId: deviceId,
          isActive: true,
        },
      });

      if (!session) {
        throw new UnauthorizedException(
          'Phiên đăng nhập đã bị đăng xuất hoặc không tồn tại',
        );
      }

      // Cập nhật lastSeenAt
      session.lastSeenAt = new Date();
      await this.userSessionRepository.save(session);

      // Thêm thông tin session vào request
      request.user = {
        ...payload,
        sessionId: session.id,
      };

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
