import { ImageResponse } from 'src/modules/images/types';
import { ProductStatus } from '../enums/product.status.enum';
import { CategoryResponse } from 'src/modules/categories/interfaces/category.interface';

export interface ProductResponse {
  id: number; // ID sản phẩm

  productCode?: string; // Mã sản phẩm

  productName?: string; // Tên sản phẩm

  price?: number; // Giá

  description?: string; // Mô tả chi tiết sản phẩm

  productStatus?: ProductStatus; // Trạng thái sản phẩm

  category?: CategoryResponse; // Danh mục sản phẩm
}

export interface ProductPaginationResponse extends ProductResponse {
  priceFull?: string;

  createdAt?: Date; // Ngày tạo

  updatedAt?: Date; // Ngày cập nhật

  images: ImageResponse[]; // Danh sách hình ảnh
}
