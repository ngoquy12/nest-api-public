import { Gender } from '../enums/gender.enum';
import { UserStatus } from '../../modules/users/enums/user-status.enum';

/**
 * Utility function để convert enum values về tiếng Việt cho change logs
 */
export class EnumConverterUtil {
  /**
   * Convert Gender enum về tiếng Việt
   */
  static convertGender(gender: Gender): string {
    switch (gender) {
      case Gender.MALE:
        return 'Nam';
      case Gender.FEMALE:
        return 'Nữ';
      default:
        return 'Khác';
    }
  }

  /**
   * Convert UserStatus enum về tiếng Việt
   */
  static convertUserStatus(status: UserStatus): string {
    switch (status) {
      case UserStatus.ACTIVE:
        return 'Đang hoạt động';
      case UserStatus.INACTIVE:
        return 'Không hoạt động';
      default:
        return status;
    }
  }

  /**
   * Convert bất kỳ enum nào về tiếng Việt dựa trên key-value mapping
   */
  static convertEnumValue<T extends Record<string, string>>(
    value: string,
    enumObject: T,
    vietnameseMapping?: Record<string, string>,
  ): string {
    if (vietnameseMapping && vietnameseMapping[value]) {
      return vietnameseMapping[value];
    }

    // Nếu không có mapping, trả về value gốc
    return value;
  }
}
