import { userResponse } from "../users/user.types";

type commentsResponse = {
  id: string;
  content: string;
  createdAt: Date;
  user: userResponse;
  isLiked: boolean;
  isEditable: boolean;
  replies: repliesResponse[];
  totalReplies: number;
  totalLikes: number;
  lastEditedAt: Date;
  isEdited: boolean;
};

type repliesResponse = {
  id: string;
  parentId?: string;
  content: string;
  createdAt: Date;
  user: userResponse;
  totalLikes: number;
  isLiked: boolean;
  isEditable: boolean;
  isEdited?: boolean;
  lastEditedAt?: Date;
};

export { commentsResponse, repliesResponse };
