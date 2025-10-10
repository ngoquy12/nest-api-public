import { RoleCode } from 'src/common/enums/role-code.enum';

export interface JwtPayloadUser {
  id: number;
  deviceId?: string;
  role: {
    id: number;
    name: string;
    code: RoleCode;
  };
}
