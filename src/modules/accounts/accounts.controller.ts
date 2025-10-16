import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  Post,
  Patch,
} from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtPayloadUser } from '../auths/interfaces/jwt-payload-user';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { SessionActiveGuard } from 'src/common/guards/session-active.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChangePasswordDto } from '../auths/dto/change-password.dto';
import { LogoutDeviceDto } from '../auths/dto/logout-device.dto';

@ApiTags('Quản lý tài khoản (Accounts)')
@ApiBearerAuth()
@Controller({ version: '1' })
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get('login-history')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Lấy lịch sử đăng nhập với phân trang và bộ lọc',
  })
  @HttpCode(HttpStatus.OK)
  async getLoginHistory(@CurrentUser() user: JwtPayloadUser) {
    return await this.accountsService.getLoginHistory(user);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lấy thông tin tài khoản hiện tại' })
  @HttpCode(HttpStatus.OK)
  async getProfile(@CurrentUser() user: JwtPayloadUser) {
    return await this.accountsService.getProfile(user);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Cập nhật thông tin cá nhân' })
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateProfileDto })
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @CurrentUser() user: JwtPayloadUser,
    @Body() updateProfileDto: UpdateProfileDto,
    @UploadedFile() avatar: Express.Multer.File,
  ) {
    return await this.accountsService.updateProfile(
      user,
      updateProfileDto,
      avatar,
    );
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Đổi mật khẩu',
    description: 'API thay đổi mật khẩu cho tài khoản hiện tại',
  })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Đổi mật khẩu thành công',
    schema: {
      example: {
        statusCode: 200,
        message: 'Đổi mật khẩu thành công',
        data: null,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Mật khẩu hiện tại không chính xác',
    schema: {
      example: {
        statusCode: 400,
        message: 'Mật khẩu hiện tại không chính xác',
        error: 'Bad Request',
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: JwtPayloadUser,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return await this.accountsService.changePassword(user, changePasswordDto);
  }

  @Post('logout-device')
  @UseGuards(SessionActiveGuard)
  @ApiOperation({
    summary: 'Đăng xuất thiết bị từ xa',
    description: 'API đăng xuất một thiết bị cụ thể khỏi tài khoản',
  })
  @ApiBody({ type: LogoutDeviceDto })
  @ApiResponse({
    status: 200,
    description: 'Đăng xuất thiết bị thành công',
    schema: {
      example: {
        statusCode: 200,
        message: 'Đăng xuất thiết bị thành công',
        data: null,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy thiết bị',
    schema: {
      example: {
        statusCode: 404,
        message: 'Không tìm thấy thiết bị',
        error: 'Not Found',
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async logoutDevice(
    @CurrentUser() user: JwtPayloadUser,
    @Body() logoutDeviceDto: LogoutDeviceDto,
  ) {
    return await this.accountsService.logoutDevice(
      user,
      logoutDeviceDto.deviceId,
    );
  }

  @Post('logout-all-other-devices')
  @UseGuards(SessionActiveGuard)
  @ApiOperation({
    summary: 'Đăng xuất tất cả thiết bị khác',
    description: 'API đăng xuất tất cả thiết bị khác ngoài thiết bị hiện tại',
  })
  @ApiResponse({
    status: 200,
    description: 'Đăng xuất tất cả thiết bị khác thành công',
    schema: {
      example: {
        statusCode: 200,
        message: 'Đăng xuất tất cả thiết bị khác thành công',
        data: null,
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async logoutAllOtherDevices(@CurrentUser() user: JwtPayloadUser) {
    return await this.accountsService.logoutAllOtherDevices(user);
  }

  @Get('active-devices')
  @UseGuards(SessionActiveGuard)
  @ApiOperation({
    summary: 'Lấy danh sách thiết bị đang đăng nhập',
    description:
      'API lấy danh sách tất cả thiết bị đang đăng nhập vào tài khoản',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách thiết bị thành công',
    schema: {
      example: {
        statusCode: 200,
        message: 'Lấy danh sách thiết bị thành công',
        data: [
          {
            id: 1,
            deviceId: 'device-123',
            deviceName: 'iPhone 15',
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0...',
            isActive: true,
            lastLoginAt: '2024-01-01T00:00:00.000Z',
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async getActiveDevices(@CurrentUser() user: JwtPayloadUser) {
    return await this.accountsService.getActiveDevices(user);
  }
}
