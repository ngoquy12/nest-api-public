import * as bcrypt from 'bcrypt';

// Hàm hashPassword cho mật khẩu
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

// Hàm hashToken cho refreshToken
export const hashToken = async (token: string): Promise<string> => {
  const saltRounds = 10;
  return bcrypt.hash(token, saltRounds);
};

// So sánh mật khẩu
export const comparePassword = async (
  password: string,
  hashedPassword: string,
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

// Hàm so sánh token
export const compareToken = async (
  token: string,
  hashedToken: string,
): Promise<boolean> => {
  return bcrypt.compare(token, hashedToken);
};
