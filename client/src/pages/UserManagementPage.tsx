import { Users } from "lucide-react";

export default function UserManagementPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="size-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-semibold">User Management</h1>
          <p className="text-sm text-muted-foreground">Manage system users and roles</p>
        </div>
      </div>

      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        User management content coming in Batch 2
      </div>
    </div>
  );
}
