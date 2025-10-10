import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Position } from './entities/position.entity';
import { Not, Repository } from 'typeorm';
import { Employee } from '../employees/entities/employee.entity';
import { BaseResponse } from 'src/common/responses/base-response';
import { JwtPayloadUser } from '../auths/interfaces/jwt-payload-user';
import { SearchPositionDto } from './dto/search-position.dto';
import { PaginatedResponse } from 'src/common/responses/base-response';

@Injectable()
export class PositionsService {
  constructor(
    @InjectRepository(Position)
    private readonly positionRepositoty: Repository<Position>,

    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  // Thêm mới vị trí làm việc
  async createPosition(
    user: JwtPayloadUser,
    createPositionDto: CreatePositionDto,
  ) {
    // Kiểm tra xem tên vị trí đã tồn tại hay chưa
    const positionExists = await this.positionRepositoty.findOne({
      where: {
        positionName: createPositionDto.positionName,
      },
    });

    if (positionExists) {
      throw new BadRequestException('Tên vị trí đã tồn tại trong hệ thống');
    }

    // Tạo một đối tượng Position mới
    const position = this.positionRepositoty.create({
      ...createPositionDto,
      createdBy: user.id,
    });

    // Lưu vị trí vào cơ sở dữ liệu
    const savedPosition = await this.positionRepositoty.save(position);

    // Tạo thông tin trả về cho client (loại bỏ thông tin garage)
    const createPositionResponse = {
      id: savedPosition.id,
      positionName: savedPosition.positionName,
      description: savedPosition.description,
      positionStatus: savedPosition.positionStatus,
      createdAt: savedPosition.createdAt,
    };

    // Trả về phản hồi thành công
    return new BaseResponse(
      HttpStatus.CREATED,
      'Tạo vị trí thành công',
      createPositionResponse,
    );
  }

  // Lấy thông tin chi tiết vị trí làm việc
  async getPositionById(id: number) {
    // Lấy thông tin chi tiết vị trí làm việc
    const position = await this.positionRepositoty.findOne({
      where: { id },
      select: [
        'id',
        'positionName',
        'description',
        'positionStatus',
        'createdAt',
      ],
    });

    if (!position) {
      throw new NotFoundException('Không tìm thấy thông tin vị trí');
    }

    // Tạo thông tin trả về cho client
    const getDetailPositionResponse = {
      id: position.id,
      positionName: position.positionName,
      description: position.description,
      positionStatus: position.positionStatus,
      createdAt: position.createdAt,
    };

    // Trả về phản hồi thành công
    return new BaseResponse(
      HttpStatus.OK,
      'Lấy thông tin vị trí thành công',
      getDetailPositionResponse,
    );
  }

  // Cập nhật thông tin vị trí làm việc
  async updatePosition(
    user: JwtPayloadUser,
    id: number,
    updatePositionDto: UpdatePositionDto,
  ) {
    // Kiểm tra xem vị trí có tồn tại hay không
    const position = await this.positionRepositoty.findOne({
      where: { id },
    });

    if (!position) {
      throw new NotFoundException('Không tìm thấy thông tin vị trí');
    }

    // Kiểm tra xem tên vị trí đã tồn tại hay chưa
    const positionName = await this.positionRepositoty.findOne({
      where: { positionName: updatePositionDto.positionName, id: Not(id) },
    });

    if (positionName) {
      throw new BadRequestException('Tên vị trí đã tồn tại');
    }

    // Cập nhật thông tin vị trí
    await this.positionRepositoty.update(id, {
      ...updatePositionDto,
      updatedBy: user.id,
    });

    return new BaseResponse(
      HttpStatus.OK,
      'Cập nhật thông tin vị trí thành công',
      {
        id,
        positionName: updatePositionDto.positionName,
        description: updatePositionDto.description,
        positionStatus: updatePositionDto.positionStatus,
        updatedAt: new Date(),
      },
    );
  }

  // Xóa vị trí làm việc
  async removePosition(id: number) {
    const position = await this.positionRepositoty.findOne({ where: { id } });

    if (!position) {
      throw new NotFoundException('Không tìm thấy vị trí');
    }

    const employee = await this.employeeRepository.findOne({
      where: { position: { id } },
    });

    if (employee) {
      throw new BadRequestException(
        'Không thể xóa vị trí vì còn nhân viên đang giữ vị trí này',
      );
    }

    await this.positionRepositoty.softDelete(id);

    return new BaseResponse(HttpStatus.OK, 'Xóa vị trí thành công', null);
  }

  // Tìm kiếm và phân trang danh sách vị trí làm việc
  async searchPositions(
    user: JwtPayloadUser,
    searchDto: SearchPositionDto,
  ): Promise<PaginatedResponse<any>> {
    const {
      keyword,
      positionStatus,
      currentPage = 1,
      pageSize = 10,
      sortOrder = 'DESC',
    } = searchDto;

    // Tạo query builder với search và filter
    const queryBuilder = this.positionRepositoty
      .createQueryBuilder('position')
      .leftJoin('position.employees', 'employee')
      .leftJoin('employee.user', 'user')
      .select([
        'position.id',
        'position.positionName',
        'position.description',
        'position.positionStatus',
        'position.createdAt',
      ])
      .addSelect('COUNT(DISTINCT employee.user_id)', 'employeeCount')
      .groupBy('position.id')
      .addGroupBy('position.positionName')
      .addGroupBy('position.description')
      .addGroupBy('position.positionStatus')
      .addGroupBy('position.createdAt');

    // Tìm kiếm theo từ khóa
    if (keyword) {
      queryBuilder.andWhere(
        '(position.positionName LIKE :keyword OR position.description LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    // Lọc theo trạng thái
    if (positionStatus) {
      queryBuilder.andWhere('position.positionStatus = :positionStatus', {
        positionStatus,
      });
    }

    // Sắp xếp
    queryBuilder.orderBy('position.createdAt', sortOrder);

    // Đếm tổng số bản ghi (trước khi phân trang)
    const totalRecords = await queryBuilder.getCount();

    // Phân trang
    const skip = (currentPage - 1) * pageSize;
    queryBuilder.offset(skip).limit(pageSize);

    // Thực hiện truy vấn
    const result = await queryBuilder.getRawAndEntities();

    // Format lại dữ liệu để bao gồm employeeCount
    const formattedPositions = result.entities.map((position, index) => {
      const employeeCount = parseInt(result.raw[index]?.employeeCount || '0');
      return {
        id: position.id,
        positionName: position.positionName,
        description: position.description,
        positionStatus: position.positionStatus,
        createdAt: position.createdAt,
        employeeCount,
        isDelete: employeeCount === 0,
      };
    });

    // Tính tổng số trang
    const totalPages = Math.ceil(totalRecords / pageSize);

    // Trả về phản hồi với phân trang
    return new PaginatedResponse(
      HttpStatus.OK,
      'Tìm kiếm danh sách vị trí thành công',
      formattedPositions,
      {
        currentPage,
        pageSize,
        totalRecords,
        totalPages,
      },
    );
  }
}
