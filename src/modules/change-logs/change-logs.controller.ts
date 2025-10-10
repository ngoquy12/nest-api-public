import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ChangeLogsService } from './change-logs.service';
import { ChangeLogType } from './enums/change-log-type.enum';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@Controller({ version: '1' })
export class ChangeLogsController {
  constructor(private readonly changeLogsService: ChangeLogsService) {}

  @Get(':entityType/:entityId')
  @UseGuards(JwtAuthGuard)
  async getHistory(
    @Param('entityType') entityType: ChangeLogType,
    @Param('entityId') entityId: number,
  ) {
    return this.changeLogsService.getHistory(entityType, +entityId);
  }
}
