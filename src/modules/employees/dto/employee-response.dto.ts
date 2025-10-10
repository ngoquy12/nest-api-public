import { RoleCode } from 'src/common/enums/role-code.enum';
import { EmployeeStatus } from '../enums/employee-status';

export class EmployeeResponseDto {
  id: number;

  employeeCode: string;

  employeeName: string;

  phoneNumber: string;

  gender: string;

  email: string;

  dateBirth: string;

  createdAt: string;

  address: string;

  employeeStatus: EmployeeStatus;

  positionId: number;

  positionName: string;

  roleCode: RoleCode;

  roleName: string;

  avatar?: {
    id: number;
    url: string;
    publicId: number;
  };
}
