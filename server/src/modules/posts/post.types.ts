type userPostResponse = {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
};

type originalPostPreview = {
  id: string;
  title: string;
  content: string;
  galleries: { id: string; url: string; order?: number }[];
  user: userPostResponse;
};

export type postResponse = {
  id: string;
  title: string;
  content: string;
  user: userPostResponse;
  createdAt: Date;
  updatedAt: Date | null;
  galleries: { id: string; url: string; order?: number }[];
  totalLikes: number;
  totalComments: number;
  isLiked: boolean;
  isEditable: boolean;
  isFollowing: boolean;
  isSaved: boolean;
  isReported: boolean;
  isRepost: boolean;
  shareCount: number;
  caption: string | null;
  originalPost: originalPostPreview | null;
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

export type shareListResponse = {
  id: string;
  caption: string | null;
  createdAt: Date;
  user: userPostResponse;
};
