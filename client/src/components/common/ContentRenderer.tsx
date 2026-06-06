// src/components/common/ContentRenderer.tsx
// Renders post/comment content with clickable #hashtag and @mention tokens
import { Link } from "react-router-dom";

interface ContentRendererProps {
  content: string;
  className?: string;
}

export default function ContentRenderer({ content, className }: ContentRendererProps) {
  // Split on #hashtag and @mention tokens, keep delimiters via capture group
  const parts = content.split(/(#[a-zA-Z0-9_]+|@[a-zA-Z0-9_.]+)/g);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (/^#[a-zA-Z0-9_]+$/.test(part)) {
          return (
            <Link
              key={i}
              to={`/hashtag/${encodeURIComponent(part.slice(1))}`}
              className="text-primary hover:underline font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </Link>
          );
        }

        if (/^@[a-zA-Z0-9_.]+$/.test(part)) {
          return (
            <Link
              key={i}
              to={`/profile/${part.slice(1)}`}
              className="text-primary hover:underline font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </Link>
          );
        }

        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}
