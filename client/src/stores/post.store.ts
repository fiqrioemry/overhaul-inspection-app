// src/stores/post.store.ts
import type { ReplyTo } from "@/types/posts.type";
import { create } from "zustand";

interface PostStore {
  target: string;
  isOpen: boolean;
  openDialog: (payload: { isOpen: boolean; target: string }) => void;

  // Edit post
  editTarget: string;
  reportTarget: string;
  isEditOpen: boolean;
  isReportOpen: boolean;
  openEditDialog: (payload: { isEditOpen: boolean; editTarget: string }) => void;
  openReportDialog: (payload: { isReportOpen: boolean; reportTarget: string }) => void;

  onReply: (payload: ReplyTo | null) => void;
  replyTo: ReplyTo | null;
}

export const usePostStore = create<PostStore>((set) => ({
  target: "",
  isOpen: false,
  openDialog: ({ isOpen, target }) => set({ isOpen, target }),

  // Edit post
  editTarget: "",
  isEditOpen: false,
  isReportOpen: false,
  reportTarget: "",
  openEditDialog: ({ isEditOpen, editTarget }) => set({ isEditOpen, editTarget }),
  openReportDialog: ({ isReportOpen, reportTarget }) => set({ isReportOpen, reportTarget }),
  replyTo: null,
  onReply: (payload: ReplyTo | null) => set({ replyTo: payload }),
}));
