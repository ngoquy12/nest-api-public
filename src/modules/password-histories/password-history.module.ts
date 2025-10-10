import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PasswordHistory } from './entities/password-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PasswordHistory])],
  controllers: [],
  providers: [],
})
export class PasswordHistoryModule {}
