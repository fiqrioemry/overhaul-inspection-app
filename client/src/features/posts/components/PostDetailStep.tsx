// src/features/posts/components/PostDetailStep.tsx
import { cn } from "@/lib/utils";
import { useFormContext } from "react-hook-form";
import { FormField } from "@/components/fields/FormField";
import type { CreatePostRequest } from "@/schemas/posts.schema";

export function PostDetailStep() {
  const {
    register,
    formState: { errors },
    watch,
  } = useFormContext<CreatePostRequest>();

  const content = watch("content") ?? "";

  return (
    <div className="flex flex-col gap-5">
      <FormField label="Title" required error={errors.title?.message}>
        <input
          {...register("title")}
          placeholder="Write Post Title..."
          className={cn(
            "w-full px-3.5 py-2.5 rounded-xl text-sm bg-muted/50 border border-transparent transition-all outline-none",
            "focus:border-primary/40 focus:bg-background placeholder:text-muted-foreground/60",
            errors.title && "border-destructive/50 focus:border-destructive",
          )}
        />
      </FormField>

      <FormField label="Description" required hint={`${content.length} characters · minimum 10`} error={errors.content?.message}>
        <textarea
          {...register("content")}
          placeholder="Tell something about this post..."
          rows={5}
          className={cn(
            "w-full px-3.5 py-2.5 rounded-xl text-sm bg-muted/50 border border-transparent transition-all outline-none resize-none",
            "focus:border-primary/40 focus:bg-background placeholder:text-muted-foreground/60",
            errors.content && "border-destructive/50 focus:border-destructive",
          )}
        />
      </FormField>
    </div>
  );
}
