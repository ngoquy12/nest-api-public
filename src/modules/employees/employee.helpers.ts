/**
 * @description Tách họ và tên thành họ và tên đệm, tên
 * @param fullName  Họ và tên đầy đủ
 * @example "Nguyễn Văn A" => ["Nguyễn Văn", "A"]
 * @returns Họ và tên đệm, tên
 * @author Ngọ Văn Quý (14/05/2025)
 */
export const extractName = (fullName: string): [string, string] => {
  const parts = fullName.trim().split(' ');
  return [parts.slice(0, -1).join(' '), parts.at(-1) || ''];
};
