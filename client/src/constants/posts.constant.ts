export const POST_ENDPOINTS = {
  followingPosts: "/posts/following",
  publicPosts: "/posts/public",
  getUserPosts: "/posts/:userId/user",
  getUserSavedPosts: "/posts/saved",
  getPostDetails: "/posts/:postId",
  reportPost: "/posts/:postId/report",
  createPost: "/posts",
  updatePost: "/posts/:postId",
  likePost: "/posts/:postId/like",
  unlikePost: "/posts/:postId/unlike",
  savePost: "/posts/:postId/save",
  unsavePost: "/posts/:postId/unsave",
} as const;

export type AspectRatio = "1:1" | "4:5" | "1.91:1" | "16:9";

interface RatioOption {
  label: string;
  value: AspectRatio;
  ratio: number;
  outputW: number;
  outputH: number;
}

export const RATIO_OPTIONS: RatioOption[] = [
  { label: "1:1", value: "1:1", ratio: 1, outputW: 1080, outputH: 1080 },
  { label: "4:5", value: "4:5", ratio: 4 / 5, outputW: 1080, outputH: 1350 },
  { label: "1.91:1", value: "1.91:1", ratio: 1.91, outputW: 1080, outputH: 566 },
  { label: "16:9", value: "16:9", ratio: 16 / 9, outputW: 1920, outputH: 1080 },
];

export interface CropState {
  x: number;
  y: number;
}
