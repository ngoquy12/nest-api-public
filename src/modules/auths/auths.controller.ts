import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AuthsService } from './auths.service';
import { RegisterDto } from './dto/register.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
} from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Request } from 'express';
import { Throttle, seconds } from '@nestjs/throttler';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtPayloadUser } from './interfaces/jwt-payload-user';

@ApiTags('Xác thực (Authentication)')
@ApiBearerAuth()
@Controller({ version: '1' })
export class AuthsController {
  constructor(private readonly authsService: AuthsService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Đăng ký tài khoản mới',
    description:
      'API đăng ký tài khoản mới cho người dùng với thông tin cá nhân và thiết bị',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Đăng ký thành công',
    schema: {
      example: {
        statusCode: 201,
        message: 'Đăng ký thành công',
        data: {
          id: 1,
          phoneNumber: '0898987871',
          firstName: 'Nguyễn Văn',
          lastName: 'A',
          email: 'example@gmail.com',
          status: 'ACTIVE',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu không hợp lệ',
    schema: {
      example: {
        statusCode: 400,
        message: 'Số điện thoại đã tồn tại',
        error: 'Bad Request',
      },
    },
  })
  register(@Req() req: Request, @Body() registerDto: RegisterDto) {
    const userAgent = req.headers['user-agent'];

    const ipAddress =
      req.headers['x-forwarded-for']?.toString().split(',')[0] ||
      req.socket.remoteAddress ||
      '';

    return this.authsService.register(registerDto, ipAddress, userAgent);
  }

  @Throttle({ default: { limit: 5, ttl: seconds(60) } })
  @Post('login')
  @ApiOperation({
    summary: 'Đăng nhập tài khoản',
    description:
      'API đăng nhập vào hệ thống với số điện thoại và mật khẩu. Rate limit: 5 requests/phút',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Đăng nhập thành công',
    schema: {
      example: {
        statusCode: 200,
        message: 'Đăng nhập thành công',
        data: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'refresh-token-here',
          user: {
            id: 1,
            phoneNumber: '0898987871',
            firstName: 'Nguyễn Văn',
            lastName: 'A',
            email: 'example@gmail.com',
            role: {
              id: 1,
              roleName: 'User',
              roleCode: 'USER',
            },
          },
          expiresIn: 3600,
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Thông tin đăng nhập không chính xác',
    schema: {
      example: {
        statusCode: 401,
        message: 'Số điện thoại hoặc mật khẩu không chính xác',
        error: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: 429,
    description: 'Quá nhiều yêu cầu đăng nhập',
    schema: {
      example: {
        statusCode: 429,
        message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
        error: 'Too Many Requests',
      },
    },
  })
  async login(@Req() req: Request, @Body() loginDto: LoginDto) {
    const userAgent = req.headers['user-agent'];

    const ipAddress =
      req.headers['x-forwarded-for']?.toString().split(',')[0] ||
      req.socket.remoteAddress ||
      '';

    const { deviceId } = loginDto;

    return await this.authsService.login(
      loginDto,
      ipAddress,
      deviceId,
      userAgent,
    );
  }

  @Post('logout')
  @ApiOperation({
    summary:
      'API đăng xuất tài khoản khỏi 1 thiết bị - Người dùng cần phải đăng nhập',
  })
  @UseGuards(JwtAuthGuard)
  logout(@CurrentUser() user: JwtPayloadUser, @Body() logoutDto: LogoutDto) {
    return this.authsService.logout(logoutDto);
  }

  @Throttle({ default: { limit: 5, ttl: seconds(60) } })
  @UseGuards(JwtAuthGuard)
  @Post('refresh-token')
  @ApiOperation({
    summary: 'API làm mới token - Người dùng cần phải đăng nhập',
  })
  refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authsService.refreshToken(refreshTokenDto);
  }
}
