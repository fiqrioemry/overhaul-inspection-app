// src/components/common/Pagination.tsx
import { Button } from "@/components/ui/button";
import type { Meta } from "@/types/pagination.type";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  meta: Meta;
  onPageChange: (page: number) => void;
}

export default function Pagination({ meta, onPageChange }: PaginationProps) {
  const { page, limit, total, totalPages, hasNextPage, hasPreviousPage } = meta;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visiblePages = pages.filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1);

  return (
    <div className="flex items-center justify-between gap-4 pt-4">
      <p className="text-sm text-muted-foreground">
        {total === 0 ? "No results" : `Showing ${from}–${to} of ${total}`}
      </p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon-sm" onClick={() => onPageChange(page - 1)} disabled={!hasPreviousPage}>
          <ChevronLeft />
        </Button>

        {visiblePages.map((p, idx) => {
          const prev = visiblePages[idx - 1];
          const showEllipsis = prev !== undefined && p - prev > 1;
          return (
            <span key={p} className="flex items-center gap-1">
              {showEllipsis && <span className="px-1 text-muted-foreground">…</span>}
              <Button variant={p === page ? "default" : "outline"} size="icon-sm" onClick={() => onPageChange(p)}>
                {p}
              </Button>
            </span>
          );
        })}

        <Button variant="outline" size="icon-sm" onClick={() => onPageChange(page + 1)} disabled={!hasNextPage}>
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
