import { Injectable } from '@nestjs/common';
import { Role } from 'src/modules/roles/entities/role.entity';
import { DataSource } from 'typeorm';

const defaultRoles: {
  roleCode: string;
  roleName: string;
  description: string;
}[] = [
  {
    roleCode: 'ADMIN',
    roleName: 'Quản trị viên',
    description:
      'Quản trị viên có quyền quản lý hệ thống nhưng bị giới hạn một số chức năng đặc biệt',
  },
  {
    roleCode: 'MANAGER',
    roleName: 'Quản lý',
    description: 'Quản lý các hoạt động kinh doanh, nhân sự và vận hành',
  },
  {
    roleCode: 'CUSTOMER',
    roleName: 'Khách hàng',
    description: 'Người dùng đã đăng ký tài khoản để mua sắm trên hệ thống',
  },
  {
    roleCode: 'EMPLOYEE',
    roleName: 'Nhân viên',
    description:
      'Nhân viên có quyền thực hiện các hoạt động kinh doanh, nhân sự và vận hành',
  },
];

@Injectable()
export class RoleSeederService {
  constructor(private readonly dataSource: DataSource) {}

  async seedRoles() {
    const roleRepo = this.dataSource.getRepository(Role);

    for (const role of defaultRoles) {
      const existing = await roleRepo.findOne({
        where: { roleName: role.roleName },
      });
      if (!existing) {
        await roleRepo.save(role);
      }
    }
  }
}
