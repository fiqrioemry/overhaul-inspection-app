// src/pages/InspectionRequestCreatePage.tsx
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import InspectionRequestForm from "@/features/inspection-requests/components/InspectionRequestForm";
import { ROUTES } from "@/constants/route.constant";

export default function InspectionRequestCreatePage() {
  const navigate = useNavigate();
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.INSPECTION_REQUESTS)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div>
          <h1 className="text-lg font-semibold">Create Inspection Request</h1>
          <p className="text-xs text-muted-foreground">Generate a digital inspection/test request form</p>
        </div>
      </div>
      <InspectionRequestForm />
    </div>
  );
}
