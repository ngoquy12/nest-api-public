import { Module } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';
import { AccountsGateway } from './accounts.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { UserSession } from '../users/entities/user-session.entity';
import { ConfigModule } from '@nestjs/config';
import { Image } from '../images/entities/image.entity';
import { CloudinaryService } from 'src/services/cloudinary.service';
import { ChangeLogsModule } from '../change-logs/change-logs.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthsModule } from '../auths/auths.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserSession, Image]),
    AuthsModule,
    ConfigModule,
    ChangeLogsModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AccountsController],
  providers: [AccountsService, AccountsGateway, CloudinaryService],
})
export class AccountsModule {}
