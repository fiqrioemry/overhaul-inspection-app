// src/features/posts/components/PostDetailStep.tsx
import { useFormContext } from "react-hook-form";
import { Field, FieldError } from "@/components/ui/field";
import type { CreatePostRequest } from "@/schemas/posts.schema";

const MAX_TITLE = 100;
const MAX_CONTENT = 2000;

export function PostDetailStep() {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<CreatePostRequest>();

  const titleLen = watch("title")?.length ?? 0;
  const contentLen = watch("content")?.length ?? 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Title */}
      <Field data-invalid={!!errors.title}>
        <div className="relative">
          <input
            {...register("title")}
            id="title"
            placeholder="Add a title…"
            maxLength={MAX_TITLE}
            autoComplete="off"
            className={[
              "peer w-full bg-transparent text-sm font-semibold placeholder:text-muted-foreground/50",
              "border-b border-border pb-2 pt-0 outline-none transition-colors",
              "focus:border-primary",
              errors.title ? "border-destructive" : "",
            ].join(" ")}
          />
          <span className={["absolute right-0 bottom-2.5 text-[10px] tabular-nums transition-colors", titleLen >= MAX_TITLE ? "text-destructive" : "text-muted-foreground/50"].join(" ")}>
            {titleLen}/{MAX_TITLE}
          </span>
        </div>
        <FieldError errors={[errors.title]} />
      </Field>

      {/* Caption / Content */}
      <Field data-invalid={!!errors.content}>
        <div className="relative">
          <textarea
            {...register("content")}
            id="content"
            placeholder="Write a caption…"
            maxLength={MAX_CONTENT}
            rows={12}
            className={[
              "w-full resize-none bg-transparent text-sm leading-relaxed",
              "placeholder:text-muted-foreground/50 outline-none",
              "scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent",
              errors.content ? "text-destructive" : "",
            ].join(" ")}
          />

          <div className="flex items-center justify-between pt-1 border-t border-border/50">
            <FieldError errors={[errors.content]} />
            <span className={["ml-auto text-[10px] tabular-nums shrink-0", contentLen >= MAX_CONTENT ? "text-destructive" : "text-muted-foreground/50"].join(" ")}>
              {contentLen}/{MAX_CONTENT}
            </span>
          </div>
        </div>
      </Field>
    </div>
  );
}
