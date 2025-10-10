import {
  BadRequestException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';
import {
  comparePassword,
  hashPassword,
  hashToken,
} from 'src/common/utils/hashing.util';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../redis/redis.service';
import { UserSession } from '../users/entities/user-session.entity';
import { LogoutDto } from './dto/logout.dto';
import { compare } from 'bcrypt';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ConfigService } from '@nestjs/config';
import { Role } from '../roles/entities/role.entity';
import { ChangePasswordDto } from './dto/change-password.dto';
import { PasswordHistory } from '../password-histories/entities/password-history.entity';
import { Image } from '../images/entities/image.entity';
import { TypeImage } from 'src/common/enums/type-image.enum';
import { BaseResponse } from 'src/common/responses/base-response';
import { RoleCode } from 'src/common/enums/role-code.enum';

@Injectable()
export class AuthsService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,

    @InjectRepository(UserSession)
    private userSessionRepository: Repository<UserSession>,

    @InjectRepository(Role)
    private roleRepository: Repository<Role>,

    @InjectRepository(PasswordHistory)
    private readonly passwordHistoryRepository: Repository<PasswordHistory>,

    @InjectRepository(Image)
    private readonly imageRepository: Repository<Image>,

    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  // Đăng ký tài khoản
  async register(
    registerDto: RegisterDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const { password, phoneNumber, email, deviceId } = registerDto;

    const [findPhone, findEmail] = await Promise.all([
      this.userRepository.findOne({
        where: { phoneNumber },
      }),
      this.userRepository.findOne({
        where: { email },
      }),
    ]);

    if (findPhone) {
      throw new BadRequestException('Số điện thoại này đã tồn tại');
    }

    if (findEmail) {
      throw new BadRequestException(
        'Email đã được sử dụng. Vui lòng sử dụng email khác',
      );
    }

    // Lấy ra id của role có tên là GARAGE_OWNER
    const role = await this.roleRepository.findOne({
      where: { roleCode: RoleCode.MANAGER },
    });

    // Mã hóa mật khẩu
    const hashedPassword = await hashPassword(password);

    // Tạo người dùng mới với role
    const newUser = this.userRepository.create({
      ...registerDto,
      password: hashedPassword,
      roleId: role.id,
    });

    // Lưu người dùng vào database
    const savedUser = await this.userRepository.save(newUser);

    // Reload user kèm role
    const userWithRole = await this.userRepository.findOne({
      where: { id: savedUser.id },
      relations: ['role'],
    });

    // Lưu lại lịch sử thêm mật khẩu
    const passwordHistory = this.passwordHistoryRepository.create({
      user: savedUser,
      hashedPassword,
    });

    await this.passwordHistoryRepository.save(passwordHistory);

    // Tạo Access Token (15 phút)
    const payload = {
      sub: savedUser.id,
      role: userWithRole.role?.roleName,
      status: savedUser.status,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN_SHORT'),
    });

    // Tạo Refresh Token (7 ngày)
    const refreshToken = this.jwtService.sign(
      { sub: savedUser.id },
      { expiresIn: this.configService.get<string>('JWT_EXPIRES_IN_LONG') },
    );

    // Hash token để bảo mật
    const hashedRefreshToken = await hashToken(refreshToken);

    // Lưu phiên đăng nhập vào `user_sessions`
    await this.userSessionRepository.save({
      user: savedUser,
      refreshToken: hashedRefreshToken,
      deviceInfo: userAgent || 'Thiết bị không xác định',
      deviceId,
      ipAddress,
      isRemembered: false,
    });

    return new BaseResponse(
      HttpStatus.CREATED,
      'Đăng ký tài khoản thành công',
      {
        accessToken,
        refreshToken,
        user: {
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          phoneNumber: newUser.phoneNumber,
          email: newUser.email,
          status: newUser.status,
          dateOfBirth: newUser.dateBirth,
          address: newUser.address,
          gender: newUser.gender,
          avatar:
            'https://i.pinimg.com/736x/f8/06/59/f806591329380bf9212dfa5fe948aaa8.jpg',
        },
      },
    );
  }

  // Đăng nhập tài khoản
  async login(
    loginDto: LoginDto,
    ipAddress: string,
    deviceId: string,
    userAgent: string,
  ) {
    const { password, phoneNumber, isRemembered } = loginDto;

    // Tìm người dùng dựa trên số điện thoại
    const user = await this.userRepository.findOne({
      where: { phoneNumber: phoneNumber },
      relations: ['role'],
    });

    // Kiểm tra tài khoản dựa trên số điện thoại và mật khẩu
    if (!user || !(await comparePassword(password, user.password))) {
      throw new BadRequestException(
        'Số điện thoại hoặc mật khẩu chưa chính xác',
      );
    }

    // Tạo Access Token (15 phút)
    const payload = {
      sub: user.id,
      role: user.role?.roleName,
      status: user.status,
      deviceId: deviceId, // Thêm deviceId vào JWT payload
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN_SHORT'),
    });

    // Tạo Refresh Token (7 ngày)
    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      { expiresIn: this.configService.get<string>('JWT_EXPIRES_IN_LONG') },
    );

    // Hash token để bảo mật
    const hashedRefreshToken = await hashToken(refreshToken);

    // Xử lý session theo flow đa thiết bị - cho phép tối đa 3 thiết bị
    const existingSessions = await this.userSessionRepository.find({
      where: { user: { id: user.id }, isActive: true },
      order: { createdAt: 'ASC' }, // Lấy session cũ trước
    });

    // Kiểm tra xem thiết bị hiện tại đã có session chưa
    const currentDeviceSession = existingSessions.find(
      (s) => s.deviceId === deviceId,
    );

    // Nếu thiết bị hiện tại đã có session, cập nhật session đó thay vì tạo mới
    if (currentDeviceSession) {
      currentDeviceSession.refreshToken = hashedRefreshToken;
      currentDeviceSession.deviceInfo = userAgent;
      currentDeviceSession.ipAddress = ipAddress;
      currentDeviceSession.isRemembered = isRemembered;
      currentDeviceSession.lastSeenAt = new Date();
      currentDeviceSession.updatedAt = new Date();

      await this.userSessionRepository.save(currentDeviceSession);
    } else {
      // Thiết bị mới - kiểm tra giới hạn 3 thiết bị
      if (existingSessions.length >= 3) {
        // Kick thiết bị cũ nhất
        const sessionToKick = existingSessions[0];
        sessionToKick.isActive = false;
        sessionToKick.logoutAt = new Date();
        await this.userSessionRepository.save(sessionToKick);
      }
    }

    // Chỉ tạo session mới nếu thiết bị chưa có session
    let sessionToLog;
    if (!currentDeviceSession) {
      const now = new Date();
      const newSession = await this.userSessionRepository.save({
        user,
        refreshToken: hashedRefreshToken,
        deviceInfo: userAgent,
        deviceId,
        ipAddress,
        isRemembered,
        isActive: true, // Session mới luôn active
        logoutAt: null,
        lastSeenAt: now, // Set lastSeen khi login
        createdAt: now,
        updatedAt: now,
      });
      sessionToLog = newSession;
    } else {
      sessionToLog = currentDeviceSession;
    }

    console.log(`Login session saved for user ${user.id}:`, {
      sessionId: sessionToLog.id,
      deviceId: sessionToLog.deviceId,
      ipAddress: sessionToLog.ipAddress,
      deviceInfo: sessionToLog.deviceInfo,
      isNewSession: !currentDeviceSession,
    });

    // Lấy ra hình ảnh của user đăng nhập
    const userImage = await this.imageRepository.findOne({
      where: { refId: user.id, type: TypeImage.EMPLOYEE },
    });

    return new BaseResponse(HttpStatus.OK, 'Đăng nhập thành công', {
      accessToken,
      refreshToken,
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        email: user.email,
        status: user.status,
        dateOfBirth: user.dateBirth,
        address: user.address,
        gender: user.gender,
        role: user.role,
        avatar:
          userImage?.url ||
          'https://i.pinimg.com/736x/f8/06/59/f806591329380bf9212dfa5fe948aaa8.jpg',
      },
    });
  }

  // Đăng xuất tài khoản khỏi một thiết bị cụ thể
  async logout(logoutDto: LogoutDto) {
    const { refreshToken } = logoutDto;
    try {
      // Giải mã refreshToken để lấy `userId`
      const decoded = this.jwtService.verify(refreshToken);

      // Lấy userId từ JWT
      const userId = decoded.sub;

      // Tìm tất cả phiên đăng nhập của user
      const sessions = await this.userSessionRepository.find({
        where: { user: { id: userId } },
      });

      if (!sessions || sessions.length === 0) {
        throw new BadRequestException('Không tìm thấy phiên đăng nhập hợp lệ');
      }

      // Kiểm tra token nào khớp với token user gửi lên
      for (const session of sessions) {
        const isValid = await compare(refreshToken, session.refreshToken);
        if (isValid) {
          // Đánh dấu session là không active và set thời gian logout
          session.isActive = false;
          session.logoutAt = new Date();
          session.updatedAt = new Date();
          await this.userSessionRepository.save(session);

          return new BaseResponse(HttpStatus.OK, 'Đăng xuất thành công', null);
        }
      }

      throw new BadRequestException(
        'Phiên đăng nhập không còn hợp lệ. Vui lòng đăng nhập lại',
      );
    } catch (error) {
      throw new UnauthorizedException(
        'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại',
      );
    }
  }

  // Đăng xuất tất cả thiết bị
  async logoutAll(logoutDto: LogoutDto) {
    const { refreshToken } = logoutDto;
    try {
      // Giải mã refreshToken để lấy `userId`
      const decoded = this.jwtService.verify(refreshToken);

      // Lấy userId từ JWT
      const userId = decoded.sub;

      // Lấy danh sách sessions active để logout
      const sessionsToLogout = await this.userSessionRepository.find({
        where: { user: { id: userId }, isActive: true },
      });

      // Đánh dấu tất cả sessions là không active
      const now = new Date();
      sessionsToLogout.forEach((session) => {
        session.isActive = false;
        session.logoutAt = now;
        session.updatedAt = now;
      });

      await this.userSessionRepository.save(sessionsToLogout);

      return new BaseResponse(
        HttpStatus.OK,
        'Đăng xuất khỏi tất cả thiết bị thành công',
        null,
      );
    } catch (error) {
      throw new UnauthorizedException(
        'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại',
      );
    }
  }

  // Làm mới token
  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<BaseResponse<{ accessToken: string }>> {
    try {
      const { refreshToken } = refreshTokenDto;

      // Giải mã `refreshToken` để lấy `userId`
      const decoded = this.jwtService.verify(refreshToken);

      const userId = decoded.sub;

      // Tìm tất cả session của user
      const sessions = await this.userSessionRepository.find({
        where: { user: { id: userId } }, // Chỉ lấy active sessions
        relations: ['user'],
      });

      if (!sessions || sessions.length === 0) {
        throw new UnauthorizedException(
          'Không tìm thấy phiên đăng nhập hợp lệ',
        );
      }

      // Kiểm tra token nào khớp với token user gửi lên
      let validSession = null;
      for (const session of sessions) {
        const isValid = await compare(refreshToken, session.refreshToken);

        if (isValid) {
          validSession = session;
          break;
        }
      }

      if (!validSession) {
        throw new UnauthorizedException(
          'Phiên đăng nhập không còn hợp lệ hoặc đã bị đăng xuất',
        );
      }

      // Lấy thông tin user với role để tạo token
      const userWithRole = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['role'],
      });

      // Tạo Access Token mới (15 phút)
      const newAccessToken = this.jwtService.sign(
        {
          sub: userId,
          role: userWithRole?.role?.roleName || validSession.user.role,
          status: validSession.user.status,
          deviceId: validSession.deviceId, // Thêm deviceId từ session
        },
        { expiresIn: this.configService.get<string>('JWT_EXPIRES_IN_SHORT') },
      );

      return new BaseResponse(HttpStatus.OK, 'Làm mới token thành công', {
        accessToken: newAccessToken,
      });
    } catch (error) {
      throw new UnauthorizedException(
        'Phiên đăng nhập không hợp lệ hoặc đã hết hạn',
      );
    }
  }

  // Thay đổi mật khẩu
  async changePassword(
    accessToken: string,
    changePasswordDto: ChangePasswordDto,
  ) {
    const { oldPassword, newPassword } = changePasswordDto;

    // Giải mã accessToken để lấy userId
    const decoded = this.jwtService.verify(accessToken);
    const userId = decoded.sub;

    // Tìm người dùng dựa trên userId
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    // Kiểm tra mật khẩu cũ
    if (!user || !(await comparePassword(oldPassword, user.password))) {
      throw new BadRequestException('Mật khẩu cũ không chính xác');
    }

    // Lấy lịch sử các mật khẩu trước đây
    const oldPasswords = await this.passwordHistoryRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      take: 5, // kiểm tra 5 mật khẩu gần nhất
    });

    // Kiểm tra mật khẩu mới có trùng với bất kỳ mật khẩu cũ nào không
    for (const old of oldPasswords) {
      const isSame = await comparePassword(newPassword, old.hashedPassword);
      if (isSame) {
        throw new BadRequestException(
          'Mật khẩu này đã được sử dụng trước đây. Vui lòng chọn mật khẩu khác',
        );
      }
    }

    // Mã hóa mật khẩu mới
    const hashedPassword = await hashPassword(newPassword);

    // Cập nhật mật khẩu mới cho người dùng
    user.password = hashedPassword;
    await this.userRepository.save(user);

    // Lưu lại lịch sử mật khẩu mới
    const passwordHistory = this.passwordHistoryRepository.create({
      user,
      hashedPassword,
    });

    await this.passwordHistoryRepository.save(passwordHistory);

    //
    return new BaseResponse(HttpStatus.OK, 'Tạo mật khẩu mới thành công', null);
  }

  // Lấy thời gian cập nhật mật khẩu gần nhất của người dùng
  async getLastPasswordChange(accessToken: string) {
    try {
      // Giải mã accessToken để lấy userId
      const decoded = this.jwtService.verify(accessToken);
      const userId = decoded.sub;

      // Tìm người dùng dựa trên userId
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['passwordHistories'],
      });

      if (!user) {
        throw new BadRequestException('Không tìm thấy tài khoản');
      }

      // Lấy thời gian cập nhật mật khẩu gần nhất
      const lastPasswordChange = await this.passwordHistoryRepository.findOne({
        where: { user: { id: userId } },
        order: { createdAt: 'DESC' },
      });

      return new BaseResponse(
        HttpStatus.OK,
        'Lấy thời gian cập nhật mật khẩu thành công',
        {
          lastPasswordChangedAt: lastPasswordChange?.createdAt,
        },
      );
    } catch (error) {
      throw new UnauthorizedException(
        'Phiên đăng nhập không hợp lệ hoặc đã hết hạn',
      );
    }
  }

  // Đăng xuất thiết bị từ xa
  async logoutDevice(accessToken: string, deviceId: string) {
    try {
      // Giải mã accessToken để lấy userId
      const decoded = this.jwtService.verify(accessToken);
      const userId = decoded.sub;
      const currentDeviceId = decoded.deviceId;

      // Không cho phép đăng xuất thiết bị hiện tại
      if (deviceId === currentDeviceId) {
        throw new BadRequestException(
          'Không thể đăng xuất khỏi thiết bị đang sử dụng hiện tại',
        );
      }

      // Tìm session cần đăng xuất
      const session = await this.userSessionRepository.findOne({
        where: {
          user: { id: userId },
          deviceId: deviceId,
          isActive: true,
        },
      });

      if (!session) {
        throw new BadRequestException(
          'Không tìm thấy thiết bị này hoặc thiết bị đã được đăng xuất',
        );
      }

      // Đánh dấu session là không active
      session.isActive = false;
      session.logoutAt = new Date();
      session.updatedAt = new Date();
      await this.userSessionRepository.save(session);

      return new BaseResponse(HttpStatus.OK, 'Đăng xuất thiết bị thành công', {
        deviceId,
        logoutAt: session.logoutAt,
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error in logoutDevice:', error);
      throw new UnauthorizedException(
        'Phiên đăng nhập không hợp lệ hoặc đã hết hạn',
      );
    }
  }

  // Lấy danh sách thiết bị đang đăng nhập
  async getActiveDevices(accessToken: string) {
    try {
      // Giải mã accessToken để lấy userId
      const decoded = this.jwtService.verify(accessToken);
      const userId = decoded.sub;
      const currentDeviceId = decoded.deviceId;

      // Lấy danh sách sessions đang active
      const activeSessions = await this.userSessionRepository.find({
        where: { user: { id: userId }, isActive: true },
        order: { lastSeenAt: 'DESC' },
      });

      const now = new Date();
      const devices = activeSessions.map((session) => {
        let status = 'offline';

        if (session.lastSeenAt) {
          const lastSeen = new Date(session.lastSeenAt);
          const secondsSinceLastSeen =
            (now.getTime() - lastSeen.getTime()) / 1000;

          if (secondsSinceLastSeen < 10) {
            status = 'online';
          } else if (secondsSinceLastSeen < 24 * 60 * 60) {
            status = 'offline';
          } else {
            status = 'inactive';
          }
        }

        return {
          deviceId: session.deviceId,
          deviceInfo: session.deviceInfo,
          ipAddress: session.ipAddress,
          isCurrentDevice: session.deviceId === currentDeviceId,
          status,
          lastSeenAt: session.lastSeenAt,
          loginAt: session.createdAt,
          isRemembered: session.isRemembered,
        };
      });

      return new BaseResponse(
        HttpStatus.OK,
        'Lấy danh sách thiết bị thành công',
        {
          devices,
          totalDevices: devices.length,
          maxDevices: 3,
        },
      );
    } catch (error) {
      throw new UnauthorizedException(
        'Phiên đăng nhập không hợp lệ hoặc đã hết hạn',
      );
    }
  }
}
