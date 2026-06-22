import { Link, useNavigate } from "react-router-dom";
import { ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/route.constant";

export default function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-6 text-center p-6">
      <div className="flex size-20 items-center justify-center rounded-full bg-destructive/10">
        <ShieldOff className="size-10 text-destructive" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground max-w-sm">You don't have permission to view this page. Contact your administrator if you think this is a mistake.</p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Go back
        </Button>
        <Button asChild>
          <Link to={ROUTES.DASHBOARD}>Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
