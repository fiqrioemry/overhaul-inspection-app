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

export interface PostHashtag {
  id: string;
  name: string;
}

export interface PostMention {
  id: string;
  username: string;
  avatar: string | null;
}

export interface Hashtag {
  id: string;
  name: string;
  postCount: number;
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
  mentions: PostMention[];
}

export interface PostDetail extends Post {
  title: string;
  comments: PostComment[];
}

export interface OriginalPost {
  id: string;
  title: string;
  content: string;
  user: PostUser;
  galleries: PostGallery[];
}

export interface Post {
  id: string;
  user: PostUser;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string | null;
  galleries: PostGallery[];
  totalLikes: number;
  totalComments: number;
  isLiked: boolean;
  isEditable: boolean;
  isFollowing: boolean;
  isSaved: boolean;
  isReported: boolean;
  hashtags: PostHashtag[];
  mentions: PostMention[];
  isRepost: boolean;
  shareCount: number;
  caption: string | null;
  originalPost: OriginalPost | null;
}

export interface ShareListItem {
  id: string;
  caption: string | null;
  createdAt: string;
  user: PostUser;
}
