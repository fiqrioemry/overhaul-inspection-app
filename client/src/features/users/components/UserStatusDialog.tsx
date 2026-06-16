// src/features/users/components/UserStatusDialog.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import SelectField from "@/components/fields/SelectField";
import { updateUserStatusSchema } from "@/schemas/users.schema";
import type { UpdateUserStatusFormValues } from "@/schemas/users.schema";
import { useUpdateUserStatus } from "@/features/users/users.query";
import type { UserDetail } from "@/features/users/users.api";

const STATUS_OPTIONS = [
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
  { label: "Banned", value: "BANNED" },
];

interface UserStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserDetail;
}

export default function UserStatusDialog({ open, onOpenChange, user }: UserStatusDialogProps) {
  const mutation = useUpdateUserStatus();

  const form = useForm<UpdateUserStatusFormValues>({
    resolver: zodResolver(updateUserStatusSchema),
    defaultValues: { status: "ACTIVE" },
  });

  useEffect(() => {
    if (user) form.reset({ status: user.status });
  }, [user, open]);

  function onSubmit(values: UpdateUserStatusFormValues) {
    if (!user) return;
    mutation.mutate({ id: user.id, data: values }, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="xl:h-auto! xl:w-95!">
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 p-4">
          <DialogHeader>
            <DialogTitle>Change Status — {user?.name}</DialogTitle>
          </DialogHeader>
          <SelectField control={form.control} name="status" label="Status" options={STATUS_OPTIONS} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Update Status"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
