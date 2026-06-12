import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import { useAdminUsers, useUpdateUserStatus } from "@/features/admin/admin.query";
import type { AdminUserItem, GetAdminUsersParams, UserStatus } from "@/types/admin.type";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useDebounce } from "@/hooks/useDebounce";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const STATUS_COLORS: Record<UserStatus, string> = {
  ACTIVE: "bg-green-100 text-green-700 hover:bg-green-100",
  INACTIVE: "bg-zinc-100 text-zinc-600 hover:bg-zinc-100",
  BANNED: "bg-red-100 text-red-700 hover:bg-red-100",
};

const STATUS_LABEL_KEYS: Record<UserStatus, string> = {
  ACTIVE: "statusActive",
  INACTIVE: "statusInactive",
  BANNED: "statusBanned",
};

export default function AdminUsersPage() {
  const { t } = useTranslation(["admin", "common"]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<UserStatus | "ALL">("ALL");
  const [role, setRole] = useState<"USER" | "ADMIN" | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [confirmUser, setConfirmUser] = useState<{ user: AdminUserItem; nextStatus: UserStatus } | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  const params: GetAdminUsersParams = {
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    status: status !== "ALL" ? status : undefined,
    role: role !== "ALL" ? role : undefined,
  };

  const { data, isLoading } = useAdminUsers(params);
  const { mutate: updateStatus, isPending } = useUpdateUserStatus();

  const users = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta?.pagination?.totalPages ?? 1;

  function handleStatusAction(user: AdminUserItem) {
    const nextStatus: UserStatus = user.status === "BANNED" ? "ACTIVE" : "BANNED";
    setConfirmUser({ user, nextStatus });
  }

  function confirmStatusChange() {
    if (!confirmUser) return;
    updateStatus(
      { userId: confirmUser.user.id, payload: { status: confirmUser.nextStatus } },
      { onSuccess: () => setConfirmUser(null) },
    );
  }

  return (
    <>
      <Helmet>
        <title>{t("admin:usersTitle")} — Admin</title>
      </Helmet>

      <div className="flex flex-1 flex-col overflow-hidden p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">{t("admin:usersTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("admin:usersSubtitle")}</p>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("admin:searchPlaceholder")}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={(v) => { setStatus(v as UserStatus | "ALL"); setPage(1); }}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder={t("admin:filterStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("admin:filterAll")}</SelectItem>
              <SelectItem value="ACTIVE">{t("admin:statusActive")}</SelectItem>
              <SelectItem value="INACTIVE">{t("admin:statusInactive")}</SelectItem>
              <SelectItem value="BANNED">{t("admin:statusBanned")}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={role} onValueChange={(v) => { setRole(v as "USER" | "ADMIN" | "ALL"); setPage(1); }}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder={t("admin:filterRole")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("admin:filterAll")}</SelectItem>
              <SelectItem value="USER">{t("admin:roleUser")}</SelectItem>
              <SelectItem value="ADMIN">{t("admin:roleAdmin")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("admin:colUser")}</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("admin:colRole")}</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("admin:colStatus")}</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">{t("admin:colPosts")}</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">{t("admin:colFollowers")}</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("admin:colJoined")}</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("admin:colActions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3"><Skeleton className="h-8 w-40" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-14" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-16" /></td>
                      <td className="px-4 py-3 text-right"><Skeleton className="ml-auto h-5 w-8" /></td>
                      <td className="px-4 py-3 text-right"><Skeleton className="ml-auto h-5 w-8" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-20" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-7 w-16" /></td>
                    </tr>
                  ))
                : users.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8">
                            <AvatarImage src={u.avatar ?? undefined} />
                            <AvatarFallback className="text-xs">{u.name[0]?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium leading-none">{u.name}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">@{u.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs">
                          {u.role === "ADMIN" ? t("admin:roleAdmin") : t("admin:roleUser")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[u.status as UserStatus]}`}>
                          {t(`admin:${STATUS_LABEL_KEYS[u.status]}`)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{u.totalPosts}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{u.totalFollowers}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant={u.status === "BANNED" ? "outline" : "destructive"}
                          className="h-7 text-xs"
                          onClick={() => handleStatusAction(u)}
                          disabled={u.role === "ADMIN"}
                        >
                          {u.status === "BANNED" ? t("admin:actionUnban") : t("admin:actionBan")}
                        </Button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>{t("admin:pageOf", { current: page, total: totalPages })}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Confirm dialog */}
      <Dialog open={!!confirmUser} onOpenChange={(open) => !open && setConfirmUser(null)}>
        <DialogContent className="xl:w-full xl:h-auto xl:max-w-sm p-6 flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>
              {confirmUser?.nextStatus === "BANNED" ? t("admin:confirmBanTitle") : t("admin:confirmUnbanTitle")}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {confirmUser?.nextStatus === "BANNED"
              ? t("admin:confirmBanBody", { username: confirmUser?.user.username })
              : t("admin:confirmUnbanBody", { username: confirmUser?.user.username })}
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmUser(null)}>{t("common:cancel")}</Button>
            <Button
              variant={confirmUser?.nextStatus === "BANNED" ? "destructive" : "default"}
              onClick={confirmStatusChange}
              disabled={isPending}
            >
              {t("common:confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
