import {
  Controller,
  Post,
  Body,
  HttpStatus,
  Get,
  Req,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { AuthsService } from './auths.service';
import { RegisterDto } from './dto/register.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Throttle, seconds } from '@nestjs/throttler';

@ApiBearerAuth()
@Controller({ version: '1' })
export class AuthsController {
  constructor(private readonly authsService: AuthsService) {}

  @Post('register')
  @ApiOperation({ summary: 'API đăng ký tài khoản Gara' })
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
  @ApiOperation({ summary: 'API đăng nhập tài khoản' })
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
  logout(@Body() logoutDto: LogoutDto) {
    return this.authsService.logout(logoutDto);
  }

  @Post('logout-all')
  @ApiOperation({
    summary: 'API đăng xuất tất cả thiết bị - Người dùng cần phải đăng nhập',
  })
  logoutAll(@Body() logoutDto: LogoutDto) {
    return this.authsService.logoutAll(logoutDto);
  }

  @Throttle({ default: { limit: 5, ttl: seconds(60) } })
  @Post('refresh-token')
  @ApiOperation({
    summary: 'API làm mới token - Người dùng cần phải đăng nhập',
  })
  refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authsService.refreshToken(refreshTokenDto);
  }

  @Get('last-password-change')
  @ApiOperation({
    summary:
      'API lấy thời gian cập nhật mật khẩu gần nhất của người dùng - Người dùng cần phải đăng nhập',
  })
  @UseGuards(JwtAuthGuard)
  getLastPasswordChange(@Req() req: Request) {
    const accessToken = req.headers['authorization']?.split(' ')[1];
    return this.authsService.getLastPasswordChange(accessToken);
  }

  @Patch('change-password')
  @ApiOperation({
    summary: 'API thay đổi mật khẩu - Người dùng cần phải đăng nhập',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Thay đổi mật khẩu thành công',
  })
  @UseGuards(JwtAuthGuard)
  changePassword(
    @Req() req: Request,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    const accessToken = req.headers['authorization']?.split(' ')[1];
    return this.authsService.changePassword(accessToken, changePasswordDto);
  }

  @Post('logout-device')
  @ApiOperation({
    summary: 'API đăng xuất thiết bị từ xa - Người dùng cần phải đăng nhập',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Đăng xuất thiết bị thành công',
  })
  @UseGuards(JwtAuthGuard)
  logoutDevice(@Req() req: Request, @Body() body: { deviceId: string }) {
    const accessToken = req.headers['authorization']?.split(' ')[1];
    return this.authsService.logoutDevice(accessToken, body.deviceId);
  }

  @Get('active-devices')
  @ApiOperation({
    summary:
      'API lấy danh sách thiết bị đang đăng nhập - Người dùng cần phải đăng nhập',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy danh sách thiết bị thành công',
  })
  @UseGuards(JwtAuthGuard)
  getActiveDevices(@Req() req: Request) {
    const accessToken = req.headers['authorization']?.split(' ')[1];
    return this.authsService.getActiveDevices(accessToken);
  }
}
