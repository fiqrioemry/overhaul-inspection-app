import type { User } from "@/types/users.type";

export interface Replies {
  id: string;
  parentId?: string;
  content: string;
  createdAt: Date;
  user: User;
  totalLikes: number;
  isLiked: boolean;
  isEditable: boolean;
  isEdited?: boolean;
  lastEditedAt?: Date;
}

export interface Comments {
  id: string;
  content: string;
  createdAt: Date;
  user: User;
  isLiked: boolean;
  isEditable: boolean;
  replies: Replies[];
  totalReplies: number;
  totalLikes: number;
  lastEditedAt: Date;
  isEdited: boolean;
}
