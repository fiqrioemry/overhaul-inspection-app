// src/components/layout/Sidebar.tsx
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Database,
  AlertTriangle,
  FileText,
  ClipboardCheck,
  Bell,
  Users,
  ChevronDown,
  ChevronRight,
  Settings,
  BookOpen,
  Building2,
  Layers,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";
import { PERMISSIONS } from "@/constants/permission.constant";
import { ROUTES } from "@/constants/route.constant";

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
}

interface NavGroup {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permissions: string[];
  children: NavItem[];
}

const mainNav: NavItem[] = [
  { label: "Dashboard", to: ROUTES.DASHBOARD, icon: LayoutDashboard, permission: PERMISSIONS.DASHBOARD_READ },
  { label: "Tanks", to: ROUTES.TANKS, icon: Database, permission: PERMISSIONS.TANK_READ },
  { label: "Findings", to: ROUTES.FINDINGS, icon: AlertTriangle, permission: PERMISSIONS.FINDING_READ },
  { label: "Daily Reports", to: ROUTES.DAILY_REPORTS, icon: FileText, permission: PERMISSIONS.DAILY_REPORT_READ },
  { label: "Inspection Requests", to: ROUTES.INSPECTION_REQUESTS, icon: ClipboardCheck, permission: PERMISSIONS.INSPECTION_REQUEST_READ },
  { label: "Notifications", to: ROUTES.NOTIFICATIONS, icon: Bell, permission: PERMISSIONS.NOTIFICATION_READ },
];

const masterDataGroup: NavGroup = {
  label: "Master Data",
  icon: Settings,
  permissions: [
    PERMISSIONS.MASTER_PROCESS_READ,
    PERMISSIONS.ACCEPTANCE_CRITERIA_READ,
    PERMISSIONS.REFERENCE_DOCUMENT_READ,
    PERMISSIONS.COMPANY_READ,
  ],
  children: [
    { label: "Process Templates", to: ROUTES.MASTER_PROCESS, icon: Layers, permission: PERMISSIONS.MASTER_PROCESS_READ },
    { label: "Acceptance Criteria", to: ROUTES.MASTER_CRITERIA, icon: BookOpen, permission: PERMISSIONS.ACCEPTANCE_CRITERIA_READ },
    { label: "Reference Documents", to: ROUTES.MASTER_REFERENCE_DOCS, icon: FileText, permission: PERMISSIONS.REFERENCE_DOCUMENT_READ },
    { label: "Companies", to: ROUTES.MASTER_COMPANIES, icon: Building2, permission: PERMISSIONS.COMPANY_READ },
  ],
};

const adminNav: NavItem[] = [
  { label: "User Management", to: ROUTES.USERS, icon: Users, permission: PERMISSIONS.USER_READ },
];

function NavItemLink({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === ROUTES.DASHBOARD}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )
      }
    >
      <item.icon className="size-4 shrink-0" />
      <span className="truncate">{item.label}</span>
    </NavLink>
  );
}

function MasterDataGroup({ group }: { group: NavGroup }) {
  const canAny = useAuthStore((s) => s.canAny);
  const can = useAuthStore((s) => s.can);
  const [expanded, setExpanded] = useState(false);

  if (!canAny(group.permissions)) return null;

  const visibleChildren = group.children.filter((c) => !c.permission || can(c.permission));

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <group.icon className="size-4 shrink-0" />
        <span className="flex-1 truncate text-left">{group.label}</span>
        {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
      </button>

      {expanded && (
        <div className="ml-4 mt-1 space-y-1 border-l pl-3">
          {visibleChildren.map((child) => (
            <NavItemLink key={child.to} item={child} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const can = useAuthStore((s) => s.can);

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r bg-background">
      {/* Logo */}
      <div className="flex h-14 items-center border-b px-4">
        <span className="font-bold text-lg tracking-tight">
          Overhaul<span className="text-primary">.</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {mainNav.map((item) => {
          if (item.permission && !can(item.permission)) return null;
          return <NavItemLink key={item.to} item={item} />;
        })}

        <div className="my-2 border-t" />

        <MasterDataGroup group={masterDataGroup} />

        <div className="my-2 border-t" />

        {adminNav.map((item) => {
          if (item.permission && !can(item.permission)) return null;
          return <NavItemLink key={item.to} item={item} />;
        })}
      </nav>
    </aside>
  );
}
