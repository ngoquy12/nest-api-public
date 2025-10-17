import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  Query,
} from '@nestjs/common';
import { PositionsService } from './positions.service';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { SearchPositionDto } from './dto/search-position.dto';
import { PositionStatus } from './enums/position.enum';

@ApiTags('Quản lý vị trí làm việc (Positions)')
@Controller({ version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PositionsController {
  constructor(private readonly positionsService: PositionsService) {}

  @Post()
  @ApiOperation({
    summary: 'API thêm mới vị trí làm việc',
    description: 'Thêm mới vị trí làm việc cho người dùng hiện tại',
  })
  createPosition(@Body() createPositionDto: CreatePositionDto) {
    return this.positionsService.createPosition(createPositionDto);
  }

  @Get()
  @ApiOperation({
    summary: 'API lấy danh sách vị trí công việc của người dùng',
    description: 'Lấy danh sách vị trí công việc do người dùng hiện tại tạo',
  })
  getAllPositions() {
    return this.positionsService.getAllPositions();
  }

  @Get('search-pagination')
  @ApiOperation({
    summary: 'API tìm kiếm và phân trang danh sách vị trí làm việc',
    description:
      'Tìm kiếm vị trí theo từ khóa, lọc theo trạng thái, hỗ trợ phân trang và sắp xếp',
  })
  @ApiQuery({
    name: 'keyword',
    required: false,
    description: 'Từ khóa tìm kiếm theo tên vị trí hoặc mô tả',
    example: 'Developer',
  })
  @ApiQuery({
    name: 'positionStatus',
    required: false,
    description: 'Lọc theo trạng thái vị trí',
    enum: [PositionStatus.ACTIVE, PositionStatus.INACTIVE],
  })
  @ApiQuery({
    name: 'currentPage',
    required: false,
    description: 'Số trang hiện tại',
    example: 1,
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    description: 'Số lượng bản ghi trên mỗi trang',
    example: 10,
  })
  searchPositions(@Query() searchDto: SearchPositionDto) {
    return this.positionsService.searchPositions(searchDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'API lấy thông tin chi tiết vị trí làm việc',
    description:
      'Lấy thông tin chi tiết vị trí làm việc của người dùng hiện tại',
  })
  getPositionById(@Param('id') id: string) {
    return this.positionsService.getPositionById(+id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'API cập nhật thông tin vị trí làm việc',
    description: 'Cập nhật thông tin vị trí làm việc của người dùng hiện tại',
  })
  updatePosition(
    @Param('id') id: string,
    @Body() updatePositionDto: UpdatePositionDto,
  ) {
    return this.positionsService.updatePosition(+id, updatePositionDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'API xóa vị trí làm việc',
    description: 'Xóa vị trí làm việc của người dùng hiện tại',
  })
  removePosition(@Param('id') id: string) {
    return this.positionsService.removePosition(+id);
  }
}
