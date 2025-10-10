import { Module } from '@nestjs/common';
import { ChangeLogsService } from './change-logs.service';
import { ChangeLogsController } from './change-logs.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChangeLog } from './entities/change-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChangeLog])],
  controllers: [ChangeLogsController],
  providers: [ChangeLogsService],
  exports: [ChangeLogsService],
})
export class ChangeLogsModule {}
