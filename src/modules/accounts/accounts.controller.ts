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
} from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtPayloadUser } from '../auths/interfaces/jwt-payload-user';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { FileInterceptor } from '@nestjs/platform-express';

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
}
