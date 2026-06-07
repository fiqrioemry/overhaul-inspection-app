// src/features/comments/components/CommentOptionMenu.tsx
import { useState } from "react";
import { MoreHorizontal, Trash2, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDeleteComment } from "@/features/comments/comments.query";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface CommentOptionMenuProps {
  commentId: string;
  isEditable: boolean;
}

export default function CommentOptionMenu({ commentId, isEditable }: CommentOptionMenuProps) {
  const { t } = useTranslation(["post"]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const deleteComment = useDeleteComment(commentId);

  if (!isEditable) return null;

  const handleDelete = async () => {
    await deleteComment.mutateAsync();
    setShowDeleteDialog(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-muted transition-all" aria-label={t("post:commentOptions")}>
            <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            {t("post:deleteComment")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("post:deleteCommentTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("post:deleteCommentDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("post:cancelButton")}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={deleteComment.isPending}>
              {deleteComment.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("post:deleteCommentPending")}
                </>
              ) : (
                t("post:deleteCommentConfirm")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
