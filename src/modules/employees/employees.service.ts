import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { DataSource, Not, Repository, IsNull } from 'typeorm';
import { Employee } from './entities/employee.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { EmployeeResponseDto } from './dto/employee-response.dto';
import { Position } from '../positions/entities/position.entity';
import { Gender } from 'src/common/enums/gender.enum';
import {
  BaseResponse,
  PaginatedResponse,
} from 'src/common/responses/base-response';
import { ChangeLogsService } from '../change-logs/change-logs.service';
import { ChangeLogType } from '../change-logs/enums/change-log-type.enum';
import { ChangeLogAction } from '../change-logs/enums/change-log-action.enum';
import { JwtPayloadUser } from '../auths/interfaces/jwt-payload-user';
import { SearchAndPagingEmployeeDto } from './dto/search-employee.dto';
import * as dayjs from 'dayjs';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,

    @InjectRepository(Position)
    private readonly positionRepository: Repository<Position>,

    private readonly dataSource: DataSource,
    private readonly changeLogService: ChangeLogsService,
  ) {}

  // Thêm mới nhân viên
  async createEmployee(
    user: JwtPayloadUser,
    createEmployeeDto: CreateEmployeeDto,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const {
        employeeName,
        employeeCode,
        phoneNumber,
        dateBirth,
        gender,
        positionId,
      } = createEmployeeDto;

      // Kiểm tra trùng lặp dữ liệu
      const duplicateChecks = [
        {
          label: 'Mã nhân viên đã tồn tại',
          field: 'employeeCode',
          value: employeeCode,
        },
        {
          label: 'Số điện thoại đã tồn tại',
          field: 'phoneNumber',
          value: phoneNumber,
        },
      ].filter((c) => c.value);

      for (const check of duplicateChecks) {
        const existing = await this.employeeRepository.findOne({
          where: { [check.field]: check.value },
        });
        if (existing) {
          throw new BadRequestException(check.label);
        }
      }

      // Lấy thông tin vị trí nếu có
      let position = null;
      if (positionId) {
        position = await this.positionRepository.findOne({
          where: { id: positionId },
        });
        if (!position) {
          throw new BadRequestException('Vị trí công việc không tồn tại');
        }
      }

      // Tạo nhân viên mới
      const newEmployee = this.employeeRepository.create({
        employeeCode,
        employeeName,
        phoneNumber,
        gender: gender || Gender.MALE,
        dateBirth: dateBirth ? new Date(dateBirth) : null,
        position,
      });

      const savedEmployee = await queryRunner.manager.save(newEmployee);

      await queryRunner.commitTransaction();

      return new BaseResponse(HttpStatus.CREATED, 'Tạo nhân viên thành công', {
        id: savedEmployee.id,
        employeeCode: savedEmployee.employeeCode,
        employeeName: savedEmployee.employeeName,
        phoneNumber: savedEmployee.phoneNumber,
        gender: savedEmployee.gender,
        dateBirth: savedEmployee.dateBirth,
        positionName: savedEmployee.position?.positionName,
        createdAt: savedEmployee.createdAt,
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Thêm mới nhân viên thất bại',
      );
    } finally {
      await queryRunner.release();
    }
  }

  // Tìm kiếm, phân trang, sắp xếp, lọc nhân viên
  async searchAndPagingEmployees(
    query: SearchAndPagingEmployeeDto,
  ): Promise<PaginatedResponse<EmployeeResponseDto>> {
    const { keyword, positionIds, currentPage = 1, pageSize = 10 } = query;

    const queryBuilder = this.employeeRepository
      .createQueryBuilder('employee')
      .leftJoinAndSelect('employee.position', 'position')
      .where('employee.deletedAt IS NULL');

    // Tìm kiếm theo từ khóa
    if (keyword) {
      queryBuilder.andWhere(
        `(employee.employeeCode LIKE :keyword 
          OR employee.employeeName LIKE :keyword 
          OR employee.phoneNumber LIKE :keyword)`,
        { keyword: `%${keyword}%` },
      );
    }

    // Lọc theo vị trí
    if (positionIds && positionIds.length > 0) {
      queryBuilder.andWhere('position.id IN (:...positionIds)', {
        positionIds,
      });
    }

    // Đếm tổng số bản ghi
    const totalRecords = await queryBuilder.getCount();

    // Phân trang và sắp xếp
    queryBuilder
      .orderBy('employee.createdAt', 'DESC')
      .skip((currentPage - 1) * pageSize)
      .take(pageSize);

    // Lấy danh sách nhân viên
    const employees = await queryBuilder.getMany();

    // Tạo response DTOs
    const employeeWithImages = employees.map((employee) => {
      const dto = new EmployeeResponseDto();
      dto.id = employee.id;
      dto.employeeCode = employee.employeeCode;
      dto.employeeName = employee.employeeName;
      dto.phoneNumber = employee.phoneNumber;
      dto.gender = employee.gender;
      dto.dateBirth = employee.dateBirth
        ? dayjs(employee.dateBirth).format('YYYY-MM-DD')
        : null;
      dto.createdAt = employee.createdAt
        ? employee.createdAt?.toISOString()
        : null;
      dto.positionId = employee.position?.id;
      dto.positionName = employee.position?.positionName || 'Chưa có vị trí';

      return dto;
    });

    return new PaginatedResponse(
      HttpStatus.OK,
      'Lấy danh sách nhân viên thành công',
      employeeWithImages,
      {
        totalRecords,
        currentPage: parseInt(currentPage as any),
        pageSize: parseInt(pageSize as any),
        totalPages: Math.ceil(totalRecords / pageSize),
      },
    );
  }

  // Lấy danh sách tất cả nhân viên (không phân trang)
  async getAllEmployees() {
    const employees = await this.employeeRepository.find({
      where: {
        deletedAt: IsNull(),
      },
      relations: ['position'],
      order: { createdAt: 'DESC' },
    });

    const employeeList = employees.map((employee) => ({
      id: employee.id,
      employeeCode: employee.employeeCode,
      employeeName: employee.employeeName,
      phoneNumber: employee.phoneNumber,
      positionName: employee.position?.positionName || 'Chưa có vị trí',
    }));

    return new BaseResponse(
      HttpStatus.OK,
      'Lấy danh sách nhân viên thành công',
      employeeList,
    );
  }

  // Thống kê nhân viên
  async getEmployeeStatistics() {
    const employees = await this.employeeRepository.find({
      where: {
        deletedAt: IsNull(),
      },
      relations: ['position'],
    });

    const totalEmployees = employees.length;

    // Thống kê theo vị trí
    const byPosition = employees.reduce(
      (acc, emp) => {
        const positionName = emp.position?.positionName || 'Chưa có vị trí';
        acc[positionName] = (acc[positionName] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return new BaseResponse(
      HttpStatus.OK,
      'Lấy thống kê nhân viên thành công',
      {
        totalEmployees,
        byPosition,
      },
    );
  }

  // Lấy thông tin chi tiết nhân viên
  async findOneEmployee(employeeId: number) {
    const employee = await this.employeeRepository.findOne({
      where: {
        id: employeeId,
        deletedAt: IsNull(),
      },
      relations: ['position'],
    });

    if (!employee) {
      throw new NotFoundException('Không tìm thấy thông tin nhân viên');
    }

    const employeeDetail = {
      id: employee.id,
      employeeCode: employee.employeeCode,
      employeeName: employee.employeeName,
      phoneNumber: employee.phoneNumber,
      gender: employee.gender,
      dateBirth: employee.dateBirth
        ? dayjs(employee.dateBirth).format('YYYY-MM-DD')
        : null,
      createdAt: employee.createdAt
        ? dayjs(employee.createdAt).toISOString()
        : null,
      position: {
        id: employee.position?.id,
        positionName: employee.position?.positionName,
        description: employee.position?.description,
      },
    };

    return new BaseResponse(
      HttpStatus.OK,
      'Lấy thông tin nhân viên thành công',
      employeeDetail,
    );
  }

  // Cập nhật thông tin nhân viên
  async updateEmployee(
    id: number,
    currentUserId: number,
    updateEmployeeDto: UpdateEmployeeDto,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Tìm nhân viên cần cập nhật
      const employee = await this.employeeRepository.findOne({
        where: {
          id,
          deletedAt: IsNull(),
        },
        relations: ['position'],
      });

      if (!employee) {
        throw new NotFoundException('Không tìm thấy thông tin nhân viên');
      }

      // Kiểm tra trùng lặp dữ liệu (loại trừ chính nhân viên hiện tại)
      const duplicateChecks = [
        {
          label: 'Mã nhân viên đã tồn tại',
          field: 'employeeCode',
          value: updateEmployeeDto.employeeCode,
        },
        {
          label: 'Số điện thoại đã tồn tại',
          field: 'phoneNumber',
          value: updateEmployeeDto.phoneNumber,
        },
      ].filter((check) => check.value);

      for (const check of duplicateChecks) {
        const existing = await this.employeeRepository.findOne({
          where: {
            [check.field]: check.value,
            id: Not(id),
          },
        });
        if (existing) {
          throw new BadRequestException(check.label);
        }
      }

      // Lấy thông tin cũ để lưu lịch sử
      const oldEmployeeInfo = {
        employeeCode: employee.employeeCode,
        employeeName: employee.employeeName,
        phoneNumber: employee.phoneNumber,
        gender: employee.gender === Gender.MALE ? 'Nam' : 'Nữ',
        dateBirth: employee.dateBirth
          ? dayjs(employee.dateBirth).format('DD/MM/YYYY')
          : null,
        positionName: employee.position?.positionName || 'Chưa có vị trí',
      };

      // Cập nhật vị trí nếu có
      if (updateEmployeeDto.positionId) {
        const position = await this.positionRepository.findOne({
          where: { id: updateEmployeeDto.positionId },
        });
        if (!position) {
          throw new BadRequestException('Vị trí công việc không tồn tại');
        }
        employee.position = position;
      }

      // Cập nhật thông tin nhân viên
      Object.assign(employee, {
        employeeCode: updateEmployeeDto.employeeCode,
        employeeName: updateEmployeeDto.employeeName,
        phoneNumber: updateEmployeeDto.phoneNumber,
        gender: updateEmployeeDto.gender,
        dateBirth: updateEmployeeDto.dateBirth
          ? new Date(updateEmployeeDto.dateBirth)
          : null,
      });

      const updatedEmployee = await queryRunner.manager.save(employee);

      // Lấy thông tin mới để lưu lịch sử
      const newEmployeeInfo = {
        employeeCode: updateEmployeeDto.employeeCode,
        employeeName: updateEmployeeDto.employeeName,
        phoneNumber: updateEmployeeDto.phoneNumber,
        gender: updateEmployeeDto.gender === Gender.MALE ? 'Nam' : 'Nữ',
        dateBirth: updateEmployeeDto.dateBirth
          ? dayjs(updateEmployeeDto.dateBirth).format('DD/MM/YYYY')
          : null,
        positionName:
          updatedEmployee.position?.positionName || 'Chưa có vị trí',
      };

      // Lưu lịch sử thay đổi
      await this.changeLogService.logChange(
        ChangeLogAction.UPDATE,
        ChangeLogType.EMPLOYEE,
        employee.id,
        oldEmployeeInfo,
        newEmployeeInfo,
        currentUserId,
      );

      await queryRunner.commitTransaction();

      return new BaseResponse(HttpStatus.OK, 'Cập nhật nhân viên thành công', {
        id: updatedEmployee.id,
        employeeCode: updatedEmployee.employeeCode,
        employeeName: updatedEmployee.employeeName,
        phoneNumber: updatedEmployee.phoneNumber,
        gender: updatedEmployee.gender,
        dateBirth: updatedEmployee.dateBirth,
        positionName: updatedEmployee.position?.positionName,
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(
        error.message || 'Cập nhật nhân viên thất bại',
      );
    } finally {
      await queryRunner.release();
    }
  }

  // Xóa mềm thông tin nhân viên
  async removeEmployee(id: number, user: JwtPayloadUser) {
    const employee = await this.employeeRepository.findOne({
      where: {
        id,
        deletedAt: IsNull(),
      },
    });

    if (!employee) {
      throw new NotFoundException('Không tìm thấy thông tin nhân viên');
    }

    // Xóa mềm nhân viên
    await this.employeeRepository.softDelete(id);

    // Lưu lịch sử xóa
    await this.changeLogService.logChange(
      ChangeLogAction.DELETE,
      ChangeLogType.EMPLOYEE,
      employee.id,
      {
        employeeCode: employee.employeeCode,
        employeeName: employee.employeeName,
      },
      null,
      user.id,
    );

    return new BaseResponse(HttpStatus.OK, 'Xóa nhân viên thành công', null);
  }

  // Khôi phục nhân viên đã xóa
  async restoreEmployee(id: number, user: JwtPayloadUser) {
    const employee = await this.employeeRepository.findOne({
      where: {
        id,
        deletedAt: Not(IsNull()),
      },
      withDeleted: true,
    });

    if (!employee) {
      throw new NotFoundException('Không tìm thấy nhân viên đã xóa');
    }

    // Khôi phục nhân viên
    await this.employeeRepository.restore(id);

    // Lưu lịch sử khôi phục
    await this.changeLogService.logChange(
      ChangeLogAction.RESTORE,
      ChangeLogType.EMPLOYEE,
      employee.id,
      null,
      {
        employeeCode: employee.employeeCode,
        employeeName: employee.employeeName,
      },
      user.id,
    );

    return new BaseResponse(HttpStatus.OK, 'Khôi phục nhân viên thành công', {
      id: employee.id,
      employeeCode: employee.employeeCode,
      employeeName: employee.employeeName,
    });
  }
}
