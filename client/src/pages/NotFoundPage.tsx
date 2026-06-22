import { Link, useNavigate } from "react-router-dom";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/route.constant";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex h-full min-h-screen flex-col items-center justify-center gap-6 text-center p-6">
      <div className="flex size-20 items-center justify-center rounded-full bg-muted">
        <FileQuestion className="size-10 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Page not found</h1>
        <p className="text-muted-foreground max-w-sm">The page you're looking for doesn't exist or has been moved.</p>
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
