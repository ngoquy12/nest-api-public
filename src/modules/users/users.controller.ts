import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtPayloadUser } from '../auths/interfaces/jwt-payload-user';

@ApiTags('Quản lý người dùng (Users)')
@ApiBearerAuth()
@Controller({ version: '1' })
@UseGuards(JwtAuthGuard)
export class UsersController {
  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách người dùng',
    description:
      'API lấy danh sách tất cả người dùng với phân trang và tìm kiếm',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Số trang (default: 1)',
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    description: 'Số lượng/trang (default: 10)',
  })
  @ApiQuery({
    name: 'keyword',
    required: false,
    type: String,
    description: 'Tìm kiếm theo tên, email, phone',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách người dùng thành công',
    schema: {
      example: {
        statusCode: 200,
        message: 'Lấy danh sách người dùng thành công',
        data: [
          {
            id: 1,
            firstName: 'Nguyễn Văn',
            lastName: 'A',
            email: 'example@gmail.com',
            phoneNumber: '0898987871',
            status: 'ACTIVE',
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        pagination: {
          currentPage: 1,
          pageSize: 10,
          totalRecords: 100,
          totalPages: 10,
        },
      },
    },
  })
  async getUsers(
    @CurrentUser() user: JwtPayloadUser,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('keyword') keyword?: string,
  ) {
    // Implementation here
    return { message: 'Get users list' };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Lấy thông tin chi tiết người dùng',
    description: 'API lấy thông tin chi tiết của một người dùng theo ID',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID của người dùng' })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin người dùng thành công',
    schema: {
      example: {
        statusCode: 200,
        message: 'Lấy thông tin người dùng thành công',
        data: {
          id: 1,
          firstName: 'Nguyễn Văn',
          lastName: 'A',
          email: 'example@gmail.com',
          phoneNumber: '0898987871',
          status: 'ACTIVE',
          role: {
            id: 1,
            roleName: 'User',
            roleCode: 'USER',
          },
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy người dùng',
    schema: {
      example: {
        statusCode: 404,
        message: 'Không tìm thấy người dùng',
        error: 'Not Found',
      },
    },
  })
  async getUserById(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    // Implementation here
    return { message: `Get user by id: ${id}` };
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Cập nhật thông tin người dùng',
    description: 'API cập nhật thông tin của một người dùng',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID của người dùng' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        firstName: { type: 'string', example: 'Nguyễn Văn' },
        lastName: { type: 'string', example: 'A' },
        email: { type: 'string', example: 'example@gmail.com' },
        address: { type: 'string', example: '123 Main St' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật người dùng thành công',
    schema: {
      example: {
        statusCode: 200,
        message: 'Cập nhật người dùng thành công',
        data: {
          id: 1,
          firstName: 'Nguyễn Văn',
          lastName: 'A',
          email: 'example@gmail.com',
          phoneNumber: '0898987871',
          status: 'ACTIVE',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      },
    },
  })
  async updateUser(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: any,
  ) {
    // Implementation here
    return { message: `Update user: ${id}` };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Xóa người dùng',
    description: 'API xóa người dùng (soft delete)',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID của người dùng' })
  @ApiResponse({
    status: 200,
    description: 'Xóa người dùng thành công',
    schema: {
      example: {
        statusCode: 200,
        message: 'Xóa người dùng thành công',
        data: null,
      },
    },
  })
  async deleteUser(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    // Implementation here
    return { message: `Delete user: ${id}` };
  }
}
