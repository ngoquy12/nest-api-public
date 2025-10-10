import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChangeLog } from './entities/change-log.entity';
import { Repository } from 'typeorm';
import { ChangeLogType } from './enums/change-log-type.enum';
import { ChangeLogAction } from './enums/change-log-action.enum';
import deepEqual from 'src/common/utils/deepEqual';

@Injectable()
export class ChangeLogsService {
  constructor(
    @InjectRepository(ChangeLog)
    private readonly changeLogRepo: Repository<ChangeLog>,
  ) {}

  async logChange<T extends Record<string, any>>(
    action: ChangeLogAction,
    entityType: ChangeLogType,
    entityId: number,
    oldData: T,
    newData: Partial<T>,
    changedById: number,
  ) {
    const version =
      (await this.changeLogRepo.count({
        where: { entityType: entityType, entityId: entityId },
      })) + 1;

    const changes: Record<string, { oldValue: any; newValue: any }> = {};

    if (action === ChangeLogAction.CREATE) {
      for (const key in newData) {
        changes[key] = {
          oldValue: 'Không có thông tin',
          newValue: newData[key],
        };
      }
    }

    if (action === ChangeLogAction.UPDATE && oldData) {
      for (const key in newData) {
        const oldVal = oldData[key];
        const newVal = newData[key];

        const isDifferent =
          typeof oldVal === 'object' && oldVal !== null && newVal !== null
            ? !deepEqual(oldVal, newVal)
            : String(oldVal ?? '') !== String(newVal ?? '');

        if (isDifferent) {
          changes[key] = {
            oldValue: oldVal ?? 'Không có thông tin',
            newValue: newVal,
          };
        }
      }
    }

    if (action === ChangeLogAction.DELETE) {
      for (const key in oldData) {
        changes[key] = {
          oldValue: oldData[key],
          newValue: null,
        };
      }
    }

    if (Object.keys(changes).length > 0) {
      const log = this.changeLogRepo.create({
        action,
        entityType,
        entityId,
        changeData: JSON.stringify(changes),
        version,
        changedById,
        deletedAt: action === ChangeLogAction.DELETE ? new Date() : null,
        deletedById: action === ChangeLogAction.DELETE ? changedById : null,
      });

      await this.changeLogRepo.save(log);
    }
  }

  async getHistory(
    entityType: ChangeLogType,
    entityId: number,
    action?: ChangeLogAction,
  ) {
    const logs = await this.changeLogRepo.find({
      where: { entityType: entityType, entityId: entityId, action: action },
      order: { changedAt: 'ASC' },
    });

    return logs.map((log) => ({
      version: log.version,
      changedAt: log.changedAt,
      changes: JSON.parse(log.changeData) as Record<
        string,
        { oldValue: any; newValue: any }
      >,
    }));
  }
}
