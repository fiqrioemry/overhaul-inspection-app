// src/pages/UserManagementPage.tsx
import { useState } from "react";
import { format } from "date-fns";
import { Users, Plus, Pencil, Trash2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/common/PageHeader";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import StatusBadge from "@/components/common/StatusBadge";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import Pagination from "@/components/common/Pagination";
import PermissionGate from "@/components/common/PermissionGate";
import FilterSelect from "@/components/fields/FilterSelect";
import UserFormDialog from "@/features/users/components/UserFormDialog";
import UserStatusDialog from "@/features/users/components/UserStatusDialog";
import { useUsers, useDeleteUser } from "@/features/users/users.query";
import type { UserListItem } from "@/features/users/users.api";
import { PERMISSIONS } from "@/constants/permission.constant";
import { useDebounce } from "@/hooks/useDebounce";

const ROLE_OPTIONS = [
  { label: "User", value: "USER" },
  { label: "Inspector", value: "INSPECTOR" },
  { label: "Admin", value: "ADMIN" },
  { label: "Super Admin", value: "SUPER_ADMIN" },
];

const ROLE_LABEL: Record<string, string> = {
  USER: "User",
  INSPECTOR: "Inspector",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super Admin",
};

export default function UserManagementPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserListItem | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<UserListItem | undefined>();

  const debouncedSearch = useDebounce(search, 400);
  const { data, isLoading, isError, refetch } = useUsers({ page, limit: 10, search: debouncedSearch, role: role || undefined });
  const deleteMutation = useDeleteUser();

  function openCreate() {
    setSelectedUser(undefined);
    setFormOpen(true);
  }

  function openEdit(user: UserListItem) {
    setSelectedUser(user);
    setFormOpen(true);
  }

  function openStatus(user: UserListItem) {
    setSelectedUser(user);
    setStatusOpen(true);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(undefined) });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Manage system users, roles, and access"
        action={
          <PermissionGate permission={PERMISSIONS.USER_CREATE}>
            <Button onClick={openCreate}>
              <Plus />
              Create User
            </Button>
          </PermissionGate>
        }
      />

      <div className="flex items-center gap-3">
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
        <div className="ml-auto flex items-center gap-2">
          <FilterSelect
            value={role}
            onChange={(v) => {
              setRole(v);
              setPage(1);
            }}
            options={ROLE_OPTIONS}
            placeholder="Role"
            allLabel="All Roles"
          />
          {(search || role) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setRole("");
                setPage(1);
              }}
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {isLoading && <LoadingState />}
      {isError && <ErrorState message="Failed to load users." onRetry={() => refetch()} />}

      {!isLoading && !isError && (
        <>
          {!data?.items?.length ? (
            <EmptyState title="No users found" description="Create a user to get started." icon={Users} />
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Name</th>
                    <th className="px-4 py-3 text-left font-medium">Email</th>
                    <th className="px-4 py-3 text-left font-medium">Company</th>
                    <th className="px-4 py-3 text-left font-medium">Role</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Verified</th>
                    <th className="px-4 py-3 text-left font-medium">Last Login</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.items.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">{user.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {user.company?.name ?? "—"}
                        {user.position && <span className="block text-xs text-muted-foreground/70">{user.position}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs">
                          {ROLE_LABEL[user.role] ?? user.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={user.status} />
                      </td>
                      <td className="px-4 py-3">{user.verifiedAt ? <span className="text-xs text-green-600 dark:text-green-400">Verified</span> : <span className="text-xs text-muted-foreground">Unverified</span>}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{user.lastLogin ? format(new Date(user.lastLogin), "dd MMM yyyy HH:mm") : "Never"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <PermissionGate permission={PERMISSIONS.USER_UPDATE}>
                            <Button variant="ghost" size="icon-sm" title="Change status" onClick={() => openStatus(user)}>
                              <ShieldCheck />
                            </Button>
                          </PermissionGate>
                          <PermissionGate permission={PERMISSIONS.USER_UPDATE}>
                            <Button variant="ghost" size="icon-sm" title="Edit user" onClick={() => openEdit(user)}>
                              <Pencil />
                            </Button>
                          </PermissionGate>
                          <PermissionGate permission={PERMISSIONS.USER_DELETE}>
                            <Button variant="ghost" size="icon-sm" title="Delete user" onClick={() => setDeleteTarget(user)}>
                              <Trash2 className="text-destructive" />
                            </Button>
                          </PermissionGate>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data?.meta && data.meta.totalPages > 1 && <Pagination meta={data.meta} onPageChange={setPage} />}
        </>
      )}

      <UserFormDialog open={formOpen} onOpenChange={setFormOpen} user={selectedUser} />
      <UserStatusDialog open={statusOpen} onOpenChange={setStatusOpen} user={selectedUser} />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(undefined);
        }}
        title="Delete User"
        description={`Delete user "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
