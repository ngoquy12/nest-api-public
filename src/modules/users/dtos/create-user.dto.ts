import { Gender } from 'src/common/enums/gender.enum';
import { UserStatus } from 'src/modules/users/enums/user-status.enum';

export class CreateUserDto {
  userName: string;

  fullName: string;

  dob: Date;

  gender: Gender;

  email: string;

  password: string;

  avatar: string;

  phoneNumber: string;

  status: UserStatus;

  address: string;
}
