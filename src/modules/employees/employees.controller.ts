import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  Put,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { SearchAndPagingEmployeeDto } from './dto/search-employee.dto';
import { EmployeeResponseDto } from './dto/employee-response.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtPayloadUser } from '../auths/interfaces/jwt-payload-user';
import {
  BaseResponse,
  PaginatedResponse,
} from 'src/common/responses/base-response';

@ApiTags('Employees - Quản lý nhân viên')
@ApiBearerAuth()
@Controller({ version: '1' })
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Tạo nhân viên mới',
    description: `
      API tạo nhân viên mới với đầy đủ thông tin cá nhân và công việc.
      
      **Thông tin bắt buộc:**
      - Mã nhân viên (duy nhất)
      - Tên đầy đủ
      - Số điện thoại (duy nhất)
      
      **Thông tin tùy chọn:**
      - Giới tính
      - Ngày sinh
      - Vị trí công việc
      
      **Quyền truy cập:** Chỉ quản lý chi nhánh
      **Validation:** Tất cả dữ liệu đầu vào đều được validate nghiêm ngặt
    `,
  })
  @ApiBody({
    type: CreateEmployeeDto,
    description: 'Thông tin nhân viên cần tạo mới',
    examples: {
      example1: {
        summary: 'Tạo nhân viên cơ bản',
        value: {
          employeeCode: 'NV0001',
          employeeName: 'Nguyễn Văn Nam',
          phoneNumber: '0123456789',
          gender: 'MALE',
          dateBirth: '1990-01-01',
          positionId: 1,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tạo nhân viên thành công',
    type: BaseResponse,
    schema: {
      example: {
        statusCode: 201,
        message: 'Tạo nhân viên thành công',
        data: {
          id: 1,
          employeeCode: 'NV0001',
          employeeName: 'Nguyễn Văn Nam',
          phoneNumber: '0123456789',
          gender: 'MALE',
          dateBirth: '1990-01-01',
          positionName: 'Nhân viên bán hàng',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dữ liệu đầu vào không hợp lệ',
    schema: {
      example: {
        statusCode: 400,
        message: 'Mã nhân viên đã tồn tại',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Không có quyền truy cập',
    schema: {
      example: {
        statusCode: 403,
        message: 'Forbidden resource',
        error: 'Forbidden',
      },
    },
  })
  async createEmployee(
    @CurrentUser() user: JwtPayloadUser,
    @Body() createEmployeeDto: CreateEmployeeDto,
  ) {
    return this.employeesService.createEmployee(user, createEmployeeDto);
  }

  @Get('search-paging')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Tìm kiếm và phân trang nhân viên',
    description: `
      API tìm kiếm nhân viên với nhiều tiêu chí lọc và phân trang.
      
      **Tính năng tìm kiếm:**
      - Tìm kiếm theo từ khóa: tên nhân viên, mã nhân viên, số điện thoại
      - Lọc theo vị trí: có thể chọn nhiều vị trí công việc
      - Phân trang: hỗ trợ phân trang với page và pageSize
      
      **Quyền truy cập:** Chỉ quản lý chi nhánh
      **Kết quả:** Trả về danh sách nhân viên kèm thông tin phân trang
    `,
  })
  @ApiQuery({
    name: 'keyword',
    required: false,
    description: 'Từ khóa tìm kiếm (tên, mã, số điện thoại)',
    example: 'Nguyễn Văn',
  })
  @ApiQuery({
    name: 'currentPage',
    required: false,
    description: 'Trang hiện tại',
    example: 1,
    type: 'number',
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    description: 'Số lượng bản ghi mỗi trang',
    example: 10,
    type: 'number',
  })
  @ApiQuery({
    name: 'positionIds',
    required: false,
    description: 'Danh sách ID vị trí công việc',
    example: [1, 2, 3],
    type: 'array',
    isArray: true,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy danh sách nhân viên thành công',
    type: PaginatedResponse<EmployeeResponseDto>,
    schema: {
      example: {
        statusCode: 200,
        message: 'Lấy danh sách nhân viên thành công',
        data: [
          {
            id: 1,
            employeeCode: 'NV0001',
            employeeName: 'Nguyễn Văn Nam',
            phoneNumber: '0123456789',
            gender: 'MALE',
            dateBirth: '1990-01-01',
            createdAt: '2024-01-01T00:00:00.000Z',
            positionId: 1,
            positionName: 'Nhân viên bán hàng',
          },
        ],
        pagination: {
          totalRecords: 1,
          currentPage: 1,
          pageSize: 10,
          totalPages: 1,
        },
      },
    },
  })
  async searchAndPagingEmployees(@Query() query: SearchAndPagingEmployeeDto) {
    return this.employeesService.searchAndPagingEmployees(query);
  }

  @Get('all')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Lấy danh sách tất cả nhân viên',
    description: `
      API lấy danh sách tất cả nhân viên không phân trang.
      
      **Mục đích:** Sử dụng cho dropdown, select box, hoặc export dữ liệu
      **Quyền truy cập:** Chỉ quản lý chi nhánh
      **Lưu ý:** Chỉ trả về nhân viên do quản lý hiện tại tạo ra
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy danh sách nhân viên thành công',
    type: BaseResponse,
    schema: {
      example: {
        statusCode: 200,
        message: 'Lấy danh sách nhân viên thành công',
        data: [
          {
            id: 1,
            employeeCode: 'NV0001',
            employeeName: 'Nguyễn Văn Nam',
            phoneNumber: '0123456789',
            positionName: 'Nhân viên bán hàng',
          },
        ],
      },
    },
  })
  async getAllEmployees() {
    return this.employeesService.getAllEmployees();
  }

  @Get('statistics')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Thống kê nhân viên',
    description: `
      API lấy thống kê tổng quan về nhân viên.
      
      **Thông tin thống kê:**
      - Tổng số nhân viên
      - Số nhân viên theo từng vị trí
      - Tỷ lệ phân bố
      
      **Quyền truy cập:** Chỉ quản lý chi nhánh
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy thống kê nhân viên thành công',
    type: BaseResponse,
    schema: {
      example: {
        statusCode: 200,
        message: 'Lấy thống kê nhân viên thành công',
        data: {
          totalEmployees: 50,
          byPosition: {
            'Nhân viên bán hàng': 25,
            'Nhân viên kho': 15,
            'Nhân viên kỹ thuật': 10,
          },
        },
      },
    },
  })
  async getEmployeeStatistics() {
    return this.employeesService.getEmployeeStatistics();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Lấy thông tin chi tiết nhân viên',
    description: `
      API lấy thông tin chi tiết của một nhân viên cụ thể.
      
      **Thông tin trả về:**
      - Thông tin cá nhân đầy đủ
      - Thông tin công việc hiện tại
      - Lịch sử thay đổi (nếu có)
      
      **Quyền truy cập:** Chỉ quản lý chi nhánh
      **Lưu ý:** Chỉ có thể xem nhân viên do quản lý hiện tại tạo ra
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'ID của nhân viên',
    example: 1,
    type: 'number',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy thông tin nhân viên thành công',
    type: BaseResponse,
    schema: {
      example: {
        statusCode: 200,
        message: 'Lấy thông tin nhân viên thành công',
        data: {
          id: 1,
          employeeCode: 'NV0001',
          employeeName: 'Nguyễn Văn Nam',
          phoneNumber: '0123456789',
          gender: 'MALE',
          dateBirth: '1990-01-01',
          createdAt: '2024-01-01T00:00:00.000Z',
          position: {
            id: 1,
            positionName: 'Nhân viên bán hàng',
            description: 'Phụ trách bán hàng và tư vấn khách hàng',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy nhân viên',
    schema: {
      example: {
        statusCode: 404,
        message: 'Không tìm thấy thông tin nhân viên',
        error: 'Not Found',
      },
    },
  })
  async findOneEmployee(@Param('id', ParseIntPipe) id: number) {
    return this.employeesService.findOneEmployee(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Cập nhật thông tin nhân viên',
    description: `
      API cập nhật thông tin nhân viên với đầy đủ validation.
      
      **Có thể cập nhật:**
      - Thông tin cá nhân: tên, số điện thoại
      - Thông tin công việc: vị trí
      - Thông tin khác: giới tính, ngày sinh
      
      **Validation:**
      - Kiểm tra trùng lặp số điện thoại, mã nhân viên
      - Validate định dạng dữ liệu
      - Lưu lịch sử thay đổi
      
      **Quyền truy cập:** Chỉ quản lý chi nhánh
      **Lưu ý:** Chỉ có thể cập nhật nhân viên do quản lý hiện tại tạo ra
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'ID của nhân viên cần cập nhật',
    example: 1,
    type: 'number',
  })
  @ApiBody({
    type: UpdateEmployeeDto,
    description: 'Thông tin nhân viên cần cập nhật',
    examples: {
      example1: {
        summary: 'Cập nhật thông tin cơ bản',
        value: {
          employeeCode: 'NV0001',
          employeeName: 'Nguyễn Văn Nam Cập nhật',
          phoneNumber: '0123456789',
          gender: 'MALE',
          dateBirth: '1990-01-01',
          positionId: 2,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cập nhật nhân viên thành công',
    type: BaseResponse,
    schema: {
      example: {
        statusCode: 200,
        message: 'Cập nhật nhân viên thành công',
        data: {
          id: 1,
          employeeCode: 'NV0001',
          employeeName: 'Nguyễn Văn Nam Cập nhật',
          phoneNumber: '0123456789',
          gender: 'MALE',
          dateBirth: '1990-01-01',
          positionName: 'Nhân viên kho',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dữ liệu đầu vào không hợp lệ hoặc trùng lặp',
    schema: {
      example: {
        statusCode: 400,
        message: 'Số điện thoại đã tồn tại',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy nhân viên',
    schema: {
      example: {
        statusCode: 404,
        message: 'Không tìm thấy thông tin nhân viên',
        error: 'Not Found',
      },
    },
  })
  async updateEmployee(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ) {
    return this.employeesService.updateEmployee(id, user.id, updateEmployeeDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Xóa nhân viên (Soft Delete)',
    description: `
      API xóa nhân viên bằng phương pháp soft delete.
      
      **Tính năng:**
      - Không xóa thực sự khỏi database
      - Đánh dấu deletedAt và deletedBy
      - Có thể khôi phục nếu cần
      - Lưu lịch sử xóa
      
      **Quyền truy cập:** Chỉ quản lý chi nhánh
      **Lưu ý:** Chỉ có thể xóa nhân viên do quản lý hiện tại tạo ra
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'ID của nhân viên cần xóa',
    example: 1,
    type: 'number',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Xóa nhân viên thành công',
    type: BaseResponse,
    schema: {
      example: {
        statusCode: 200,
        message: 'Xóa nhân viên thành công',
        data: null,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy nhân viên',
    schema: {
      example: {
        statusCode: 404,
        message: 'Không tìm thấy thông tin nhân viên',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Không có quyền xóa nhân viên này',
    schema: {
      example: {
        statusCode: 403,
        message: 'Bạn không có quyền xóa nhân viên này',
        error: 'Forbidden',
      },
    },
  })
  async removeEmployee(@Param('id', ParseIntPipe) id: number) {
    return this.employeesService.removeEmployee(id);
  }
}
