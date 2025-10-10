import { CategoryStatus } from '../enums/category-status.enum';

// Response interface for Category
export interface CategoryResponse {
  id?: number;
  categoryName?: string;
  categoryDescription?: string;
  categoryStatus?: CategoryStatus;
  createdAt?: Date;
}

// Detailed response interface for Category, extending the basic response
export interface CategoryDetailResponse extends CategoryResponse {
  statusText?: string;
}
