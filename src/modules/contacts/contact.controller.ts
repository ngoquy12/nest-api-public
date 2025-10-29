import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Patch,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ContactService } from './contact.service';
import { CreateContactDto, UpdateContactDto } from './dto/contact.dto';
import { Contact } from './entities/contact.entity';
import { ContactResponseDto } from './dto/contact-response.dto';
import { BaseResponse } from 'src/common/responses/base-response';

@ApiTags('Danh bạ (Contacts)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ version: '1' })
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post('contacts')
  @ApiOperation({ summary: 'Thêm mới một liên hệ' })
  @ApiBody({ type: CreateContactDto })
  @ApiCreatedResponse({ description: 'Tạo liên hệ thành công', type: Contact })
  async create(
    @Body() dto: CreateContactDto,
  ): Promise<BaseResponse<ContactResponseDto>> {
    return await this.contactService.create(dto);
  }

  @Get('contacts')
  @ApiOperation({ summary: 'Lấy danh sách tất cả liên hệ' })
  @ApiOkResponse({ description: 'Danh sách liên hệ', type: [Contact] })
  async findAll() {
    return await this.contactService.findAll();
  }

  @Get('contacts/blocked')
  @ApiOperation({ summary: 'Lấy danh sách liên hệ bị chặn' })
  @ApiOkResponse({ description: 'Danh sách bị chặn', type: [Contact] })
  async findBlocked() {
    return await this.contactService.findBlocked();
  }

  @Get('contacts/:id')
  @ApiOperation({ summary: 'Lấy chi tiết một liên hệ theo id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Chi tiết liên hệ', type: Contact })
  async findOne(@Param('id') id: string) {
    return await this.contactService.findOne(+id);
  }

  @Put('contacts/:id')
  @ApiOperation({ summary: 'Cập nhật thông tin một liên hệ' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateContactDto })
  @ApiOkResponse({ description: 'Liên hệ đã cập nhật', type: Contact })
  async update(@Param('id') id: string, @Body() dto: UpdateContactDto) {
    return await this.contactService.update(+id, dto);
  }

  @Patch('contacts/:id/toggle-block')
  @ApiOperation({ summary: 'Đảo ngược trạng thái chặn của liên hệ' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Liên hệ sau khi cập nhật', type: Contact })
  async toggleBlock(@Param('id') id: string) {
    return await this.contactService.toggleBlock(+id);
  }

  @Delete('contacts/:id')
  @ApiOperation({ summary: 'Xóa một liên hệ theo id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({
    schema: { example: { message: 'Contact deleted successfully' } },
  })
  async remove(@Param('id') id: string) {
    await this.contactService.remove(+id);
    return { message: 'Contact deleted successfully' };
  }

  @Get('contacts/search')
  @ApiOperation({
    summary: 'Tìm kiếm liên hệ theo tên hoặc số điện thoại (có phân trang)',
  })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Từ khóa tìm kiếm theo tên hoặc số điện thoại',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    schema: { default: 1, type: 'number' },
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    schema: { default: 10, type: 'number' },
  })
  async search(
    @Query('q') q: string = '',
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return await this.contactService.search(
      q,
      Number(page) || 1,
      Number(limit) || 10,
    );
  }
}
