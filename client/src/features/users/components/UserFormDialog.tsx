// src/features/users/components/UserFormDialog.tsx
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const createForm = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: "", email: "", role: "USER", status: "ACTIVE", password: "", isVerified: false },
  });

  const editForm = useForm<UpdateUserFormValues>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: { name: "", role: "USER" },
  });

  useEffect(() => {
    if (user && isEdit) {
      editForm.reset({ name: user.name, role: user.role });
    } else {
      createForm.reset({ name: "", email: "", role: "USER", status: "ACTIVE", password: "", isVerified: false });
    }
    setAvatarFile(null);
    setAvatarPreview(null);
  }, [user, open]);

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function onCreateSubmit(values: CreateUserFormValues) {
    const payload = { ...values, password: values.password || undefined };
    createMutation.mutate(payload, {
      onSuccess: () => onOpenChange(false),
    });
  }

  function onEditSubmit(values: UpdateUserFormValues) {
    if (!user) return;
    updateMutation.mutate(
      { id: user.id, data: { ...values, avatar: avatarFile ?? undefined } },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  const isPending = createMutation.isPending || updateMutation.isPending;
  const displayAvatar = avatarPreview ?? user?.avatar ?? undefined;
  const avatarInitial = (user?.name ?? "U")[0].toUpperCase();

  if (isEdit) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="flex flex-col gap-4 p-6">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>

            <div className="flex justify-center">
              <div className="relative w-fit">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={displayAvatar} alt={user?.name} />
                  <AvatarFallback className="text-lg">{avatarInitial}</AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute bottom-0 right-0 rounded-full bg-primary p-1.5 text-primary-foreground shadow"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
            </div>
            {avatarFile && (
              <p className="text-center text-xs text-muted-foreground">{avatarFile.name}</p>
            )}

            <ShortTextField control={editForm.control} name="name" label="Name" placeholder="Full name" />
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
