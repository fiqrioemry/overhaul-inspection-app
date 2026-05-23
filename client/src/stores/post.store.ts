import { create } from "zustand";

interface PostStore {
  target: string;
  isOpen: boolean;
  openDialog: (payload: { isOpen: boolean; target: string }) => void;
}

export const usePostStore = create<PostStore>((set) => ({
  target: "",
  isOpen: false,

  openDialog: ({ isOpen, target }) =>
    set({
      isOpen,
      target,
    }),
}));
