type userPostResponse = {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
};

export type postResponse = {
  id: string;
  title: string;
  content: string;
  user: { id: string; name: string; username: string; avatar: string | null };
  createdAt: Date;
  galleries: { id: string; url: string; order?: number }[];
  totalLikes: number;
  totalComments: number;
  isLiked: boolean;
  isEditable: boolean;
  isFollowing: boolean;
  isSaved: boolean;
  isReported: boolean;
};

type commentResponse = {
  id: string;
  content: string;
  createdAt: Date;
  user: userPostResponse;
  totalReplies: number;
  totalLikes: number;
  isLiked: boolean;
  isEditable: boolean;
};

export type postDetailResponse = postResponse & {
  comments: commentResponse[];
  totalGalleries: number;
};

export type savedPostResponse = postResponse & {
  bookmarkId: string;
};
