/**
 * Format tiền tệ theo locale và currency
 */
export function formatMoneyByUnit(amount: number): string {
  return amount.toLocaleString('vi-VN') + ' VNĐ';
}

/**
 *  @description Hàm định dạng giá tiền theo đơn vị tiền tệ
 *  @param price Giá tiền cần định dạng, có thể là số hoặc chuỗi
 * @param unit Đơn vị tiền tệ, có thể là 'USD' hoặc 'VND'
 * @return Giá tiền đã được định dạng theo đơn vị tiền tệ
 * @author NVQUY(12/06/2025)
 * @example formatPrice(1234567, 'VND') // "1.234.567 đ"
 */
export const formatPrice = (price: number | string, unit: string) => {
  const numPrice = Number(price);
  if (isNaN(numPrice)) return '0';

  const formatter = new Intl.NumberFormat(unit === 'USD' ? 'en-US' : 'vi-VN', {
    style: 'currency',
    currency: unit === 'USD' ? 'USD' : 'VND',
    minimumFractionDigits: unit === 'USD' ? 2 : 0,
    maximumFractionDigits: unit === 'USD' ? 2 : 0,
  });

  return formatter.format(numPrice);
};

/**
 * @description Chuyển đổi giá trị thành số với định dạng phù hợp
 * @param value Giá trị cần chuyển đổi
 * @returns {number} Giá trị đã được định dạng
 * @author Ngọ Văn Quý
 * @date 09/06/2025
 */
export const formatFromDecimalToNumber = (value: string | number): number => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return Number.isInteger(num) ? Math.trunc(num) : parseFloat(num.toFixed(2));
};
