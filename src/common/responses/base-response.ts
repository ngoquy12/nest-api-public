// Tạo các class response để trả về cho client
export class BaseResponse<T> {
  statusCode: number; // Mã trạng thái HTTP
  message: string; // Thông báo trả về
  data: T | T[]; // Dữ liệu trả về, có thể là một đối tượng hoặc mảng hoặc null
  error?: string; // Thông báo lỗi (nếu có)

  constructor(
    statusCode: number,
    message: string,
    data: T | T[],
    error?: string,
  ) {
    this.data = data;
    this.message = message;
    this.statusCode = statusCode;
    this.error = error;
  }
}

// Tạo class response cho các API có phân trang
export class PaginatedResponse<T> extends BaseResponse<T> {
  meta: {
    currentPage: number;
    pageSize: number;
    totalRecords: number;
    totalPages: number;
  };

  constructor(
    statusCode: number, // Mã trạng thái HTTP
    message: string, // Thông báo trả về
    data: T | T[], // Dữ liệu trả về
    meta: PaginatedResponse<T>['meta'], // Thông tin phân trang
  ) {
    super(statusCode, message, data);
    this.meta = meta;
  }
}
