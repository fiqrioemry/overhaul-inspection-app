import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center relative">
      {/* Subtle dot accent */}
      <span className="absolute top-8 right-8 w-1.5 h-1.5 rounded-full bg-[#222]" />

      <div className="text-center">
        {/* Large editorial number — center digit italicized */}
        <div className="flex items-baseline justify-center leading-none select-none">
          <span className="text-[120px] tracking-[-6px] text-[#1a1a1a]">4</span>
          <span className="text-[120px] tracking-[-6px] text-white italic">0</span>
          <span className="text-[120px] tracking-[-6px] text-[#1a1a1a]">4</span>
        </div>

        {/* Thin divider */}
        <div className="w-8 h-px bg-[#333] mx-auto my-6" />

        <p className="text-sm uppercase tracking-[0.08em] mb-8">Page not found</p>

        <Button onClick={() => navigate("/")}>Go home</Button>
      </div>
    </div>
  );
}
