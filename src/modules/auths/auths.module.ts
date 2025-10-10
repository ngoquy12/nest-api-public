import { Module } from '@nestjs/common';
import { AuthsService } from './auths.service';
import { AuthsController } from './auths.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { JwtModule } from '@nestjs/jwt';
import { RedisService } from '../redis/redis.service';
import { UserSession } from '../users/entities/user-session.entity';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { RolesModule } from '../roles/roles.module';
import { Role } from '../roles/entities/role.entity';
import { PasswordHistory } from '../password-histories/entities/password-history.entity';
import { Image } from '../images/entities/image.entity';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserSession, Role, PasswordHistory, Image]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  controllers: [AuthsController],
  providers: [
    AuthsService,
    UsersService,
    RedisService,
    JwtAuthGuard,
    JwtStrategy,
    RolesModule,
  ],
  exports: [JwtModule, AuthsService, JwtAuthGuard, PassportModule],
})
export class AuthsModule {}
