import {
  BadRequestException,
  ForbiddenException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { DataSource, In, Not, Repository } from 'typeorm';
import { Employee } from './entities/employee.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { EmployeeResponseDto } from './dto/employee-response.dto';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { Position } from '../positions/entities/position.entity';
import { CloudinaryService } from 'src/services/cloudinary.service';
import { Image } from '../images/entities/image.entity';
import { TypeImage } from 'src/common/enums/type-image.enum';
import { ImagesService } from '../images/services/images.service';
import { Gender } from 'src/common/enums/gender.enum';
import { EmployeeStatus } from './enums/employee-status';
import { UserStatus } from '../users/enums/user-status.enum';
import {
  BaseResponse,
  PaginatedResponse,
} from 'src/common/responses/base-response';
import { generateSecurePassword } from 'src/common/utils/generate-password.util';
import { ConfigService } from '@nestjs/config';
import { hashPassword } from 'src/common/utils/hashing.util';
import { ChangeLogsService } from '../change-logs/change-logs.service';
import { ChangeLogType } from '../change-logs/enums/change-log-type.enum';
import { ChangeLogAction } from '../change-logs/enums/change-log-action.enum';
import { PasswordHistory } from '../password-histories/entities/password-history.entity';
import { JwtPayloadUser } from '../auths/interfaces/jwt-payload-user';
import { SearchAndPagingEmployeeDto } from './dto/search-employee.dto';
import { RoleCode } from 'src/common/enums/role-code.enum';
import * as dayjs from 'dayjs';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,

    @InjectRepository(Position)
    private readonly positionRepository: Repository<Position>,

    private readonly dataSource: DataSource,
    private readonly cloudinaryService: CloudinaryService,

    @InjectRepository(Image)
    private readonly imageRepository: Repository<Image>,

    @InjectRepository(PasswordHistory)
    private readonly passwordHistoryRepository: Repository<PasswordHistory>,

    private readonly imagesService: ImagesService,
    private readonly configService: ConfigService,
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
        email,
        phoneNumber,
        dateBirth,
        gender,
        employeeStatus,
        address,
      } = createEmployeeDto;

      // Kiểm tra các field bắt buộc
      if (!employeeCode || !employeeName || !phoneNumber) {
        throw new BadRequestException(
          'Mã nhân viên, tên nhân viên và số điện thoại là bắt buộc',
        );
      }

      const [firstName, lastName] = (() => {
        if (!employeeName || typeof employeeName !== 'string') {
          throw new BadRequestException('Tên nhân viên không hợp lệ');
        }
        const parts = employeeName.trim().split(' ');
        return [parts.slice(0, -1).join(' '), parts.at(-1) || ''];
      })();

      const duplicateChecks = [
        {
          label: 'Mã nhân viên đã tồn tại',
          field: 'employeeCode',
          value: employeeCode,
          repo: this.employeeRepository,
        },
        {
          label: 'Email đã tồn tại',
          field: 'email',
          value: email,
          repo: this.userRepository,
        },
        {
          label: 'Số điện thoại đã tồn tại',
          field: 'phoneNumber',
          value: phoneNumber,
          repo: this.userRepository,
        },
      ].filter((c) => c.value);

      const duplicateIndex = (
        await Promise.all(
          duplicateChecks.map((check) =>
            check.repo.findOne({ where: { [check.field]: check.value } }),
          ),
        )
      ).findIndex(Boolean);

      if (duplicateIndex !== -1) {
        throw new BadRequestException(duplicateChecks[duplicateIndex].label);
      }

      // Lấy role mặc định cho employee
      const role = await this.roleRepository.findOne({
        where: { roleCode: 'EMPLOYEE' },
      });

      if (!role) {
        throw new BadRequestException('Không tìm thấy role EMPLOYEE');
      }

      const position = null; // Không có position mặc định

      const rawPassword = generateSecurePassword(10);
      const hashedPassword = await hashPassword(rawPassword);

      const newUser = this.userRepository.create({
        firstName,
        lastName,
        dateBirth,
        gender,
        email,
        phoneNumber,
        status: UserStatus.ACTIVE,
        address,
        password: hashedPassword,
        roleId: role.id, // Gán role cho user
      });

      const savedUser = await queryRunner.manager.save(newUser);

      const passwordHistory = this.passwordHistoryRepository.create({
        user: savedUser,
        hashedPassword,
      });
      await queryRunner.manager.save(passwordHistory);

      const newEmployee = this.employeeRepository.create({
        userId: savedUser.id, // Gán user_id
        employeeCode,
        position,
        employeeStatus: employeeStatus || EmployeeStatus.WORKING,
        createdBy: user.id, // Lưu ID của người tạo
      });

      const savedEmployee = await queryRunner.manager.save(newEmployee);

      await queryRunner.commitTransaction();

      return new BaseResponse(HttpStatus.CREATED, 'Tạo nhân viên thành công', {
        id: savedUser.id,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        gender: savedUser.gender,
        dateBirth: savedUser.dateBirth,
        email: savedUser.email,
        phoneNumber: savedUser.phoneNumber,
        status: savedEmployee.employeeStatus,
        employeeCode: savedEmployee.employeeCode,
        address: savedUser.address,
        positionName: savedEmployee.position?.positionName,
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Lỗi khi tạo nhân viên:', error);
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Thêm mới nhân viên thất bại',
      );
    } finally {
      await queryRunner.release();
    }
  }

  // Tìm kiếm, phân trang, sắp xếp, lọc nhân viên
  async searchAndPagingEmployees(
    user: JwtPayloadUser,
    query: SearchAndPagingEmployeeDto,
  ): Promise<PaginatedResponse<EmployeeResponseDto>> {
    const {
      keyword,
      employeeStatus,
      positionIds,
      currentPage = 1,
      pageSize = 10,
    } = query;

    const queryBuilder = this.employeeRepository
      .createQueryBuilder('employee')
      .leftJoinAndSelect('employee.user', 'user')
      .leftJoinAndSelect('employee.position', 'position')
      .leftJoin('user.role', 'role')
      .addSelect('role.roleName', 'roleName')
      .addSelect('role.id', 'roleId')
      .where('user.deletedAt IS NULL')
      .andWhere('employee.createdBy = :createdBy', { createdBy: user.id });

    // Nếu là quản lý chi nhánh thì chỉ lấy nhân viên của chi nhánh đó (trừ chính họ)
    const isManager = user.role.code === RoleCode.MANAGER;

    // Nếu là quản lý chi nhánh thì chỉ lấy nhân viên của chi nhánh đó
    if (isManager) {
      queryBuilder.andWhere('user.id = :userId', { userId: user.id });
    }

    queryBuilder.select([
      'user.id AS id',
      'employee.employeeCode AS employeeCode',
      'user.phoneNumber AS phoneNumber',
      'user.gender AS gender',
      'user.email AS email',
      'user.dateBirth AS dateBirth',
      'user.createdAt AS createdAt',
      'user.address AS address',
      'employee.employeeStatus AS status',
      'position.id AS positionId',
      'position.positionName AS positionName',
      `CONCAT(user.firstName, ' ', user.lastName) AS employeeName`,
      'role.roleCode AS roleCode',
      'role.roleName AS roleName',
    ]);

    if (keyword) {
      queryBuilder.andWhere(
        `(employee.employee_code LIKE :keyword 
          OR CONCAT(user.firstName, ' ', user.lastName) LIKE :keyword 
          OR user.email LIKE :keyword
          OR user.phoneNumber LIKE :keyword)`,
        { keyword: `%${keyword}%` },
      );
    }

    const employeeStatusArray = Array.isArray(employeeStatus)
      ? employeeStatus
      : [employeeStatus];

    if (employeeStatus && employeeStatus.length > 0) {
      queryBuilder.andWhere('employee.employee_status IN (:...status)', {
        status: employeeStatusArray,
      });
    }

    if (positionIds && positionIds.length > 0) {
      queryBuilder.andWhere('position.id IN (:...positionIds)', {
        positionIds,
      });
    }

    const totalRecords = await queryBuilder.getCount(); // clone query trước skip/take

    queryBuilder
      .orderBy('user.createdAt', 'ASC')
      .skip((currentPage - 1) * pageSize)
      .take(pageSize);

    // Lấy danh sách nhân viên
    const employees = await queryBuilder.getRawMany();

    // Lấy danh sách Id của nhân viên
    const employeeIds = employees.map((emp) => emp.id);

    // Lấy danh sách ảnh của nhân viên
    const images = await this.imageRepository.find({
      where: { refId: In(employeeIds), type: TypeImage.EMPLOYEE },
    });

    // Gán ảnh cho từng nhân viên
    const employeeWithImages = employees.map((employee) => {
      const dto = new EmployeeResponseDto();
      Object.assign(dto, employee);
      const image = images.find((img) => img.refId === employee.id);
      dto.avatar = image
        ? {
            id: image.id,
            url: image.url,
            publicId: parseInt(image.publicId, 10),
          }
        : undefined;

      return dto;
    });

    // Lọc ra các thông tin về vị trí. Nếu nhân viên có role là BRANCH_MANAGER sẽ trả về positionName là "Quản lý chi nhánh"
    employeeWithImages.forEach((emp) => {
      if (emp.roleCode === RoleCode.MANAGER) {
        emp.positionName = 'Quản lý chi nhánh';
      } else {
        emp.positionName = emp.positionName || 'Chưa có vị trí';
      }
    });

    return new PaginatedResponse(
      HttpStatus.OK,
      'Lấy danh sách nhân viên thành công',
      employeeWithImages,
      {
        totalRecords,
        currentPage: parseInt(currentPage as any),
        pageSize: parseInt(pageSize as any),
        totalPages: Math.ceil(employees.length / pageSize),
      },
    );
  }

  // Lấy thông tin chi tiết nhân viên
  async findOneEmployee(employeeId: number, currentUserId: number) {
    const queryBuilder = this.employeeRepository
      .createQueryBuilder('employee')
      .leftJoinAndSelect('employee.user', 'user')
      .leftJoinAndSelect('employee.position', 'position')
      .leftJoin('user.role', 'role')
      .addSelect('role.roleName', 'roleName')
      .addSelect('role.id', 'roleId')
      .where('user.deletedAt IS NULL')
      .andWhere('user.id = :employeeId', { employeeId })
      .andWhere('employee.createdBy = :createdBy', {
        createdBy: currentUserId,
      });

    queryBuilder.select([
      'user.id AS userId',
      'employee.employeeCode AS employeeCode',
      'employee.employeeStatus AS employeeStatus',
      'user.firstName AS firstName',
      'user.lastName AS lastName',
      `CONCAT(user.firstName, ' ', user.lastName) AS employeeName`,
      'user.dateBirth AS dateBirth',
      'user.gender AS gender',
      'user.email AS email',
      'user.phoneNumber AS phoneNumber',
      'user.address AS address',
      'user.createdAt AS createdAt',
      'position.id AS positionId',
      'position.positionName AS positionName',
      'position.description AS positionDescription',
      'role.roleCode AS roleCode',
    ]);

    const raw = await queryBuilder.getRawOne();

    if (!raw) {
      throw new NotFoundException('Không tìm thấy thông tin nhân viên');
    }

    const employee = {
      id: raw.userId,
      employeeCode: raw.employeeCode,
      employeeName: `${raw.firstName} ${raw.lastName}`,
      dateBirth: raw.dateBirth,
      gender: raw.gender,
      email: raw.email,
      phoneNumber: raw.phoneNumber,
      status: raw.employeeStatus,
      createdAt: raw.createdAt,
      roleCode: raw?.roleCode,
      position: {
        positionName: raw.positionName,
        positionId: raw.positionId,
        positionDescription: raw.positionDescription,
      },
    };

    return new BaseResponse(
      HttpStatus.OK,
      'Lấy thông tin nhân viên thành công',
      employee,
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

    const { positionId } = updateEmployeeDto;

    try {
      // 1. Tìm user + employee cũ
      const [role, user] = await Promise.all([
        this.roleRepository.findOne({
          where: { roleCode: RoleCode.EMPLOYEE },
        }),
        this.userRepository.findOne({ where: { id } }),
      ]);

      if (!user) {
        throw new BadRequestException('Không tìm thấy thông tin user');
      }

      const employee = await this.employeeRepository.findOne({
        where: {
          userId: id,
          createdBy: currentUserId,
        },
        relations: ['position', 'user'],
      });

      if (!user || !employee) {
        throw new BadRequestException('Không tìm thấy thông tin nhân viên');
      }

      // Kiểm tra user chưa bị xóa mềm
      if (user?.deletedAt) {
        throw new BadRequestException('Nhân viên đã bị xóa');
      }

      // 2. Check trùng dữ liệu
      const duplicateChecks = [
        {
          label: 'Mã nhân viên',
          field: 'employeeCode',
          value: updateEmployeeDto.employeeCode,
          repo: this.employeeRepository,
        },

        {
          label: 'Email',
          field: 'email',
          value: updateEmployeeDto.email,
          repo: this.userRepository,
        },
        {
          label: 'Số điện thoại',
          field: 'phoneNumber',
          value: updateEmployeeDto.phoneNumber,
          repo: this.userRepository,
        },
      ].filter((check) => check.value);

      const duplicateIndex = (
        await Promise.all(
          duplicateChecks.map((check) => {
            if (check.repo === this.employeeRepository) {
              // Kiểm tra employeeCode - loại trừ chính employee hiện tại
              return check.repo.findOne({
                where: {
                  [check.field]: check.value,
                  userId: Not(id), // Loại trừ user hiện tại
                },
              });
            } else {
              // Kiểm tra email/phoneNumber - loại trừ chính user hiện tại
              return check.repo.findOne({
                where: {
                  [check.field]: check.value,
                  id: Not(id), // Loại trừ user hiện tại
                },
              });
            }
          }),
        )
      ).findIndex(Boolean);

      if (duplicateIndex !== -1) {
        throw new BadRequestException(
          `${duplicateChecks[duplicateIndex].label} đã tồn tại`,
        );
      }

      // Lấy thông tin cũ của nhân viên để lưu vào lịch sử
      const oldEmployeeObj = {
        employeeCode: employee.employeeCode,
        employeeName: `${user.firstName} ${user.lastName}`,
        phoneNumber: user.phoneNumber,
        email: user.email,
        gender: user.gender === Gender.MALE ? 'Nam' : 'Nữ',
        dateBirth: dayjs(user.dateBirth).format('DD/MM/YYYY'),
        employeeStatus:
          employee.employeeStatus === EmployeeStatus.WORKING
            ? 'Đang làm việc'
            : employee.employeeStatus === EmployeeStatus.TEMPORARILY_INACTIVE
              ? 'Tạm dừng làm việc'
              : employee.employeeStatus === EmployeeStatus.NOTWORKING
                ? 'Chưa làm việc'
                : 'Đã nghỉ việc',
        address: user.address,
        positionName: employee.position?.positionName,
      };

      // Chuyển đổi thành JSON để lưu vào lịch sử
      const oldEmployeeInfo = JSON.parse(JSON.stringify(oldEmployeeObj));

      // 3. Update user
      const [firstName, lastName] = (() => {
        if (
          !updateEmployeeDto.employeeName ||
          typeof updateEmployeeDto.employeeName !== 'string'
        ) {
          throw new BadRequestException('Tên nhân viên không hợp lệ');
        }
        const parts = updateEmployeeDto.employeeName.trim().split(' ');
        return [parts.slice(0, -1).join(' '), parts.at(-1) || ''];
      })();

      Object.assign(user, {
        firstName,
        lastName,
        dateBirth: updateEmployeeDto.dateBirth,
        gender: updateEmployeeDto.gender,
        email: updateEmployeeDto.email,
        phoneNumber: updateEmployeeDto.phoneNumber,
        address: updateEmployeeDto.address,
        positionName: employee.position?.positionName,
      });

      // Cập nhật role cho user
      user.roleId = role.id;

      // 4. Update employee
      if (positionId) {
        employee.position = await this.positionRepository.findOne({
          where: { id: positionId },
        });
      }

      Object.assign(employee, {
        employeeCode: updateEmployeeDto.employeeCode,
        employeeStatus: updateEmployeeDto.employeeStatus,
      });

      await queryRunner.manager.save(user);
      await queryRunner.manager.save(employee);

      // Lấy thông tin mới của nhân viên để lưu vào lịch sử
      const newEmployeeObj = {
        employeeCode: updateEmployeeDto.employeeCode,
        employeeName: updateEmployeeDto.employeeName,
        phoneNumber: updateEmployeeDto.phoneNumber,
        email: updateEmployeeDto.email,
        gender: updateEmployeeDto.gender === Gender.MALE ? 'Nam' : 'Nữ',
        dateBirth: dayjs(user.dateBirth).format('DD/MM/YYYY'),
        employeeStatus:
          updateEmployeeDto.employeeStatus === EmployeeStatus.WORKING
            ? 'Đang làm việc'
            : updateEmployeeDto.employeeStatus ===
                EmployeeStatus.TEMPORARILY_INACTIVE
              ? 'Tạm nghỉ'
              : 'Đã nghỉ việc',
        address: updateEmployeeDto.address,
        positionName: employee.position?.positionName,
      };

      // Lưu lịch sử thay đổi
      await this.changeLogService.logChange(
        ChangeLogAction.UPDATE,
        ChangeLogType.EMPLOYEE,
        employee.userId,
        oldEmployeeInfo,
        newEmployeeObj,
        id,
      );

      await queryRunner.commitTransaction();

      return new BaseResponse(HttpStatus.OK, 'Cập nhật nhân viên thành công', {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phoneNumber: user.phoneNumber,
        gender: user.gender,
        dateBirth: user.dateBirth,
        status: employee.employeeStatus,
        employeeCode: employee.employeeCode,
        address: user.address,
        positionName: employee.position?.positionName,
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
    // 1. Tìm employee với userId = id và createdBy = user.id
    const employee = await this.employeeRepository
      .createQueryBuilder('employee')
      .leftJoinAndSelect('employee.user', 'user')
      .where('employee.userId = :userId', { userId: id })
      .andWhere('employee.createdBy = :createdBy', { createdBy: user.id })
      .getOne();

    if (!employee) {
      throw new NotFoundException('Không tìm thấy thông tin nhân viên');
    }

    // 2. Kiểm tra user chưa bị xóa mềm
    if (!employee.user) {
      throw new BadRequestException('Nhân viên đã bị xóa');
    }

    // 3. Kiểm tra quyền (chỉ quản lý tạo ra nhân viên mới có quyền xóa)
    const isManager = user.role.code === RoleCode.MANAGER;
    if (isManager && user.id !== employee.createdBy) {
      throw new ForbiddenException('Bạn không có quyền xóa nhân viên này');
    }

    // 4. Xóa mềm user (vì User và Employee có quan hệ One-to-One)
    await this.userRepository.softDelete(id);

    return new BaseResponse(HttpStatus.OK, 'Xóa nhân viên thành công.', null);
  }
}
