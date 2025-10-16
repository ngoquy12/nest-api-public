export interface LikeResponse {
  id: number;
  userId: number;
  articleId?: number;
  commentId?: number;
  type: string;
  createdAt: Date;
  user?: {
    id: number;
    username: string;
    fullName?: string;
    avatar?: string;
  };
  article?: {
    id: number;
    title: string;
    slug: string;
  };
  comment?: {
    id: number;
    content: string;
  };
}

export interface LikeStatsResponse {
  totalLikes: number;
  likeTypes: {
    type: string;
    count: number;
  }[];
  userLiked: boolean;
  userLikeType?: string;
}
