import * as dayjs from 'dayjs';

/**
 * Hàm kiểm tra xem ngày có cách hiện tại quá 30 ngày hay không
 * @param date - Ngày cần kiểm tra, có thể là chuỗi hoặc đối tượng Date
 * @returns {boolean} true nếu ngày cách hiện tại quá 30 ngày, ngược lại false
 * @author NVQUY (31/07/2025)
 */
export function isMoreThan30DaysInPast(date: string | Date): boolean {
  const diff = dayjs().diff(dayjs(date), 'day');
  return diff > 30;
}
