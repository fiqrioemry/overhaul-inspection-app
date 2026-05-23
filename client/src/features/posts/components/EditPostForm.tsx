// src/features/posts/components/EditPostForm.tsx
import { X } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { Post } from "@/types/posts.type";
import { zodResolver } from "@hookform/resolvers/zod";
import LongTextField from "@/components/fields/LongTextField";
import { useUpdatePost } from "@/features/posts/posts.query";
import ShortTextField from "@/components/fields/ShortTextField";
import { updatePostRequest, type UpdatePostRequest } from "@/schemas/posts.schema";

interface EditPostFormProps {
  post: Post;
  onSuccess: () => void;
  onClose: () => void;
  isPendingChange?: (isPending: boolean) => void;
}

export default function EditPostForm({ post, onSuccess, onClose, isPendingChange }: EditPostFormProps) {
  const { mutateAsync: updatePost, isPending } = useUpdatePost(post.id);

  isPendingChange?.(isPending);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, isValid },
  } = useForm<UpdatePostRequest>({
    resolver: zodResolver(updatePostRequest),
    defaultValues: {
      title: post.title ?? "",
      content: post.content ?? "",
    },
  });

  useEffect(() => {
    reset({
      title: post.title ?? "",
      content: post.content ?? "",
    });
  }, [post.id]);

  async function onSubmit(data: UpdatePostRequest) {
    await updatePost(data);
    onSuccess();
  }

  const hasImages = post.galleries && post.galleries.length > 0;

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <h2 className="text-sm font-semibold">Edit Post</h2>
        <div className="flex items-center gap-2">
          <button type="button" onClick={handleSubmit(onSubmit)} disabled={isPending || !isDirty || !isValid} className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors disabled:opacity-50">
            {isPending ? "Saving..." : "Save"}
          </button>
          <button type="button" onClick={onClose} disabled={isPending} className="flex size-7 items-center justify-center rounded-full hover:bg-muted transition-colors disabled:opacity-50">
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Preview gambar */}
        {hasImages && (
          <div className="flex-1 min-w-0 bg-black flex items-center justify-center">
            <img src={post.galleries[0].url} alt={post.title} className="w-full h-full object-contain" />
          </div>
        )}

        {/* Fields */}
        <div className={hasImages ? "w-80 xl:w-96 shrink-0 flex flex-col overflow-y-auto border-l border-border" : "flex-1 flex flex-col overflow-y-auto"}>
          <div className="p-5 flex flex-col gap-4">
            <ShortTextField control={control} name="title" label="Title" placeholder="Write a title..." />
            <LongTextField control={control} name="content" label="Content" placeholder="Write a caption..." rows={5} maxLength={2200} className="min-h-60" />
          </div>
        </div>
      </div>
    </>
  );
}
