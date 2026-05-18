// src/features/settings/components/AvatarUploader.tsx
import { useState, useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUpdateAvatar } from "@/features/users/users.query";
import { useAuthStore } from "@/stores/auth.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function AvatarUploader() {
  const { user } = useAuthStore();
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateAvatar = useUpdateAvatar();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Invalid file type. Please upload JPG, PNG, or WebP");
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large. Maximum size is 2MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload avatar immediately
    updateAvatar.mutate(file, {
      onSuccess: () => {
        setPreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      },
      onError: () => {
        setPreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      },
    });
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const currentAvatar = preview || user?.avatar || "/default-avatar.png";
  const isLoading = updateAvatar.isPending;

  return (
    <div className="flex items-center gap-6">
      {/* Avatar Preview */}
      <div className="relative group">
        <div className="h-24 w-24 rounded-full overflow-hidden ring-2 ring-border">
          <img src={currentAvatar} alt={user?.name || "Avatar"} className={cn("h-full w-full object-cover transition-opacity", isLoading && "opacity-50")} />
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          </div>
        )}

        {/* Hover Overlay */}
        {!isLoading && (
          <button type="button" onClick={handleClick} className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <Camera className="h-6 w-6 text-white" />
          </button>
        )}
      </div>

      {/* Upload Button */}
      <div className="flex flex-col gap-2">
        <Button type="button" variant="outline" size="sm" onClick={handleClick} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            "Change Avatar"
          )}
        </Button>

        <p className="text-xs text-muted-foreground">JPG, PNG or WebP. Max 2MB</p>
      </div>

      {/* Hidden File Input */}
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="hidden" />
    </div>
  );
}
