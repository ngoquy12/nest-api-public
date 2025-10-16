export interface CommentResponse {
  id: number;
  content: string;
  status: string;
  parentId?: number;
  articleId: number;
  userId: number;
  likeCount: number;
  replyCount: number;
  createdAt: Date;
  updatedAt: Date;
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
  parent?: {
    id: number;
    content: string;
    user: {
      id: number;
      username: string;
      fullName?: string;
    };
  };
  replies?: CommentResponse[];
}

export interface CommentTreeResponse extends CommentResponse {
  replies: CommentTreeResponse[];
}
