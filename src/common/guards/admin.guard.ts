import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtPayloadUser } from 'src/modules/auths/interfaces/jwt-payload-user';
import { RoleCode } from '../enums/role-code.enum';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: JwtPayloadUser = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException('Không có quyền truy cập tài nguyên này');
    }

    const isAdmin = user.role?.code === RoleCode.ADMIN;

    if (!isAdmin) {
      throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này');
    }

    return true;
  }
}
