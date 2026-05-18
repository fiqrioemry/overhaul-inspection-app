type userPostResponse = {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
};

type postGalleryResponse = {
  id: string;
  url: string;
};

export type postResponse = {
  id: string;
  user: userPostResponse;
  title: string;
  content: string;
  createdAt: Date;
  galleries: postGalleryResponse[];
  totalLikes: number;
  totalComments: number;
  isLiked: boolean;
  isEditable: boolean;
  isFollowing?: boolean;
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
