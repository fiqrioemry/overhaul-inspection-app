// src/components/layout/AppLayout.tsx
import MainSidebar from "./MainSidebar";
import RightSidebar from "./RightSidebar";
import { Outlet } from "react-router-dom";
import MobileBottomNav from "./MobileBottomNav";

interface AppLayoutProps {
  showRightSidebar?: boolean;
  fullWidth?: boolean;
}

export default function AppLayout({ showRightSidebar = true, fullWidth = false }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <MainSidebar />

      {/* Main area */}
      <div className="md:ml-64 xl:ml-72 flex min-h-screen">
        {/* Center content */}
        <main className={fullWidth ? "flex-1 min-w-0 pb-20 md:pb-6" : "flex-1 min-w-0 pb-20 md:pb-6 max-w-6xl mx-auto w-full px-4 md:px-6 py-6"}>
          <Outlet />
        </main>

        {/* Right Sidebar */}
        {showRightSidebar && (
          <aside className="hidden xl:block w-80 shrink-0 sticky top-0 h-screen overflow-y-auto py-6 px-6 border-l">
            <RightSidebar />
          </aside>
        )}
      </div>

      {/* Mobile Bottom Nav */}
      <MobileBottomNav />
    </div>
  );
}
