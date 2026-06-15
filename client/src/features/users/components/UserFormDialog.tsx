// src/features/users/components/UserFormDialog.tsx
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ShortTextField from "@/components/fields/ShortTextField";
import SelectField from "@/components/fields/SelectField";
import PasswordField from "@/components/fields/PasswordField";
import SwitchField from "@/components/fields/SwitchField";
import { createUserSchema, updateUserSchema } from "@/schemas/users.schema";
import type { CreateUserFormValues, UpdateUserFormValues } from "@/schemas/users.schema";
import { useCreateUser, useUpdateUser } from "@/features/users/users.query";
import type { UserDetail } from "@/features/users/users.api";

const ROLE_OPTIONS = [
  { label: "User", value: "USER" },
  { label: "Inspector", value: "INSPECTOR" },
  { label: "Admin", value: "ADMIN" },
  { label: "Super Admin", value: "SUPER_ADMIN" },
];

const STATUS_OPTIONS = [
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
  { label: "Banned", value: "BANNED" },
];

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserDetail;
}

export default function UserFormDialog({ open, onOpenChange, user }: UserFormDialogProps) {
  const isEdit = Boolean(user);
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();

  const createForm = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: "", email: "", role: "USER", status: "ACTIVE", password: "", isVerified: false },
  });

  const editForm = useForm<UpdateUserFormValues>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: { name: "", email: "", role: "USER" },
  });

  useEffect(() => {
    if (user && isEdit) {
      editForm.reset({ name: user.name, email: user.email, role: user.role });
    } else {
      createForm.reset({ name: "", email: "", role: "USER", status: "ACTIVE", password: "", isVerified: false });
    }
  }, [user, open]);

  function onCreateSubmit(values: CreateUserFormValues) {
    const payload = { ...values, password: values.password || undefined };
    createMutation.mutate(payload, {
      onSuccess: () => onOpenChange(false),
    });
  }

  function onEditSubmit(values: UpdateUserFormValues) {
    if (!user) return;
    updateMutation.mutate({ id: user.id, data: values }, {
      onSuccess: () => onOpenChange(false),
    });
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isEdit) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="flex flex-col gap-4 p-6">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            <ShortTextField control={editForm.control} name="name" label="Name" placeholder="Full name" />
            <ShortTextField control={editForm.control} name="email" label="Email" type="email" placeholder="email@example.com" />
            <SelectField control={editForm.control} name="role" label="Role" options={ROLE_OPTIONS} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="flex flex-col gap-4 p-6">
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
          </DialogHeader>
          <ShortTextField control={createForm.control} name="name" label="Name" placeholder="Full name" />
          <ShortTextField control={createForm.control} name="email" label="Email" type="email" placeholder="email@example.com" />
          <SelectField control={createForm.control} name="role" label="Role" options={ROLE_OPTIONS} />
          <SelectField control={createForm.control} name="status" label="Status" options={STATUS_OPTIONS} />
          <PasswordField control={createForm.control} name="password" label="Password" placeholder="Min 6 characters" autoComplete="new-password" />
          <SwitchField control={createForm.control} name="isVerified" label="Mark as verified" description="User email will be pre-verified" />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
