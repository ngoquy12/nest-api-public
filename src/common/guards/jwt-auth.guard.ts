import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: Error | null, user) {
    if (err) throw err;
    if (!user)
      throw new UnauthorizedException(
        'Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn',
      );
    return user;
  }
}
