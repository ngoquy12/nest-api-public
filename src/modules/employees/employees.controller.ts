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
} from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtPayloadUser } from '../auths/interfaces/jwt-payload-user';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RoleCode } from 'src/common/enums/role-code.enum';
import { SearchAndPagingEmployeeDto } from './dto/search-employee.dto';

@ApiBearerAuth()
@Controller({ version: '1' })
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  // Thêm mới nhân viên
  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles(RoleCode.MANAGER)
  @ApiOperation({
    summary: 'Tạo nhân viên mới',
    description: `
      API tạo nhân viên mới với thông tin:
      - Thông tin cơ bản: tên, mã, email, số điện thoại
      - Thông tin cá nhân: ngày sinh, giới tính, địa chỉ
      - Trạng thái nhân viên
      
      **Quyền truy cập:** Chỉ quản lý chi nhánh
      **Lưu ý:** Nhân viên được tạo sẽ được gán cho quản lý hiện tại (createdBy)
    `,
  })
  @ApiBody({
    type: CreateEmployeeDto,
    description: 'Thông tin nhân viên cần tạo mới',
  })
  createEmployee(
    @CurrentUser() user: JwtPayloadUser,
    @Body() createEmployeeDto: CreateEmployeeDto,
  ) {
    return this.employeesService.createEmployee(user, createEmployeeDto);
  }

  // Tìm kiếm, phân trang, sắp xếp, lọc nhân viên
  @Get('search-paging')
  @UseGuards(JwtAuthGuard)
  @Roles(RoleCode.MANAGER)
  @ApiOperation({
    summary: 'Tìm kiếm và phân trang nhân viên',
    description: `
      API tìm kiếm nhân viên với các tiêu chí:
      - Tìm kiếm theo từ khóa (tên nhân viên, mã nhân viên, email)
      - Lọc theo trạng thái nhân viên (có thể chọn nhiều trạng thái)
      - Lọc theo danh sách vị trí công việc (có thể chọn nhiều vị trí)
      - Phân trang kết quả
      
      **Quyền truy cập:** Chỉ quản lý chi nhánh
      **Lưu ý:** Chỉ hiển thị nhân viên do quản lý hiện tại tạo ra
    `,
  })
  async searchAndPagingEmployees(
    @CurrentUser() user: JwtPayloadUser,
    @Query() query: SearchAndPagingEmployeeDto,
  ) {
    return this.employeesService.searchAndPagingEmployees(user, query);
  }

  // Lấy thông tin chi tiết nhân viên
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(RoleCode.MANAGER)
  @ApiOperation({
    summary: 'Lấy thông tin chi tiết nhân viên',
    description: `
      API lấy thông tin chi tiết của một nhân viên bao gồm:
      - Thông tin cơ bản: tên, mã, email, số điện thoại
      - Thông tin cá nhân: ngày sinh, giới tính, địa chỉ
      - Thông tin công việc: vị trí, trạng thái
      - Thông tin tạo/cập nhật
      
      **Quyền truy cập:** Chỉ quản lý chi nhánh
      **Lưu ý:** Chỉ có thể xem nhân viên do quản lý hiện tại tạo ra
    `,
  })
  findOneEmployee(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
  ) {
    return this.employeesService.findOneEmployee(+id, user.id);
  }

  // Cập nhật thông tin nhân viên
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(RoleCode.MANAGER)
  @ApiOperation({
    summary: 'Cập nhật thông tin nhân viên',
    description: `
      API cập nhật thông tin nhân viên bao gồm:
      - Cập nhật thông tin cơ bản
      - Thay đổi vị trí công việc
      - Cập nhật trạng thái nhân viên
      - Cập nhật thông tin cá nhân
      
      **Quyền truy cập:** Chỉ quản lý chi nhánh
      **Lưu ý:** Chỉ có thể cập nhật nhân viên do quản lý hiện tại tạo ra
    `,
  })
  @ApiBody({
    type: UpdateEmployeeDto,
    description: 'Thông tin nhân viên cần cập nhật',
  })
  updateEmployee(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ) {
    return this.employeesService.updateEmployee(
      +id,
      user.id,
      updateEmployeeDto,
    );
  }

  // Xóa mềm thông tin nhân viên
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(RoleCode.MANAGER)
  @ApiOperation({
    summary: 'Xóa nhân viên',
    description: `
      API xóa nhân viên (soft delete):
      - Đánh dấu nhân viên là đã xóa
      - Không xóa thực sự khỏi database
      - Có thể khôi phục nếu cần
      
      **Quyền truy cập:** Chỉ quản lý chi nhánh
      **Lưu ý:** Chỉ có thể xóa nhân viên do quản lý hiện tại tạo ra
    `,
  })
  removeEmployee(@Param('id') id: string, @CurrentUser() user: JwtPayloadUser) {
    return this.employeesService.removeEmployee(+id, user);
  }
}
