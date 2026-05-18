import { Construction } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen mx-auto max-w-7xl">
      <div className="flex flex-col items-center justify-center h-screen">
        <Construction className="mx-auto  text-gray-400" size={64} />
        <h1 className="text-4xl font-bold text-center mt-8">404 - Not Found</h1>
        <p className="text-center mt-4 text-lg">The page you are looking for does not exist.</p>
      </div>
    </div>
  );
}
