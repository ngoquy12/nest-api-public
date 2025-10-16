export interface ArticleCategoryResponse {
  id: number;
  categoryName: string;
  categoryDescription?: string;
  categoryStatus: string;
  categorySlug?: string;
  categoryImage?: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  articleCount?: number;
}
