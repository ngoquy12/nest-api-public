/**
 * @description Hàm tạo mật khẩu ngẫu nhiên với độ dài mặc định là 10 ký tự,
 * có chứa ít nhất 1 chữ thường, 1 chữ hoa, 1 số và 1 ký tự đặc biệt
 * @param length Độ dài mặc định của mật khẩu
 * @returns Mật khẩu ngẫu nhiên
 * @example aB3#cD4eF
 * @author Ngọ Văn Quý
 * @date 11/05/2025
 * @modifiedBy
 */
export function generateSecurePassword(length = 10): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const all = lowercase + uppercase + digits + special;

  if (length < 4) {
    throw new Error('Mật khẩu phải có ít nhất 4 ký tự để đảm bảo đủ yêu cầu');
  }

  let password = '';
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += digits[Math.floor(Math.random() * digits.length)];
  password += special[Math.floor(Math.random() * special.length)];

  for (let i = 4; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}
