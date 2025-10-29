import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Contact, ContactTag } from './entities/contact.entity';
import { CreateContactDto, UpdateContactDto } from './dto/contact.dto';
import {
  BaseResponse,
  PaginatedResponse,
} from 'src/common/responses/base-response';
import { ContactResponseDto } from './dto/contact-response.dto';

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(Contact)
    private contactRepository: Repository<Contact>,
  ) {}

  private toResponse(contact: Contact): ContactResponseDto {
    const tagTextMap: Record<ContactTag, string> = {
      [ContactTag.FAMILY]: 'Gia đình',
      [ContactTag.FRIEND]: 'Bạn bè',
      [ContactTag.COLLEAGUE]: 'Đồng nghiệp',
      [ContactTag.OTHER]: 'Khác',
    };
    return {
      id: contact.id,
      contactName: contact.contactName,
      phoneNumber: contact.phoneNumber,
      tag: contact.tag,
      tagText: tagTextMap[contact.tag] ?? 'Khác',
      isBlocked: contact.isBlocked,
      createdAt: contact.createdAt,
    };
  }

  async create(
    dto: CreateContactDto,
  ): Promise<BaseResponse<ContactResponseDto>> {
    const exists = await this.contactRepository.findOne({
      where: { phoneNumber: dto.phoneNumber },
    });
    if (exists) {
      throw new BadRequestException('Số liên hệ đã tồn tại');
    }
    const contact = this.contactRepository.create({ ...dto });
    const contactSaved = await this.contactRepository.save(contact);
    return new BaseResponse(
      HttpStatus.CREATED,
      'Thêm liên hệ thành công',
      this.toResponse(contactSaved),
    );
  }

  async findAll(): Promise<BaseResponse<ContactResponseDto>> {
    const contacts = await this.contactRepository.find({
      order: { createdAt: 'DESC' },
      select: ['id', 'contactName', 'phoneNumber', 'isBlocked', 'tag'],
    });

    return new BaseResponse(
      HttpStatus.OK,
      'Lấy danh sách liên hệ thành công',
      contacts as unknown as ContactResponseDto[],
    );
  }

  async findBlocked(): Promise<BaseResponse<ContactResponseDto>> {
    const contacts = await this.contactRepository.find({
      where: { isBlocked: true },
      order: { createdAt: 'DESC' },
      select: ['id', 'contactName', 'phoneNumber', 'isBlocked', 'tag'],
    });
    return new BaseResponse(
      HttpStatus.OK,
      'Lấy danh sách liên hệ bị chặn thành công',
      contacts as unknown as ContactResponseDto[],
    );
  }

  async findOne(id: number): Promise<BaseResponse<ContactResponseDto>> {
    const contact = await this.contactRepository.findOne({ where: { id } });
    if (!contact) {
      throw new NotFoundException('Không tìm thấy thông tin liên hệ');
    }
    return new BaseResponse(
      HttpStatus.OK,
      'Lấy chi tiết liên hệ thành công',
      this.toResponse(contact),
    );
  }

  async update(
    id: number,
    dto: UpdateContactDto,
  ): Promise<BaseResponse<ContactResponseDto>> {
    const contact = await this.contactRepository.findOne({ where: { id } });
    if (!contact) {
      throw new NotFoundException('Không tìm thấy thông tin liên hệ');
    }
    if (dto.phoneNumber) {
      const dup = await this.contactRepository.findOne({
        where: { phoneNumber: dto.phoneNumber, id: Not(id) },
      });
      if (dup) {
        throw new BadRequestException('Số liên hệ đã tồn tại');
      }
    }
    Object.assign(contact, dto);
    const saved = await this.contactRepository.save(contact);
    return new BaseResponse(
      HttpStatus.OK,
      'Cập nhật liên hệ thành công',
      this.toResponse(saved),
    );
  }

  async toggleBlock(id: number): Promise<BaseResponse<ContactResponseDto>> {
    const contact = await this.contactRepository.findOne({ where: { id } });
    if (!contact) {
      throw new NotFoundException('Không tìm thấy thông tin liên hệ');
    }
    contact.isBlocked = !contact.isBlocked;
    const saved = await this.contactRepository.save(contact);
    return new BaseResponse(
      HttpStatus.OK,
      'Cập nhật trạng thái chặn thành công',
      this.toResponse(saved),
    );
  }

  async remove(id: number): Promise<BaseResponse<null>> {
    const contact = await this.contactRepository.findOne({ where: { id } });
    if (!contact) {
      throw new NotFoundException('Không tìm thấy thông tin liên hệ');
    }
    await this.contactRepository.remove(contact);
    return new BaseResponse(HttpStatus.OK, 'Xóa liên hệ thành công', null);
  }

  async search(
    q: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResponse<ContactResponseDto>> {
    const keyword = (q || '').trim();
    const qb = this.contactRepository.createQueryBuilder('c');

    if (keyword) {
      qb.where('c.contactName ILIKE :kw OR c.phoneNumber ILIKE :kw', {
        kw: `%${keyword}%`,
      });
    }

    qb.orderBy('c.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();
    const data = items.map((c) => this.toResponse(c));

    return new PaginatedResponse<ContactResponseDto>(
      HttpStatus.OK,
      'Tìm kiếm liên hệ thành công',
      data,
      {
        currentPage: page,
        pageSize: limit,
        totalRecords: total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    );
  }
}
