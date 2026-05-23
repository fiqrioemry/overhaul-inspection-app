import { Link } from "react-router-dom";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PostNotFound() {
  return (
    <div className="flex flex-col h-screen items-center justify-center text-center px-6">
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
        <FileQuestion className="w-10 h-10 text-muted-foreground" />
      </div>

      <h1 className="text-2xl font-bold tracking-tight">Post not found</h1>

      <p className="mt-2 text-sm text-muted-foreground max-w-md">The post may have been deleted, archived, or the link is invalid.</p>

      <div className="flex items-center gap-3 mt-6">
        <Button asChild>
          <Link to="/">Back to home</Link>
        </Button>

        <Button variant="outline" onClick={() => window.history.back()}>
          Go back
        </Button>
      </div>
    </div>
  );
}
