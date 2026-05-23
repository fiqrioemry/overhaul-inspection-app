export interface ReplyTo {
  commentId: string;
  username: string;
}

export interface PostUser {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
}

export interface PostGallery {
  id: string;
  url: string;
  order: string;
}

export interface PostComment {
  id: string;
  content: string;
  createdAt: string;
  user: PostUser;
  totalReplies: number;
  totalLikes: number;
  isLiked: boolean;
  isEditable: boolean;
}

export interface PostDetail extends Post {
  title: string;
  comments: PostComment[];
}

export interface Post {
  id: string;
  user: PostUser;
  title: string;
  content: string;
  createdAt: string;
  galleries: PostGallery[];
  totalLikes: number;
  totalComments: number;
  isLiked: boolean;
  isEditable: boolean;
  isFollowing: boolean;
  isSaved: boolean;
  isReported: boolean;
}
