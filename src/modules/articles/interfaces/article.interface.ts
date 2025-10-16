export interface ArticleResponse {
  id: number;
  title: string;
  summary: string;
  content: string;
  slug: string;
  featuredImage?: string;
  status: string;
  visibility: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  tags?: string[];
  publishedAt?: Date;
  categoryId: number;
  authorId: number;
  createdAt: Date;
  updatedAt: Date;
  category?: {
    id: number;
    categoryName: string;
    categorySlug: string;
  };
  author?: {
    id: number;
    username: string;
    email: string;
    fullName?: string;
  };
}

export interface ArticleDetailResponse extends ArticleResponse {
  category: {
    id: number;
    categoryName: string;
    categorySlug: string;
    categoryDescription?: string;
  };
  author: {
    id: number;
    username: string;
    email: string;
    fullName?: string;
    avatar?: string;
  };
}
