export interface ArticleCategoryResponse {
  id: number;
  name: string;
  description?: string;
  image?: string;
  articleCount: number;
  createdAt: Date;
  updatedAt: Date;
}
