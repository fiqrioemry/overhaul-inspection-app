// src/pages/ProfilePage.tsx
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, formatDistanceToNow } from "date-fns";
import { Camera, Laptop, LogOut, Shield, Trash2, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import ShortTextField from "@/components/fields/ShortTextField";
import PasswordField from "@/components/fields/PasswordField";
import PageHeader from "@/components/common/PageHeader";
import ConfirmDialog from "@/components/common/ConfirmDialog";

import { useAuthStore } from "@/stores/auth.store";
import {
  useUpdateProfile,
  useUpdateAvatar,
  useChangePassword,
  useSessions,
  useDeleteSession,
  useRevokeAllSessions,
} from "@/features/auth/auth.query";
import { ROUTES } from "@/constants/route.constant";

function userInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

// ── Schemas ──────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ProfileFormValues = z.infer<typeof profileSchema>;
type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

// ── Profile tab ───────────────────────────────────────────────────────────────

function ProfileTab() {
  const user = useAuthStore((s) => s.user);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const updateProfile = useUpdateProfile();
  const updateAvatar = useUpdateAvatar();

  const { control, handleSubmit, formState: { isDirty } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? "" },
  });

  function onSubmit(values: ProfileFormValues) {
    updateProfile.mutate(values);
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) updateAvatar.mutate(file);
    e.target.value = "";
  }

  return (
    <div className="space-y-6 max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Avatar</CardTitle>
          <CardDescription>Click the avatar to upload a new photo.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="relative group w-20 h-20">
              <Avatar className="size-20">
                <AvatarImage src={user?.avatar ?? undefined} alt={user?.name} />
                <AvatarFallback className="text-xl">{user?.name ? userInitials(user.name) : "?"}</AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={updateAvatar.isPending}
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
              >
                <Camera className="size-5 text-white" />
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <div>
              <p className="font-medium">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <p className="text-xs text-muted-foreground mt-1 capitalize">{user?.role?.replace("_", " ")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your display name.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <ShortTextField control={control} name="name" label="Full Name" placeholder="Your name" />

            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">Email</p>
              <p className="text-sm text-muted-foreground border rounded-md px-3 py-2 bg-muted/50">
                {user?.email}
              </p>
              <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
            </div>

            <Button type="submit" disabled={!isDirty || updateProfile.isPending}>
              {updateProfile.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Security tab ──────────────────────────────────────────────────────────────

function SecurityTab() {
  const changePasswordMutation = useChangePassword();

  const { control, handleSubmit, reset, formState: { isDirty } } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  function onSubmit(values: ChangePasswordFormValues) {
    changePasswordMutation.mutate(
      { currentPassword: values.currentPassword, newPassword: values.newPassword, confirmPassword: values.confirmPassword },
      { onSuccess: () => reset() },
    );
  }

  return (
    <div className="space-y-6 max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Enter your current password and choose a new one. New password must be at least 8
            characters and contain an uppercase letter and a number.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <PasswordField
              control={control}
              name="currentPassword"
              label="Current Password"
              placeholder="••••••••"
              autoComplete="current-password"
            />
            <PasswordField
              control={control}
              name="newPassword"
              label="New Password"
              placeholder="••••••••"
              autoComplete="new-password"
            />
            <PasswordField
              control={control}
              name="confirmPassword"
              label="Confirm New Password"
              placeholder="••••••••"
              autoComplete="new-password"
            />
            <Button type="submit" disabled={!isDirty || changePasswordMutation.isPending}>
              {changePasswordMutation.isPending ? "Updating…" : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Sessions tab ──────────────────────────────────────────────────────────────

function parseUserAgent(ua: string | null): string {
  if (!ua) return "Unknown device";
  if (/mobile/i.test(ua)) return "Mobile browser";
  if (/chrome/i.test(ua)) return "Chrome";
  if (/firefox/i.test(ua)) return "Firefox";
  if (/safari/i.test(ua)) return "Safari";
  if (/edge/i.test(ua)) return "Edge";
  return "Browser";
}

function SessionsTab() {
  const navigate = useNavigate();
  const { data: sessions, isLoading } = useSessions();
  const deleteSessionMutation = useDeleteSession();
  const revokeAllMutation = useRevokeAllSessions();
  const [revokeAllOpen, setRevokeAllOpen] = useState(false);

  function handleRevokeAll() {
    revokeAllMutation.mutate(undefined, {
      onSuccess: () => navigate(ROUTES.LOGIN, { replace: true }),
    });
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Active Sessions</CardTitle>
            <CardDescription>
              Devices and browsers where your account is currently signed in.
            </CardDescription>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setRevokeAllOpen(true)}
            disabled={revokeAllMutation.isPending}
          >
            <LogOut className="size-4 mr-2" />
            Revoke All
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-6 py-4 flex items-center gap-4">
                  <Skeleton className="size-9 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-60" />
                  </div>
                </div>
              ))}
            </div>
          ) : !sessions?.length ? (
            <div className="py-12 text-center text-muted-foreground">
              <Laptop className="size-8 mx-auto mb-3 opacity-40" />
              <p>No active sessions found</p>
            </div>
          ) : (
            <div className="divide-y">
              {sessions.map((session) => (
                <div key={session.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="size-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Laptop className="size-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{parseUserAgent(session.userAgent)}</p>
                      {session.isCurrent && (
                        <Badge variant="secondary" className="text-xs">Current</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {session.ipAddress ?? "Unknown IP"} ·{" "}
                      {session.lastUsedAt && !isNaN(new Date(session.lastUsedAt).getTime())
                        ? `Last active ${formatDistanceToNow(new Date(session.lastUsedAt), { addSuffix: true })}`
                        : session.createdAt && !isNaN(new Date(session.createdAt).getTime())
                          ? `Created ${format(new Date(session.createdAt), "PP")}`
                          : "Recently active"}
                    </p>
                  </div>
                  {!session.isCurrent && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive shrink-0"
                      disabled={deleteSessionMutation.isPending}
                      onClick={() => deleteSessionMutation.mutate(session.id)}
                    >
                      <Trash2 className="size-4" />
                      <span className="sr-only">Revoke session</span>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={revokeAllOpen}
        onOpenChange={setRevokeAllOpen}
        title="Revoke All Sessions"
        description="This will sign you out from all devices including this one. You will be redirected to the login page."
        confirmLabel="Revoke All & Sign Out"
        variant="destructive"
        onConfirm={handleRevokeAll}
        loading={revokeAllMutation.isPending}
      />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Manage your personal information, password, and active sessions."
      />
      <Separator />

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="gap-2">
            <User className="size-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="size-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="sessions" className="gap-2">
            <Laptop className="size-4" />
            Sessions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab />
        </TabsContent>
        <TabsContent value="security">
          <SecurityTab />
        </TabsContent>
        <TabsContent value="sessions">
          <SessionsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
