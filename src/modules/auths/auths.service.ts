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
import { Image } from '../images/entities/image.entity';
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

    // Lấy ra id của role CUSTOMER (role mặc định cho user mới đăng ký)
    const role = await this.roleRepository.findOne({
      where: { roleCode: RoleCode.CUSTOMER },
    });

    if (!role) {
      throw new BadRequestException(
        'Không tìm thấy role CUSTOMER. Vui lòng liên hệ quản trị viên.',
      );
    }

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

    // Tạo Access Token (15 phút)
    const payload = {
      id: savedUser.id,
      phoneNumber: savedUser.phoneNumber,
      role: userWithRole.role?.roleName,
      roleCode: userWithRole.role?.roleCode,
      deviceId: deviceId,
      sessionId: null, // Sẽ được cập nhật sau khi tạo session
    };

    // Tạo Refresh Token (7 ngày)
    const refreshToken = this.jwtService.sign(
      { sub: savedUser.id },
      { expiresIn: this.configService.get<string>('JWT_EXPIRES_IN_LONG') },
    );

    // Hash token để bảo mật
    const hashedRefreshToken = await hashToken(refreshToken);

    // Lưu phiên đăng nhập vào `user_sessions`
    const userSession = await this.userSessionRepository.save({
      user: savedUser,
      refreshToken: hashedRefreshToken,
      deviceInfo: userAgent || 'Thiết bị không xác định',
      deviceId,
      ipAddress,
      isRemembered: false,
    });

    // Cập nhật sessionId trong payload và tạo lại accessToken
    const updatedPayload = {
      ...payload,
      sessionId: userSession.id,
    };

    const finalAccessToken = this.jwtService.sign(updatedPayload, {
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN_SHORT'),
    });

    return new BaseResponse(
      HttpStatus.CREATED,
      'Đăng ký tài khoản thành công',
      {
        accessToken: finalAccessToken,
        refreshToken,
        user: {
          id: savedUser.id,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          phoneNumber: newUser.phoneNumber,
          email: newUser.email,
          status: newUser.status,
          dateOfBirth: newUser.dateBirth,
          address: newUser.address,
          gender: newUser.gender,
          role: {
            id: userWithRole.role?.id,
            roleName: userWithRole.role?.roleName,
            roleCode: userWithRole.role?.roleCode,
          },
        },
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN_SHORT'),
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
}
