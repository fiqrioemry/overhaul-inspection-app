import { Loader2 } from "lucide-react";

export default function AuthLoading() {
  return (
    <div className="h-screen flex items-center justify-center ">
      <div className="flex items-center justify-center">
        <div>
          <Loader2 size={50} className="animate-spin" />
          <p>Loading ...</p>
        </div>
      </div>
    </div>
  );
}
