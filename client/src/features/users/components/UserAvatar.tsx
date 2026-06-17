import type { User } from "@/types/users.type";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type UserAvatarProps = {
  user: User;
  size?: "sm" | "md" | "lg" | "xl";
};

export default function UserAvatar({ user, size = "xl" }: UserAvatarProps & { size?: "sm" | "md" | "lg" | "xl" }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-10 w-10",
  };

  return (
    <Avatar className={`${sizeClasses[size]} ring-2 ring-offset-1 ring-gradient-to-tr ring-pink-500`}>
      <AvatarImage src={user?.avatar ?? "/default-avatar.png"} alt={user?.avatar ? "Avatar" : "Default Avatar"} />
      <AvatarFallback className="text-xs font-bold">{user?.name?.slice(0, 2).toUpperCase() ?? "U"}</AvatarFallback>
    </Avatar>
  );
}
